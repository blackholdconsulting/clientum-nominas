'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

const MONTHS = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PayrollEditorPage() {
  const search = useSearchParams();
  const router = useRouter();

  const year = useMemo(() => {
    const y = Number(search.get('year'));
    return Number.isInteger(y) ? y : NaN;
  }, [search]);

  const month = useMemo(() => {
    const m = Number(search.get('month'));
    return Number.isInteger(m) ? m : NaN;
  }, [search]);

  const monthName = Number.isInteger(month) && month >= 1 && month <= 12 ? MONTHS[month] : '';

  // Validación de parámetros
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Parámetros inválidos. Debes abrir el editor con <b>?year=YYYY&amp;month=1..12</b>
        </div>
        <button
          className="mt-4 rounded bg-gray-200 px-3 py-2 text-sm"
          onClick={() => router.push('/payroll')}
        >
          Volver
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Editor de nómina {String(month).padStart(2, '0')}/{year}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Aquí podrás preparar las nóminas de todos tus empleados para el periodo seleccionado.
          </p>
        </div>
        <button
          className="rounded bg-gray-200 px-3 py-2 text-sm"
          onClick={() => router.push('/payroll')}
        >
          Volver a la lista
        </button>
      </header>

      {/* ZONA DE TRABAJO: lista de empleados + editor por empleado */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm text-gray-700">
          <b>Periodo:</b> {monthName} {year} — <b>Mes:</b> {month} — <b>Año:</b> {year}
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          El editor está operativo. Ahora puedes conectar aquí tu carga de empleados y líneas de nómina.
          <br />
          Para empezar rápido, genera un borrador en tu RPC y lista los empleados junto a sus conceptos.
        </div>

        {/* Ejemplo de contenedor donde renderizarás empleados */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded border p-3">
            <h3 className="font-medium">Empleado A (ejemplo)</h3>
            <div className="mt-2 text-sm text-gray-600">
              NIF: 00000000A — Categoría: Administrativo
            </div>
            <div className="mt-3 rounded bg-gray-50 p-2 text-sm">
              <p>Concepto: Salario Base — 1.200,00 €</p>
              <p>Concepto: Prorrata Pagas — 200,00 €</p>
              <p>…</p>
            </div>
            <div className="mt-3 text-right">
              <button className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </article>

          <article className="rounded border p-3">
            <h3 className="font-medium">Empleado B (ejemplo)</h3>
            <div className="mt-2 text-sm text-gray-600">
              NIF: 00000000B — Categoría: Comercial
            </div>
            <div className="mt-3 rounded bg-gray-50 p-2 text-sm">
              <p>Concepto: Salario Base — 1.350,00 €</p>
              <p>Concepto: Plus Transporte — 90,00 €</p>
              <p>…</p>
            </div>
            <div className="mt-3 text-right">
              <button className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
