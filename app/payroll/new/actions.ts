// app/payroll/new/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

type EmployeeRow = { id: string; base_salary: number | null };

export async function createOrOpenPayroll({
  year,
  month,
}: { year: number; month: number }) {
  const supabase = createClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('No autenticado');

  // 1) Cabecera del periodo (si existe, la reusa)
  let { data: header, error: selErr } = await supabase
    .from('payrolls')
    .select('*')
    .eq('user_id', user.id)
    .eq('period_year', year)
    .eq('period_month', month)
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);

  if (!header) {
    const ins = await supabase
      .from('payrolls')
      .insert({ user_id: user.id, period_year: year, period_month: month, status: 'draft' })
      .select('*')
      .single();
    if (ins.error) throw new Error(ins.error.message);
    header = ins.data;
  }

  // 2) Precarga: copia del mes anterior o de employees
  let prevYear = year, prevMonth = month - 1;
  if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }

  const { data: prevHdr } = await supabase
    .from('payrolls')
    .select('id')
    .eq('user_id', user.id)
    .eq('period_year', prevYear)
    .eq('period_month', prevMonth)
    .maybeSingle();

  let prevItems: any[] = [];
  if (prevHdr?.id) {
    const q = await supabase
      .from('payroll_items')
      .select('employee_id, base_salary, bonus, overtime, other_income, irpf_rate, ss_rate, other_deduction, notes')
      .eq('payroll_id', prevHdr.id);
    if (q.error) throw new Error(q.error.message);
    prevItems = q.data ?? [];
  }
  const prevMap = new Map(prevItems.map(i => [i.employee_id, i]));

  // Empleados del usuario
  const em = await supabase
    .from('employees')
    .select('id, base_salary')
    .order('created_at', { ascending: false });
  if (em.error) throw new Error(em.error.message);
  const employees: EmployeeRow[] = (em.data ?? []) as any;

  // Filas a upsert
  const rows = employees.map(e => {
    const p = prevMap.get(e.id);
    return {
      payroll_id: header!.id,
      user_id: user.id,
      employee_id: e.id,
      base_salary: p?.base_salary ?? e.base_salary ?? 0,
      bonus:        p?.bonus ?? 0,
      overtime:     p?.overtime ?? 0,
      other_income: p?.other_income ?? 0,
      irpf_rate:    p?.irpf_rate ?? 0.15,
      ss_rate:      p?.ss_rate ?? 0.063,
      other_deduction: p?.other_deduction ?? 0,
      notes: p?.notes ?? null,
    };
  });

  if (rows.length) {
    const up = await supabase
      .from('payroll_items')
      .upsert(rows, { onConflict: 'payroll_id,employee_id' });
    if (up.error) throw new Error(up.error.message);
  }

  // 3) Recalcular totales del header
  const it = await supabase
    .from('payroll_items')
    .select('*')
    .eq('payroll_id', header.id);
  if (it.error) throw new Error(it.error.message);

  const totals = (it.data ?? []).reduce((acc: any, r: any) => {
    const gross = Number(r.base_salary ?? 0) + Number(r.bonus ?? 0) +
                  Number(r.overtime ?? 0)    + Number(r.other_income ?? 0);
    const ded   = gross * Number(r.irpf_rate ?? 0) +
                  gross * Number(r.ss_rate ?? 0) +
                  Number(r.other_deduction ?? 0);
    acc.gross += gross;
    acc.net   += (gross - ded);
    return acc;
  }, { gross: 0, net: 0 });

  const upd = await supabase
    .from('payrolls')
    .update({ gross_total: totals.gross, net_total: totals.net })
    .eq('id', header.id);
  if (upd.error) throw new Error(upd.error.message);

  return { payrollId: header.id };
}
