// app/payroll/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function createOrOpenPayrollAction(month: number, year: number) {
  const supabase = createSupabaseServer();

  // 1) Garantiza sesión
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) throw new Error('No autorizado');

  // 2) Genera/abre nómina por periodo (crea payroll y payroll_items si faltan)
  const { data: rpc, error: rpcError } = await supabase.rpc('payroll_generate_period', {
    p_year: year,
    p_month: month,
  });

  if (rpcError) {
    console.error('RPC payroll_generate_period error', rpcError);
    throw rpcError;
  }

  // 3) Revalida listado y pantalla del periodo
  revalidatePath('/payroll');
  revalidatePath(`/payroll/period/${year}/${month}`);
  return rpc; // opcionalmente id de payroll
}

export async function listPayrollsByYear(year: number) {
  const supabase = createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return [];

  const { data, error } = await supabase
    .from('payrolls')
    .select('id, period_year, period_month, status, gross_total, net_total, processed_at')
    .eq('period_year', year)
    .order('period_month', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
