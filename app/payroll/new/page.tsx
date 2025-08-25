import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import NewPayrollClient from './ui/NewPayrollClient';

export default async function NewPayrollPage() {
  const supabase = createClient(await cookies());

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return <div>Debes iniciar sesión</div>;

  // ⚠️ Usa los nombres REALES de tu tabla. Si tu sueldo se llama "salary", léelo y lo mapeamos.
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, position, salary, salary_base, start_date, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error cargando empleados: {error.message}</div>;
  }

  // data puede venir null -> conviértelo SIEMPRE en array
  const rows = Array.isArray(data) ? data : [];

  // Normaliza a la forma que espera la UI
  const employees = rows.map((e) => ({
    id: e.id,
    first_name: e.first_name ?? '',
    last_name: e.last_name ?? '',
    full_name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
    email: e.email ?? '',
    position: e.position ?? '',
    // toma salary_base si existe; si no, salary; si no, 0
    salary_base: Number(e.salary_base ?? e.salary ?? 0),
    start_date: e.start_date ?? e.created_at,
  }));

  return (
    <NewPayrollClient
      userEmail={user.email ?? ''}
      userId={user.id}
      // 👇 nunca undefined
      initialEmployees={employees}
      initialMonth={new Date().getMonth() + 1}
      initialYear={new Date().getFullYear()}
    />
  );
}
