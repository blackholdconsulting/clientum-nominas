'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function createOrOpenPayrollAction(formData: FormData) {
  const year  = Number(formData.get('year'));
  const month = Number(formData.get('month'));

  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('No autenticado');

  // 1) Cabecera del periodo (si existe, reutiliza)
  const existing = await supabase
    .from('payrolls')
    .select('*')
    .eq('user_id', user.id).eq('period_year', year).eq('period_month', month)
    .maybeSingle();

  let header = existing.data;
  if (!header) {
    const ins = await supabase.from('payrolls')
      .insert({ user_id: user.id, period_year: year, period_month: month, status: 'draft' })
      .select('*').single();
    if (ins.error) throw new Error(ins.error.message);
    header = ins.data;
  }

  // 2) Precarga de líneas: del mes anterior o desde employees
  let prevY = year, prevM = month - 1; if (prevM === 0) { prevM = 12; prevY--; }
  const prevHdr = await supabase
    .from('payrolls').select('id')
    .eq('user_id', user.id).eq('period_year', prevY).eq('period_month', prevM)
    .maybeSingle();

  const prevItems = prevHdr.data?.id
    ? (await supabase.from('payroll_items').select('*').eq('payroll_id', prevHdr.data.id)).data ?? []
    : [];

  const byEmpPrev = new Map(prevItems.map(i => [i.employee_id, i]));

  const em = await supabase.from('employees').select('id, base_salary').order('created_at', { ascending: false });
  if (em.error) throw new Error(em.error.message);

  const rows = (em.data ?? []).map(e => {
    const p = byEmpPrev.get(e.id);
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
    const up = await supabase.from('payroll_items')
      .upsert(rows, { onConflict: 'payroll_id,employee_id' });
    if (up.error) throw new Error(up.error.message);
  }

  revalidatePath('/payroll');
  redirect(`/payroll/${header!.id}`);
}
