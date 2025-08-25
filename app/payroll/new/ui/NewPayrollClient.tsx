'use client';

type Employee = {
  id: string;
  full_name: string | null;
  email: string | null;
  position: string | null;
  department_id: string | null;
  base_salary: number;
};

export default function NewPayrollClient({
  employees,
  userEmail,
}: {
  employees: Employee[];
  userEmail: string;
}) {
  if (!employees || employees.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No hay empleados para este usuario.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-4 text-sm text-muted-foreground">
        Usuario: <span className="font-medium">{userEmail}</span>
      </div>

      <h1 className="text-xl font-semibold mb-4">Selecciona empleados</h1>

      <ul className="divide-y rounded-lg border bg-white/60">
        {employees.map((e) => (
          <li key={e.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{e.full_name ?? 'Sin nombre'}</div>
              <div className="text-sm text-muted-foreground">
                {e.email ?? '—'} · {e.position ?? '—'}
              </div>
            </div>
            <div className="text-sm tabular-nums">
              {Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
              }).format(Number(e.base_salary || 0))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
