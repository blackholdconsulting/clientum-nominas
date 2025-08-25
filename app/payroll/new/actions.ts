// app/payroll/new/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

type Employee = { id: string; salary_base?: number };

export async function processPayrollAction({
  month,   // 1..12
  year,    // 2025
  employees,
}: { month: number; year: number; employees: Employee[] }) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('No autenticado');

  // Cálculo simple de totales (ajústalo a tu lógica real)
  const grossTotal = employees.reduce((s, e) => s + (e.salary_base ?? 0), 0);
  const irpf = 0.15;
  const ss   = 0.063;
  const netTotal = grossTotal - grossTotal * (irpf + ss);

  const { data, error } = await supabase
    .from('payrolls')
    .insert({
      user_id: user.id,          // <- CLAVE para RLS
      period_year: year,
      period_month: month,
      gross_total: grossTotal,
      net_total: netTotal,
      status: 'processed',
    })
    .select()
    .single();

  if (error) {
    // si choca con el índice único de mes/año
    if ((error as any).code === '23505') {
      throw new Error('Ya tienes una nómina para ese periodo.');
    }
    throw new Error(error.message);
  }

  return data; // úsalo para redirigir al detalle, etc.
}
