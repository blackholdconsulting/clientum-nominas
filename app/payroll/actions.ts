'use server';

import { supabaseServer } from '@/lib/supabase/server';

// Utilidad simple de suma “segura”
const sum = (arr: (number | null | undefined)[]) =>
  arr.reduce((acc, v) => acc + (Number(v ?? 0)), 0);

// Crea/actualiza la nómina del periodo con los empleados del usuario
export async function createPayrollAction(formData: FormData) {
  const month = Number(formData.get('month'));  // 1..12
  const year  = Number(formData.get('year'));

  const supabase = supabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('No autenticado');

  // Traemos salarios de los empleados del usuario (RLS filtra solo los suyos)
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('salary');
  if (empErr) throw empErr;

  // Ajusta estas fórmulas a tu modelo real
  const gross = sum(employees?.map(e => (e as any).salary) ?? []);
  const net   = Math.round(gross * 0.76 * 100) / 100; // (ejemplo) 24% retenciones+SS

  // upsert por (user_id, year, month)
  const { error: upErr } = await supabase
    .from('payrolls')
    .upsert(
      [{ period_year: year, period_month: month, gross_total: gross, net_total: net, status: 'processed' }],
      { onConflict: 'user_id,period_year,period_month' }
    );

  if (upErr) throw upErr;
}

export async function markAsPaidAction(id: string) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('payrolls')
    .update({ status: 'paid' })
    .eq('id', id)
    .eq('user_id', user.id); // 🔒 extra guard-rail
  if (error) throw error;
}

export async function deletePayrollAction(id: string) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('payrolls')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // 🔒 extra guard-rail
  if (error) throw error;
}
