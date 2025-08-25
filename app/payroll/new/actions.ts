'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function processPayrollAction(formData: FormData) {
  const supabase = createClient();

  const year  = Number(formData.get('year'));
  const month = Number(formData.get('month'));
  const ids   = (formData.getAll('employee_ids') as string[]) || [];

  const { data, error } = await supabase
    .rpc('generate_payroll', {
      period_year: year,
      period_month: month,
      employee_ids: ids.length ? ids : null
    });

  if (error) {
    throw new Error(error.message);
  }

  // Redirige a la edición del periodo
  redirect(`/payroll/${year}/${month}`);
}
