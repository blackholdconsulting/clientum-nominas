'use client';

import Link from 'next/link';
import {useMemo, useState} from 'react';

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

  // (Opcional) formato de dinero para pintar KPIs de manera homogénea.
  const fmt = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Nóminas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra, genera y revisa las nóminas por período y por empleado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="year" className="text-sm text-gray-600">Año</label>
          <select
            id="year"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </header>

      {/* KPIs (placeholder, conecta tus datos reales cuando los tengas) */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="Bruto acumulado" value={fmt.format(0)} />
        <KpiCard title="Neto acumulado" value={fmt.format(0)} />
        <KpiCard title="Nóminas finalizadas" value="0/12" />
      </section>

      {/* Cards por mes */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((m) => {
          const link = `/payroll/editor?year=${year}&month=${m.num}`;
          return (
            <article
              key={m.num}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-base font-medium text-gray-900">{m.name}</h2>
                  <p className="text-xs text-gray-500">
                    Periodo {String(m.num).padStart(2,'0')}/{year}
                  </p>
                </div>
                <span className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500">
                  Sin nómina
                </span>
              </div>

              {/* Aquí podrías mostrar KPIs por mes (bruto/neto) si ya los calculas */}
              <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Bruto</p>
                  <p className="font-medium text-gray-900">{fmt.format(0)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Neto</p>
                  <p className="font-medium text-gray-900">{fmt.format(0)}</p>
                </div>
              </div>

              {/* Botón: abre /payroll/editor SIEMPRE en nueva pestaña */}
              <div className="mt-auto">
                <Link
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {/* ícono simple (no dependemos de librerías) */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="opacity-90"
                  >
                    <path d="M14 3h7v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 14v6a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Editar nómina
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

/** --- Componentes UI pequeños --- */
function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
