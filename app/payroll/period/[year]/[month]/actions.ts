'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

/**
 * Crea (si no existe) la nómina del periodo y pre-carga ítems
 * para todos los empleados del usuario.
 * Luego recalcula totales y recarga la página del editor.
 */
export async function createDraftPayroll(formData: FormData) {
  const year = Number(formData.get('year'));
  const month = Number(formData.get('month'));

  if (!year || !month) {
    throw new Error('Período inválido');
  }

  const supabase = supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('No se pudo obtener el usuario');

  // 1) ¿Ya existe cabecera para ese periodo?
  const { data: existing, error: selErr } = await supabase
    .from('payrolls')
    .select('id')
    .eq('user_id', user.id)
    .eq('period_year', year)
    .eq('period_month', month)
    .limit(1)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);

  let payrollId: string;

  if (existing) {
    payrollId = existing.id;
  } else {
    // 2) Crear cabecera
    const { data: inserted, error: insErr } = await supabase
      .from('payrolls')
      .insert({
        user_id: user.id,            // <- importante para RLS
        period_year: year,
        period_month: month,
        status: 'draft',
        gross_total: 0,
        net_total: 0,
      })
      .select('id')
      .single();

    if (insErr) throw new Error(insErr.message);
    payrollId = inserted.id;

    // 3) Cargar empleados del usuario
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('id, base_salary')
      .eq('user_id', user.id);
    if (empErr) throw new Error(empErr.message);

    // 4) Insertar ítems por empleado (si hay)
    if (employees && employees.length) {
      const items = employees.map((e) => ({
        user_id: user.id,          // <- importante para RLS si tu tabla lo tiene
        payroll_id: payrollId,
        employee_id: e.id,
        base_gross: Number(e.base_salary) || 0,
        irpf_amount: 0,
        ss_emp_amount: 0,
        ss_er_amount: 0,
        net: 0,
      }));

      const { error: itemsErr } = await supabase.from('payroll_items').insert(items);
      if (itemsErr) throw new Error(itemsErr.message);
    }
  }

  // 5) Recalcular totales (ignora fallo si la función no existe)
  try {
    await supabase.rpc('recalc_payroll_totals', { payroll: payrollId });
  } catch {}

  // 6) Refrescar la página del editor
  const path = `/payroll/period/${year}/${month}`;
  revalidatePath(path);
  redirect(path);
}
