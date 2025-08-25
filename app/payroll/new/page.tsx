// app/payroll/new/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import NewPayrollClient from './ui/NewPayrollClient';

export default async function Page() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, full_name, email, position, base_salary')
    // Mismo criterio que /employees: propias o NULL
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('full_name', { ascending: true });

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Error cargando empleados: {error.message}
      </div>
    );
  }

  return (
    <NewPayrollClient
      userId={user.id}
      initialEmployees={employees ?? []}  // <- evita undefined.map
    />
  );
}
