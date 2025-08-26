// app/api/payroll/generate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs"; // Fuerza runtime Node

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

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const form = await req.formData();
    const year = Number(form.get("year"));
    const month = Number(form.get("month"));

    if (!year || !month) {
      return NextResponse.json(
        { ok: false, error: "Parámetros de periodo inválidos" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    // 1) Cabecera (si existe, la usamos)
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

    // 3) upsert de líneas por empleado
    if (employees && employees.length) {
      const rows = employees.map((e) => ({
        payroll_id: payrollId,
        employee_id: e.id,
        user_id: user.id, // si tu tabla lo tiene
        base_gross: 0,
        irpf_amount: 0,
        ss_emp_amount: 0,
        ss_er_amount: 0,
        net: 0,
      }));

      // requiere índice único (payroll_id, employee_id)
      const { error: upErr } = await supabase
        .from("payroll_items")
        .upsert(rows, { onConflict: "payroll_id,employee_id" });
      if (upErr) throw upErr;
    }

    // 4) Redirige de vuelta al editor
    return NextResponse.redirect(new URL(`/payroll/period/${year}/${month}`, req.url));
  } catch (e: any) {
    // Envía el mensaje real para poder depurar
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
