'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const MONTHS = [
  { num: 1,  name: 'Enero' },
  { num: 2,  name: 'Febrero' },
  { num: 3,  name: 'Marzo' },
  { num: 4,  name: 'Abril' },
  { num: 5,  name: 'Mayo' },
  { num: 6,  name: 'Junio' },
  { num: 7,  name: 'Julio' },
  { num: 8,  name: 'Agosto' },
  { num: 9,  name: 'Septiembre' },
  { num: 10, name: 'Octubre' },
  { num: 11, name: 'Noviembre' },
  { num: 12, name: 'Diciembre' },
];

export default function PayrollHomePage() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Gestión de Nóminas</h1>

        <div className="flex items-center gap-2">
          <label htmlFor="year" className="text-sm">Año</label>
          <select
            id="year"
            className="rounded border px-2 py-1"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 6 }, (_, i) => currentYear - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((m) => (
          <article
            key={m.num}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-medium">{m.name}</h2>
              <span className="text-sm text-gray-500">
                {String(m.num).padStart(2, '0')}/{year}
              </span>
            </div>

            {/* Aquí puedes imprimir KPI del mes si quieres (bruto/neto acumulados, etc.) */}

            <div className="mt-4">
              {/* === BOTÓN EDITAR EN PESTAÑA NUEVA === */}
              <Link
                href={`/payroll/editor?year=${year}&month=${m.num}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
              >
                Editar nómina
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
