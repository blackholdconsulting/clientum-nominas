// app/payroll/period/[year]/[month]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs"; // <- evita Edge

function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/**
 * Crea (si no existe) la cabecera y las líneas de la nómina del periodo.
 * - Inserta payrolls (draft)
 * - upsert de payroll_items (una línea por cada employee del usuario)
 */
export async function createDraftPayroll(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  const supabase = getSupabase();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("No hay usuario autenticado");

  // 1) Cabecera (si existe, la recuperamos)
  const { data: existing, error: exErr } = await supabase
    .from("payrolls")
    .select("id")
    .eq("user_id", user.id)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();

  if (exErr) throw exErr;

  let payrollId = existing?.id;
  if (!payrollId) {
    const { data: inserted, error: insErr } = await supabase
      .from("payrolls")
      .insert({
        user_id: user.id,
        period_year: year,
        period_month: month,
        status: "draft",
        gross_total: 0,
        net_total: 0,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    payrollId = inserted!.id;
  }

  // 2) Empleados del usuario
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id);
  if (empErr) throw empErr;

  if ((employees ?? []).length > 0) {
    // upsert: evita duplicados por (payroll_id, employee_id)
    const rows = employees!.map((e) => ({
      payroll_id: payrollId,
      employee_id: e.id,
      user_id: user.id, // si tu tabla payroll_items lleva user_id (recomendado)
      base_gross: 0,
      irpf_amount: 0,
      ss_emp_amount: 0,
      ss_er_amount: 0,
      net: 0,
    }));

    const { error: upErr } = await supabase
      .from("payroll_items")
      .upsert(rows, { onConflict: "payroll_id,employee_id" }); // requiere unique en BD
    if (upErr) throw upErr;
  }

  // 3) Revalida la página del editor
  revalidatePath(`/payroll/period/${year}/${month}`);
}
