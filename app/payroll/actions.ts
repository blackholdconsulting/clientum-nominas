"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type Line = {
  concept_code: string;
  concept_name: string;
  units: number;
  amount: number;            // +devengo / -deducción
  typ: "earning" | "deduction";
  base_cc: boolean;
  base_irpf: boolean;
  order_ix?: number;
};

export async function upsertPayroll(payload: {
  id?: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  lines: Line[];
  irpf_pct: number;
}) {
  const user = await requireUser();
  const supabase = getSupabaseServerClient();

  // Totales
  const gross = payload.lines
    .filter(l => l.typ === "earning")
    .reduce((a, b) => a + b.amount, 0);

  const deductions = payload.lines
    .filter(l => l.typ === "deduction")
    .reduce((a, b) => a + Math.abs(b.amount), 0);

  const base_cc = payload.lines.filter(l => l.base_cc).reduce((a,b)=>a+(b.amount>0?b.amount:0),0);
  const base_irpf = payload.lines.filter(l => l.base_irpf).reduce((a,b)=>a+(b.amount>0?b.amount:0),0);

  // ejemplo: cuota trabajador SS = 6.35% * base_cc (ajusta a tu conveniencia)
  const ss_employee = Number((base_cc * 0.0635).toFixed(2));
  const irpf = Number(((base_irpf * payload.irpf_pct) / 100).toFixed(2));

  const net = Number((gross - deductions - ss_employee - irpf).toFixed(2));

  let payrollId = payload.id;

  if (!payrollId) {
    // create
    const { data, error } = await supabase
      .from("payrolls")
      .insert({
        user_id: user.id,
        employee_id: payload.employee_id,
        period_year: payload.period_year,
        period_month: payload.period_month,
        gross_total: gross,
        net_total: net,
        base_cc,
        base_irpf,
        irpf_pct: payload.irpf_pct,
        ss_employee,
        ss_employer: 0, // calcula si quieres
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    payrollId = data.id;
  } else {
    const { error } = await supabase
      .from("payrolls")
      .update({
        gross_total: gross,
        net_total: net,
        base_cc,
        base_irpf,
        irpf_pct: payload.irpf_pct,
        ss_employee,
      })
      .eq("id", payrollId);
    if (error) throw new Error(error.message);

    // borro líneas existentes para reinsertar (sencillo y seguro)
    await supabase.from("payroll_lines").delete().eq("payroll_id", payrollId);
  }

  // inserta líneas
  const lines = payload.lines.map((l, ix) => ({
    ...l,
    user_id: user.id,
    payroll_id: payrollId,
    order_ix: l.order_ix ?? ix,
  }));

  const { error: e2 } = await supabase.from("payroll_lines").insert(lines);
  if (e2) throw new Error(e2.message);

  revalidatePath("/payrolls");
  return { id: payrollId };
}
