"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Employee = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  position?: string | null;
};

type PayrollRow = {
  id: string;
  status: string | null;
  year?: number | null;
  month?: number | null;
  period_year?: number | null;
  period_month?: number | null;
};

export default function EmployeePayrollEditor({
  year,
  month,
  employeeId,
  orgId,
}: {
  year: number;
  month: number;
  employeeId: string;
  orgId?: string;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [period, setPeriod] = useState<PayrollRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Cargar empleado + período (soporta year/month y period_year/period_month)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Empleado
      const { data: emp, error: e1 } = await supabase
        .from("employees")
        .select("id, full_name, first_name, last_name, email, position")
        .eq("id", employeeId)
        .maybeSingle();

      if (!alive) return;
      if (e1) {
        setErr(e1.message);
        setLoading(false);
        return;
      }
      setEmployee(emp as Employee);

      // 2) Período (year/month o period_year/period_month)
      let per: PayrollRow | null = null;

      const q1 = await supabase
        .from("payrolls")
        .select("id, status, year, month")
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (!q1.error && q1.data) {
        per = q1.data as PayrollRow;
      } else {
        const q2 = await supabase
          .from("payrolls")
          .select("id, status, period_year, period_month")
          .eq("period_year", year)
          .eq("period_month", month)
          .maybeSingle();
        if (!q2.error && q2.data) per = q2.data as PayrollRow;
      }

      setPeriod(per);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [supabase, employeeId, year, month]);

  const displayName =
    (employee?.full_name ??
      [employee?.first_name, employee?.last_name].filter(Boolean).join(" ")) || "Empleado";

  // Crear el período si no existe (mínimo viable)
  const ensurePeriod = async () => {
    try {
      const res = await fetch("/api/payroll/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ year, month, orgId }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error || "No se pudo crear el período.");
        return;
      }
      setPeriod(json?.period || { id: json?.id, status: "draft" });
    } catch (e: any) {
      alert(e?.message || "Error creando período.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Cargando editor…</p>
      </div>
    );
  }
  if (err) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Error: {err}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera del editor */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">
            {employee?.email ?? "—"}
            {employee?.position ? <span className="text-gray-400"> · {employee.position}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
            {String(month).padStart(2, "0")}/{year}
          </span>
          {period ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {period.status ?? "borrador"}
            </span>
          ) : (
            <button
              onClick={ensurePeriod}
              className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:brightness-105"
            >
              Crear período
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo del editor (mínimo viable; aquí irán tus inputs/calculadora/guardado) */}
      <div className="flex-1 overflow-y-auto p-4">
        {period ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Datos de nómina</h3>
            <p className="text-sm text-gray-600">
              Aquí puedes montar los formularios de devengos/deducciones, bases de cotización,
              IRPF, etc. Este componente ya recibe <code>year</code>, <code>month</code> y{" "}
              <code>employeeId</code>, y tiene localizado el período.
            </p>
            <ul className="text-sm text-gray-700">
              <li>
                <strong>Empleado:</strong> {displayName} ({employee?.id})
              </li>
              <li>
                <strong>Período:</strong> {String(month).padStart(2, "0")}/{year}
              </li>
              <li>
                <strong>Estado:</strong> {period.status ?? "borrador"}
              </li>
            </ul>

            {/* Botón de PDF de ejemplo (conéctalo a tu endpoint cuando quieras) */}
            <button
              onClick={() => alert("Generar PDF: aquí conectamos con tu endpoint /api/payroll/receipt")}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              Generar PDF
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">
              Crea primero el período para poder editar la nómina.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
