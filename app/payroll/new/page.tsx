// app/payroll/new/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import NewPayrollClient from './ui/NewPayrollClient';

export const dynamic = 'force-dynamic';

export default async function NewPayrollPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1) Asegura sesión
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    // Si algo falla con auth, mejor mostrarlo claro
    return (
      <div className="p-4 text-sm text-red-600">
        Error de autenticación: {authError.message}
      </div>
    );
  }
  if (!auth?.user) redirect('/login');

  // 2) Carga empleados sólo del usuario conectado
  //    (RLS debería bastar, pero el eq user_id añade una barrera más)
  const { data, error } = await supabase
    .from('employees')
    .select(
      `
        id,
        full_name,
        email,
        position,
        department_id,
        base_salary,
        salary_base
      `
    )
    .eq('user_id', auth.user.id)
    .order('full_name', { ascending: true });

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Error cargando empleados: {error.message}
      </div>
    );
  }

  // 3) Normaliza el campo de salario por si la columna se llama distinto
  const employees = (data ?? []).map((e: any) => ({
    ...e,
    // usa base_salary si existe; si no, prueba con salary_base; si no, 0
    base_salary: e.base_salary ?? e.salary_base ?? 0,
  }));

  return <NewPayrollClient employees={employees} userEmail={auth.user.email ?? ''} />;
}
