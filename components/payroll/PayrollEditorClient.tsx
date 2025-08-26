// components/payroll/PayrollEditorClient.tsx
"use client";

import { useState, useTransition } from "react";

type Row = {
  employee_id: number;
  name: string;
  nif?: string | null;
  gross?: number | null;
  net?: number | null;
  notes?: string | null;
};

export default function PayrollEditorClient({
  payrollId,
  initialRows,
  onSave,
}: {
  payrollId: number;
  initialRows: Row[];
  onSave: (payrollId: number, rows: Row[]) => Promise<void>;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string>("");

  const update = (idx: number, key: keyof Row, val: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const handleSave = () => {
    setMessage("");
    start(async () => {
      try {
        await onSave(payrollId, rows);
        setMessage("Guardado ✅");
      } catch (e: any) {
        setMessage(e?.message || "Error al guardar");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Empleado</th>
              <th className="px-3 py-2 text-left">NIF</th>
              <th className="px-3 py-2 text-right">Bruto</th>
              <th className="px-3 py-2 text-right">Neto</th>
              <th className="px-3 py-2 text-left">Notas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.employee_id} className="border-t">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.nif}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-32 rounded border px-2 py-1 text-right"
                    value={r.gross ?? ""}
                    onChange={(e) => update(idx, "gross", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-32 rounded border px-2 py-1 text-right"
                    value={r.net ?? ""}
                    onChange={(e) => update(idx, "net", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    className="w-72 rounded border px-2 py-1"
                    value={r.notes ?? ""}
                    onChange={(e) => update(idx, "notes", e.target.value)}
                    placeholder="Observaciones…"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar borrador"}
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  );
}
