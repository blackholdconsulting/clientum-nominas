'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function updateItemAction(itemId: string, patch: Record<string, any>) {
  const s = createClient();
  const up = await s.from('payroll_items').update(patch).eq('id', itemId).select('payroll_id').single();
  if (up.error) throw new Error(up.error.message);
  revalidatePath(`/payroll/${up.data.payroll_id}`);
}

export async function finalizePayrollAction(payrollId: string) {
  const s = createClient();
  const res = await s.from('payrolls').update({ status: 'processed' }).eq('id', payrollId);
  if (res.error) throw new Error(res.error.message);
  revalidatePath(`/payroll/${payrollId}`);
}
