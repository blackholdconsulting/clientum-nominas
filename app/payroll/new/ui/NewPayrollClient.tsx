// app/payroll/new/ui/NewPayrollClient.tsx
'use client';

import { useMemo, useState } from 'react';

type Employee = {
  id: string;
  name: string;
  position: string;
  salary: number;
};

const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const YEARS = (() => {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1, y + 2];
})();

const IRPF_RATE = 0.15;
const SS_RATE = 0.063;

export default function NewPayrollClient({
  employees,
  userEmail,
}: {
  employees: Employee[];
  userEmail: string;
}) {
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth());
  const [year, setYear] = useState<number>(today.getFullYear());

  // selección por defecto: todos marcados
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(employees.map((e) => [e.id, true])),
  );

  const selectedEmployees = useMemo(
    () => employees.filter((e) => selected[e.id]),
    [employees, selected]
  );

  const gross = useMemo(
    () => selectedEmployees.reduce((acc, e) => acc + (e.salary || 0), 0),
    [selectedEmployees]
  );

  const irpf = useMemo(() => Math.round(gross * IRPF_RATE), [gross]);
  const ss = useMemo(() => Math.round(gross * SS_RATE), [gross]);
  const deductions = irpf + ss;
  const net = gross - deductions;

  const onToggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const doProcess = () => {
    // Aquí luego llamamos a tu API o insert en `payrolls`
    // con user_id (lo pondrá RLS) + periodo + totales + detalle.
    alert(
      `Procesar nómina de ${MONTHS[month]} ${year}\n` +
        `Empleados: ${selectedEmployees.length}\n` +
        `Bruto: ${EUR.format(gross)}\n` +
        `IRPF (15%): ${EUR.format(irpf)}\n` +
        `SS (6,3%): ${EUR.format(ss)}\n` +
        `Neto: ${EUR.format(net)}`
    );
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-semibold text-xl text-gray-900">Clientum Nóminas</span>
          <span>·</span>
          <span>Nueva Nómina</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-md border hover:bg-gray-50"
            onClick={() => history.back()}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={doProcess}
          >
            Procesar Nómina
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2">Crear Nueva Nómina</h1>
      <p className="text-sm text-gray-600 mb-6">
        Configura y procesa una nueva nómina para tus empleados
        <span className="ml-2 text-gray-400">(usuario: {userEmail})</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuración */}
          <section className="rounded-lg border bg-white p-4">
            <h2 className="font-medium mb-2">Configuración de Nómina</h2>
            <p className="text-sm text-gray-500 mb-4">
              Define el periodo y parámetros de la nómina
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mes</label>
                <div className="relative">
                  <select
                    className="w-full rounded-md border px-3 py-2 bg-white"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Año</label>
                <div className="relative">
                  <select
                    className="w-full rounded-md border px-3 py-2 bg-white"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Selección de empleados */}
          <section className="rounded-lg border bg-white p-4">
            <h2 className="font-medium mb-2">Selección de Empleados</h2>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona los empleados para incluir en esta nómina
            </p>

            <div className="space-y-3">
              {employees.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={!!selected[e.id]}
                      onChange={() => onToggle(e.id)}
                    />
                    <div>
                      <div className="font-medium">{e.name || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500">{e.position || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{EUR.format(e.salary || 0)}</div>
                    <div className="text-xs text-gray-500">Salario base</div>
                  </div>
                </div>
              ))}

              {employees.length === 0 && (
                <div className="text-sm text-gray-500 border rounded-md p-3">
                  No hay empleados para este usuario.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA (1/3) */}
        <div className="space-y-6">
          {/* Resumen */}
          <section className="rounded-lg border bg-white p-4">
            <h3 className="font-medium mb-2">Resumen de Nómina</h3>
            <p className="text-sm text-gray-500 mb-4">Totales calculados</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Empleados</span>
                <span className="font-semibold">{selectedEmployees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Bruto</span>
                <span className="font-semibold">{EUR.format(gross)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Neto</span>
                <span className="font-semibold">{EUR.format(net)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Deducciones</span>
                <span className="font-semibold">{EUR.format(deductions)}</span>
              </div>
            </div>
          </section>

          {/* Desglose de deducciones */}
          <section className="rounded-lg border bg-white p-4">
            <h3 className="font-medium mb-2">Desglose de Deducciones</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">IRPF (15%)</span>
                <span className="font-semibold">{EUR.format(irpf)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Seg. Social (6,3%)</span>
                <span className="font-semibold">{EUR.format(ss)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
