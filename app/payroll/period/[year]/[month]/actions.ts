'use server';

import { createServerClient } from '@/utils/supabase/server'; // tu helper actual
import { redirect } from 'next/navigation';

export async function openMonthEditorAction(year: number, month: number) {
  const supabase = await createServerClient();

  try {
    // Quién es
    const { data: userRes, error: uErr } = await supabase.auth.getUser();
    if (uErr || !userRes?.user) throw new Error('auth');

    // Empleados del dueño
    const { data: employees, error: eErr } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userRes.user.id);
    if (eErr) throw eErr;

    // Crea (o mantiene) una nómina DRAFT por empleado
    for (const emp of employees ?? []) {
      const { error: upErr } = await supabase
        .from('payrolls')
        .upsert({
          id: crypto.randomUUID(),
          user_id: userRes.user.id,
          employee_id: emp.id,
          period_year: year,
          period_month: month,
          status: 'draft',
        }, { onConflict: 'user_id,employee_id,period_year,period_month', ignoreDuplicates: true });

      if (upErr && upErr.code !== '23505') throw upErr; // ignora duplicado
    }

    // A la lista/“editor del mes”
    redirect(`/payroll/period/${year}/${month}/editor`);
  } catch (err) {
    console.error('[openMonthEditorAction]', err);
    // si algo falla, al menos aterriza en la lista donde verás el error
    redirect(`/payroll/period/${year}/${month}/editor?error=1`);
  }
}
