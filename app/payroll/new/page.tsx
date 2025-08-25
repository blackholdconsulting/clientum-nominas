// app/payroll/new/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server'; // ajusta el path si el tuyo es distinto

export const dynamic = 'force-dynamic'; // evita cache de build en server components

export default async function NewPayrollPage() {
  const supabase = supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    // Si algo falla leyendo la sesión, muestra un mensaje visible
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Crear Nueva Nómina</h1>
        <p className="text-red-600">Error de autenticación: {authError.message}</p>
      </main>
    );
  }

  if (!user) {
    redirect('/login');
  }

  // ⚠️ RLS ya protege por user_id, pero añadimos el filtro explícito
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position, salary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Crear Nueva Nómina</h1>
        <p className="text-red-600">Error cargando empleados: {error.message}</p>
      </main>
    );
  }

  // ✅ Devuelve JSX válido (sustituye el <pre> por tu UI de nómina)
  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Crear Nueva Nómina</h1>
        <p className="text-sm text-gray-500">
          (Multiusuario: viendo datos del usuario <span className="font-mono">{user.email}</span>)
        </p>
      </header>

      {/* 👉 Aquí puedes montar tu UI existente (mes/año, checkboxes, resumen, botón "Procesar Nómina") */}
      <section className="rounded border bg-white p-4">
        <h2 className="font-medium mb-2">Empleados disponibles</h2>
        <pre className="text-xs bg-gray-50 rounded border p-3 overflow-auto">
          {JSON.stringify(employees ?? [], null, 2)}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          Reemplaza este &lt;pre&gt; por tu componente con selección de empleados y cálculo de totales.
        </p>
      </section>
    </main>
  );
}
