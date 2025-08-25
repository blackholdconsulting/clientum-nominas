'use client';

import { useMemo, useState } from 'react';

type Employee = {
  id: string;
  full_name: string;
  email: string;
  position: string;
  salary_base: number;
  start_date?: string | null;
};

type Props = {
  userEmail: string;
  userId: string;
  // 👇 hazlo opcional y dale default []
  initialEmployees?: Employee[];
  initialMonth: number;
  initialYear: number;
};

export default function NewPayrollClient({
  userEmail,
  userId,
  initialEmployees = [], // <- nunca undefined
  initialMonth,
  initialYear,
}: Props) {

  // si alguien pasa algo raro, lo forzamos a array
  const employees = useMemo(
    () => (Array.isArray(initialEmployees) ? initialEmployees : []),
    [initialEmployees]
  );

  const [selected, setSelected] = useState<string[]>([]);

  // ...tu lógica

  return (
    <div>
      {/* cuando pintes listas, usa siempre (employees ?? []).map(...) */}
      {employees.length === 0 ? (
        <div className="rounded border p-3 text-sm text-muted-foreground">
          No hay empleados para este usuario.
        </div>
      ) : (
        employees.map((e) => (
          <div key={e.id}>{e.full_name} — {e.salary_base.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
        ))
      )}
    </div>
  );
}
