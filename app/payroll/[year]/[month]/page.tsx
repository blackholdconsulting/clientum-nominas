import { createClient } from '@/utils/supabase/server';

export default async function EditPayroll({ params: { year, month } }) {
  const supabase = createClient();
  const { data: payroll } = await supabase
    .from('payrolls')
    .select('id, status, gross_total, net_total')
    .eq('period_year', Number(year))
    .eq('period_month', Number(month))
    .single();

  const { data: items } = await supabase
    .from('payroll_items')
    .select(`id, employee_id, base_gross, irpf_pct, ss_emp_pct, ss_er_pct, extras, irpf_amount, ss_emp_amount, ss_er_amount, net,
             employees (full_name, email)`)
    .eq('payroll_id', payroll?.id)
    .order('created_at');

  // Render editable (inputs para base_gross, irpf_pct, ss_emp_pct, ss_er_pct, extras.plus/minus)
  // Al guardar: update de cada línea y llamar a recalc_payroll_item + recalc_payroll_totals vía RPC simple
}
