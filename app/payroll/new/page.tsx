// app/payroll/new/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function NewPayrollPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Solo empleados del usuario
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position, salary as base_cc, department_id')
    .eq('user_id', user.id)       // explícito; RLS también protege
    .order('created_at', { ascending: true });

  if (error) throw error;

  // ...pinta tu UI con `employees`
  return (
    /* tu JSX actual: selector de mes/año, lista de empleados, resumen, etc. */
  );
}
