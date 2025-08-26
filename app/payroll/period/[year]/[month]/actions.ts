'use server';

import { createSupabaseServer } from '@/utils/supabase/server';

type EnsureArgs = { year: number; month: number };

export async function ensurePayrollPeriod({ year, month }: EnsureArgs): Promise<string> {
  const supabase = await createSupabaseServer();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error('No session');

  // 1) ¿Existe ya una nómina para este usuario/mes?
  const { data: existing, error: selErr } = await supabase
    .from('payrolls')
    .select('id')
    .eq('user_id', user.id)
    .eq('period_year', year)
    .eq('period_month', month)
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;

  let payrollId = existing?.id as string | undefined;

  // 2) Si no existe, la creamos
  if (!payrollId) {
    const { data: inserted, error: insErr } = await supabase
      .from('payrolls')
      .insert({
        user_id: user.id,
        period_year: year,
        period_month: month,
        status: 'draft', // o como lo llames en tu esquema
        gross_total: 0,
        net_total: 0,
      })
      .select('id')
      .single();

    if (insErr) throw insErr;
    payrollId = inserted.id;
  }

  // 3) Traemos empleados del usuario
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, base_salary, irpf_percent, ss_emp_percent, ss_er_percent')
    .eq('user_id', user.id);

  if (empErr) throw empErr;
  if (!employees?.length) throw new Error('No hay empleados para este usuario');

  // 4) ¿Hay ya líneas de esa nómina? (evita duplicar)
  const { data: itemsExisting, error: itemsCheckErr } = await supabase
    .from('payroll_items')
    .select('id', { count: 'exact', head: true })
    .eq('payroll_id', payrollId);

  if (itemsCheckErr) throw itemsCheckErr;

  if ((itemsExisting as any)?.count === 0) {
    // 5) Insertamos líneas precargadas desde los datos del empleado
    const items = employees.map((e) => {
      const base = Number(e.base_salary ?? 0);
      const irpf = +(base * (Number(e.irpf_percent ?? 0) / 100)).toFixed(2);
      const ssEmp = +(base * (Number(e.ss_emp_percent ?? 0) / 100)).toFixed(2);
      const ssEr = +(base * (Number(e.ss_er_percent ?? 0) / 100)).toFixed(2);
      const net = +(base - irpf - ssEmp).toFixed(2);

      return {
        payroll_id: payrollId!,
        employee_id: e.id,
        user_id: user.id,
        base_gross: base,
        irpf_amount: irpf,
        ss_emp_amount: ssEmp,
        ss_er_amount: ssEr,
        net,
      };
    });

    const { error: insItemsErr } = await supabase.from('payroll_items').insert(items);
    if (insItemsErr) throw insItemsErr;
  }

  // 6) Recalcula totales de cabecera (usa tu RPC/función SQL)
  // Si tu función se llama recalc_payroll_totals(payroll uuid):
  await supabase.rpc('recalc_payroll_totals', { payroll: payrollId });

  return payrollId!;
}
