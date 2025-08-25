// app/payroll/new/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';

type Row = {
  employee_id: string;
  gross_total: number;
  net_total: number;
  base_cc?: number;
  base_at?: number;
  irpf_pct?: number;
  ss_employee?: number;
  ss_employer?: number;
  extras?: Record<string, number>;
  pay_date?: string | null;
};

export async function processPayroll(formData: FormData) {
  const year  = Number(formData.get('year'));
  const month = Number(formData.get('month'));
  const rows  = JSON.parse(String(formData.get('rows') ?? '[]')) as Row[];

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No auth');

  // payload a insertar
  const toUpsert = rows.map(r => ({
    user_id:      user.id,
    employee_id:  r.employee_id,
    period_year:  year,
    period_month: month,
    gross_total:  r.gross_total ?? 0,
    net_total:    r.net_total ?? 0,
    base_cc:      r.base_cc ?? 0,
    base_at:      r.base_at ?? 0,
    irpf_pct:     r.irpf_pct ?? 0,
    ss_employee:  r.ss_employee ?? 0,
    ss_employer:  r.ss_employer ?? 0,
    extras:       r.extras ?? {},
    status:       'processed',
    pay_date:     r.pay_date ?? null
  }));

  const { error } = await supabase
    .from('payrolls')
    .upsert(toUpsert, {
      onConflict: 'user_id,employee_id,period_year,period_month'
    });

  if (error) throw error;

  revalidatePath('/payroll');   // refresca dashboard/resumen
  return { ok: true };
}
