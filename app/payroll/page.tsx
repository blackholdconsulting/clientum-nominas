'use client';

import Link from 'next/link';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export default function PayrollHome() {
  const now = new Date();
  const year = now.getFullYear();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Gestión de Nóminas
          </h1>
          <p className="mt-1 text-slate-600">
            Selecciona un período para preparar las nóminas de tus empleados.
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-2 text-slate-700">
          Año <span className="font-semibold">{year}</span>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MESES.map((mes, i) => {
          const month = i + 1;
          // 👉 forzamos /payroll/editor/page
          const href = `/payroll/editor/page?year=${year}&month=${month}`;
          return (
            <article
              key={mes}
              className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">{mes}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {String(month).padStart(2, '0')}/{year}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  Prepara, revisa y guarda las nóminas de tu equipo para este mes.
                </p>

                <div className="mt-5 flex gap-3">
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Editar nómina
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
