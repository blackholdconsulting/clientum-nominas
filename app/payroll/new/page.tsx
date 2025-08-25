// app/payroll/new/page.tsx
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import NewPayrollClient from './ui/NewPayrollClient';

export default async function NewPayrollPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    // si quieres redireccionar a login, o muestra un mensaje
    return <div>Debes iniciar sesión</div>;
  }

  // ⚠️ Consulta mínima: SOLO por user_id (sin más filtros)
  const { data: employees, error } = await supabase
    .from('employees')
    .select(
      'id, first_name, last_name, email, position, salary_base, start_date'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error cargando empleados: {error.message}</div>;
  }

  return (
    <NewPayrollClient
      userEmail={user.email ?? ''}
      userId={user.id}
      initialEmployees={employees ?? []}
      initialMonth={new Date().getMonth() + 1}
      initialYear={new Date().getFullYear()}
    />
  );
}
