// app/payroll/new/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server'; // ajusta si tu helper está en otro path
import NewPayrollClient from './ui/NewPayrollClient';

export const dynamic = 'force-dynamic';

export default async function NewPayrollPage() {
  const supabase = supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Crear Nueva Nómina</h1>
        <p className="text-red-600">Error de autenticación: {authError.message}</p>
      </main>
    );
  }

  if (!user) redirect('/login');

  // RLS ya protege, pero añadimos filtro por claridad
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position, salary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Crear Nueva Nómina</h1>
        <p className="text-red-600">Error cargando empleados: {error.message}</p>
      </main>
    );
  }

  return (
    <NewPayrollClient
      userEmail={user.email ?? ''}
      employees={
        (employees ?? []).map((e) => ({
          id: e.id,
          name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
          position: e.position ?? '',
          salary: Number(e.salary ?? 0),
        })) as Array<{ id: string; name: string; position: string; salary: number }>
      }
    />
  );
}
