"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import CreatePeriodButton from "@/components/payroll/CreatePeriodButton";

type MonthCard = { n: number; label: string };

export default function PayrollPage() {
  // Ajusta el año si lo necesitas (en tus capturas es 2025)
  const YEAR = 2025;

  const months: MonthCard[] = useMemo(
    () => [
      { n: 1, label: "Enero" },
      { n: 2, label: "Febrero" },
      { n: 3, label: "Marzo" },
      { n: 4, label: "Abril" },
      { n: 5, label: "Mayo" },
      { n: 6, label: "Junio" },
      { n: 7, label: "Julio" },
      { n: 8, label: "Agosto" },
      { n: 9, label: "Septiembre" },
      { n: 10, label: "Octubre" },
      { n: 11, label: "Noviembre" },
      { n: 12, label: "Diciembre" },
    ],
    []
  );

  // Panel lateral con el editor (iframe /payroll/editor?year=YYYY&month=MM)
  const [open, setOpen] = useState(false);
  const [selMonth, setSelMonth] = useState<number | null>(null);

  const openEditor = (m: number) => {
    setSelMonth(m);
    setOpen(true);
  };

  const closeEditor = () => {
    setOpen(false);
    // No limpiamos selMonth para mantener el estado si reabres
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* CABECERA PROFESIONAL + botón volver */}
      <PageHeader
        title="Gestión de Nóminas"
        subtitle="Selecciona un período para preparar las nóminas de tus empleados."
        backHref="/dashboard"
      />

      {/* GRID DE MESES */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m) => (
          <div
            key={m.n}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{m.label}</h3>
              <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {String(m.n).padStart(2, "0")}/{YEAR}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Prepara, revisa y guarda las nóminas de tu equipo para este mes.
            </p>

            <div className="mt-5 flex items-center gap-2">
              {/* Botón existente: abre el panel lateral con el editor embebido */}
              <button
                onClick={() => openEditor(m.n)}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Editar nómina
              </button>

              {/* NUEVO: crear período (RPC payroll_generate_period) */}
              <CreatePeriodButton year={YEAR} month={m.n} />
            </div>
          </div>
        ))}
      </div>

      {/* PANEL LATERAL (overlay) */}
      {open && selMonth !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={closeEditor}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-5xl overflow-hidden rounded-l-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  Editor de nómina {String(selMonth).padStart(2, "0")}/{YEAR}
                </h4>
                <p className="text-xs text-gray-500">
                  Trabaja sin salir de esta página.
                </p>
              </div>
              <button
                onClick={closeEditor}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label="Cerrar editor"
                title="Cerrar"
              >
                Cerrar
              </button>
            </div>

            <div className="h-[calc(100%-56px)]">
              <iframe
                key={`${YEAR}-${selMonth}`}
                title="Payroll Editor"
                src={`/payroll/editor?year=${YEAR}&month=${selMonth}`}
                className="h-full w-full"
              />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
