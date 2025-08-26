"use client";

import React, { useState } from "react";
// Import relativo para no depender del alias @/
import EditorPanel from "../../components/payroll/EditorPanel";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function PayrollHome() {
  const year = new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();

  const openEditor = (y: number, m: number) => {
    setSelectedYear(y);
    setSelectedMonth(m);
    setOpen(true);
  };

  const closeEditor = () => setOpen(false);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Gestión de Nóminas</h1>
      <p className="mb-8 text-gray-600">
        Selecciona un período para preparar las nóminas de tus empleados.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((label, idx) => {
          const month = idx + 1;
          return (
            <section
              key={month}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-medium">{label}</h3>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {String(month).padStart(2, "0")}/{year}
                </span>
              </header>

              <p className="mb-4 text-sm text-gray-600">
                Prepara, revisa y guarda las nóminas de tu equipo para este mes.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => openEditor(year, month)}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Editar nómina
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Panel/overlay que embebe el editor real */}
      <EditorPanel
        open={open}
        year={selectedYear}
        month={selectedMonth}
        onClose={closeEditor}
      />
    </main>
  );
}
