// app/payroll/new/page.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { createOrOpenPayrollAction } from './actions';

export default async function NewPayrollPage() {
  const supabase = createClient();

  let employees: any[] = [];
  let loadErr: string | null = null;

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, email, created_at, position')
      .order('created_at', { ascending: false });
    if (error) loadErr = error.message;
    employees = data ?? [];
  } catch (e: any) {
    loadErr = e?.message ?? String(e);
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Crear Nueva Nómina</h1>
        <a className="rounded border px-4 py-2" href="/payroll">Cancelar</a>
      </div>

      {loadErr && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Error cargando empleados: {loadErr}
        </div>
      )}

      <form action={createOrOpenPayrollAction}>
        <input name="year" type="hidden" defaultValue={year} />
        <input name="month" type="hidden" defaultValue={month} />

        <div className="rounded-lg border bg-white">
          {employees.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No hay empleados para este usuario.
            </div>
          ) : (
            <ul className="divide-y">
              {employees.map((e) => (
                <li key={e.id} className="flex justify-between px-6 py-4">
                  <div>
                    <div className="font-medium">{e.full_name}</div>
                    <div className="text-sm text-gray-500">{e.email} · {e.position ?? '—'}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Alta: {new Date(e.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded bg-[#2563eb] px-5 py-2.5 font-medium text-white hover:bg-[#1d4ed8]"
          >
            Procesar Nómina
          </button>
        </div>
      </form>
    </div>
  );
}
