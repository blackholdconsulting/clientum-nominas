'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function fmtPeriodo(year: number, month: number) {
  const fmt = new Intl.DateTimeFormat('es-ES', { month: 'long' });
  const mesNombre = fmt.format(new Date(year, month - 1, 1));
  return `${mesNombre.charAt(0).toUpperCase()}${mesNombre.slice(1)} ${year}`;
}

export default function PayrollEditorPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const year = Number(sp.get('year') || new Date().getFullYear());
  const month = Number(sp.get('month') || new Date().getMonth() + 1);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h2 className="text-lg font-semibold">Parámetros inválidos</h2>
          <p className="mt-2 text-sm">
            Faltan <code>year</code> o <code>month</code> en la URL.
          </p>
          <button
            className="mt-4 rounded-md bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            onClick={() => router.push('/payroll')}
          >
            Volver a la lista
          </button>
        </div>
      </main>
    );
  }

  const periodoLabel = fmtPeriodo(year, month);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Editor de nómina {String(month).padStart(2,'0')}/{year}
        </h1>
        <Link
          href="/payroll"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver a la lista
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
        <span className="font-medium">Período: </span>{periodoLabel} &nbsp;—&nbsp;
        <span className="font-medium">Mes: </span>{month} &nbsp;—&nbsp;
        <span className="font-medium">Año: </span>{year}
      </div>

      {/* 
        Aquí puedes montar tu editor real (lista de empleados, conceptos, etc)
        leyendo year/month. Este es un “shell” seguro lado cliente.
      */}
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            <h3 className="text-lg font-medium text-slate-900">Empleado A (ejemplo)</h3>
            <p className="mt-1 text-sm text-slate-600">NIF: 00000000A — Categoría: Administrativo</p>

            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <div>Concepto: Salario Base — 1.200,00 €</div>
              <div>Concepto: Prorrata Pagas — 200,00 €</div>
              <div className="opacity-60">…</div>
            </div>

            <button className="mt-4 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            <h3 className="text-lg font-medium text-slate-900">Empleado B (ejemplo)</h3>
            <p className="mt-1 text-sm text-slate-600">NIF: 00000000B — Categoría: Comercial</p>

            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <div>Concepto: Salario Base — 1.350,00 €</div>
              <div>Concepto: Plus Transporte — 90,00 €</div>
              <div className="opacity-60">…</div>
            </div>

            <button className="mt-4 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </article>
      </div>
    </main>
  );
}
