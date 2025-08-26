"use client";

import * as React from "react";
import { ensureItemsForEmployees, generateItemPdf, upsertItem } from "@/app/payroll/[id]/edit/actions";

type Employee = { id: number; full_name: string };
type Item = {
  id: number;
  payroll_id: number;
  employee_id: number;
  base_gross: number;
  irpf_amount: number;
  ss_emp_amount: number;
  ss_er_amount: number;
  net: number;
  pdf_url?: string | null;
  employee?: { id: number; full_name: string };
};

export default function PayrollEditor({
  payroll,
  initialItems,
  employees,
}: {
  payroll: { id: number; year: number; month: number; status: string };
  initialItems: Item[];
  employees: Employee[];
}) {
  const [rows, setRows] = React.useState<Item[]>(() =>
    (initialItems ?? []).map((r) => ({
      ...r,
      employee: r.employee ?? employees.find((e) => e.id === r.employee_id),
    }))
  );
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  // Si no hay filas, permite generarlas para todos los empleados
  const handleEnsureLines = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await ensureItemsForEmployees(payroll.id);
      // recargamos (simple)
      window.location.reload();
    } catch (e: any) {
      setMsg(e.message || "Error creando líneas.");
    } finally {
      setSaving(false);
    }
  };

  const updateCell = (id: number, field: keyof Item, value: number) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [field]: value } as Item;
        // cálculo de neto sencillo (ajusta la fórmula a tu lógica real)
        next.net =
          Number(next.base_gross || 0) -
          Number(next.irpf_amount || 0) -
          Number(next.ss_emp_amount || 0);
        return next;
      })
    );
  };

  const saveRow = async (row: Item) => {
    setBusyId(row.id);
    setMsg(null);
    try {
      const payload = {
        id: row.id,
        payroll_id: payroll.id,
        employee_id: row.employee_id,
        base_gross: Number(row.base_gross || 0),
        irpf_amount: Number(row.irpf_amount || 0),
        ss_emp_amount: Number(row.ss_emp_amount || 0),
        ss_er_amount: Number(row.ss_er_amount || 0),
        net: Number(row.net || 0),
      };
      const saved = await upsertItem(payload);
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...saved } : r)));
      setMsg("Guardado.");
    } catch (e: any) {
      setMsg(e.message || "Error al guardar.");
    } finally {
      setBusyId(null);
    }
  };

  const makePdf = async (row: Item) => {
    setBusyId(row.id);
    setMsg(null);
    try {
      const { url } = await generateItemPdf(row.id);
      setRows((rs) =>
        rs.map((r) => (r.id === row.id ? { ...r, pdf_url: url } : r))
      );
      setMsg("PDF generado.");
    } catch (e: any) {
      setMsg(e.message || "Error generando PDF.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded border">
      <div className="p-3 flex items-center justify-between">
        <div>
          <button
            className="rounded bg-gray-100 px-3 py-2 hover:bg-gray-200 text-sm"
            onClick={handleEnsureLines}
            disabled={saving}
          >
            Crear líneas para todos los empleados
          </button>
        </div>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>

      <div className="overflow-auto">
        <table className="min-w-full border-t text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Empleado</th>
              <th className="px-3 py-2 text-right">Bruto</th>
              <th className="px-3 py-2 text-right">IRPF</th>
              <th className="px-3 py-2 text-right">SS Emp.</th>
              <th className="px-3 py-2 text-right">SS Empr.</th>
              <th className="px-3 py-2 text-right">Neto</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.employee?.full_name ?? r.employee_id}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-28 border rounded px-2 py-1 text-right"
                    value={r.base_gross ?? 0}
                    onChange={(e) =>
                      updateCell(r.id, "base_gross", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-24 border rounded px-2 py-1 text-right"
                    value={r.irpf_amount ?? 0}
                    onChange={(e) =>
                      updateCell(r.id, "irpf_amount", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-24 border rounded px-2 py-1 text-right"
                    value={r.ss_emp_amount ?? 0}
                    onChange={(e) =>
                      updateCell(r.id, "ss_emp_amount", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-24 border rounded px-2 py-1 text-right"
                    value={r.ss_er_amount ?? 0}
                    onChange={(e) =>
                      updateCell(r.id, "ss_er_amount", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.net || 0).toFixed(2)} €
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => saveRow(r)}
                      disabled={busyId === r.id}
                      className="rounded bg-blue-600 text-white px-3 py-1 hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => makePdf(r)}
                      disabled={busyId === r.id}
                      className="rounded bg-teal-600 text-white px-3 py-1 hover:bg-teal-700"
                    >
                      PDF
                    </button>
                    {r.pdf_url ? (
                      <a
                        href={r.pdf_url}
                        target="_blank"
                        className="rounded border px-3 py-1 hover:bg-gray-50"
                      >
                        Ver PDF
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={7}>
                  No hay líneas para esta nómina.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
