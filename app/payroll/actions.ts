// app/payroll/actions.ts
"use server";

import { createSupabaseServer } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function generatePayroll(year: number, month: number) {
  if (!year || !month) throw new Error("Periodo inválido");

  const s = createSupabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await s.auth.getUser();
  if (userErr || !user) throw new Error("Sesión no válida");

  // 1) Upsert de cabecera (único por usuario+año+mes)
  const { data: header, error: upsertErr } = await s
    .from("payrolls")
    .upsert(
      {
        user_id: user.id,
        period_year: year,
        period_month: month,
        status: "draft",
      },
      { onConflict: "user_id,period_year,period_month" }
    )
    .select("id")
    .single();

  if (upsertErr) throw upsertErr;

  const payrollId = header.id as string;

  // 2) Trae empleados del usuario
  const { data: employees, error: empErr } = await s
    .from("employees")
    .select("id")
    .eq("user_id", user.id);
  if (empErr) throw empErr;

  // 3) Asegura items por empleado (solo los que falten)
  if (employees && employees.length) {
    const { data: existing, error: existErr } = await s
      .from("payroll_items")
      .select("employee_id")
      .eq("payroll_id", payrollId);
    if (existErr) throw existErr;

    const existingIds = new Set((existing ?? []).map((r) => r.employee_id));
    const rows = employees
      .filter((e) => !existingIds.has(e.id))
      .map((e) => ({
        payroll_id: payrollId,
        employee_id: e.id,
        base_gross: 0,
        irpf_amount: 0,
        ss_emp_amount: 0,
        ss_er_amount: 0,
        net: 0,
      }));

    if (rows.length) {
      const { error: insErr } = await s.from("payroll_items").insert(rows);
      if (insErr) throw insErr;
    }
  }

  revalidatePath("/payroll");
  return payrollId;
}

