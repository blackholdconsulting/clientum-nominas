// app/payroll/[id]/actions.ts
'use server';
import { createClient } from '@/utils/supabase/server';

export async function updateItem(itemId: string, patch: Record<string, any>) {
  const s = createClient();
  const up = await s.from('payroll_items').update(patch).eq('id', itemId).select('payroll_id').single();
  if (up.error) throw new Error(up.error.message);

  // Recalcular header
  const pid = up.data.payroll_id as string;
  const it = await s.from('payroll_items').select('*').eq('payroll_id', pid);
  const totals = (it.data ?? []).reduce((acc: any, r: any) => {
    const g = Number(r.base_salary ?? 0) + Number(r.bonus ?? 0) +
              Number(r.overtime ?? 0)    + Number(r.other_income ?? 0);
    const d = g*(Number(r.irpf_rate ?? 0)) + g*(Number(r.ss_rate ?? 0)) + Number(r.other_deduction ?? 0);
    acc.gross += g; acc.net += (g-d); return acc;
  }, {gross:0, net:0});
  await s.from('payrolls').update({ gross_total: totals.gross, net_total: totals.net }).eq('id', pid);
}

export async function finalizePayroll(payrollId: string) {
  const s = createClient();
  const up = await s.from('payrolls').update({ status: 'processed' }).eq('id', payrollId);
  if (up.error) throw new Error(up.error.message);
}
