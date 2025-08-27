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
  days_in_period?: number | null;
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
  const [opening, setOpening] = useState(false);

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

      // 2) Periodo (por year/month o period_year/period_month)
      let per: PayrollRow | null = null;

      const q1 = await supabase
        .from("payrolls")
        .select("id, status, year, month, days_in_period")
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (!q1.error && q1.data) {
        per = q1.data as PayrollRow;
      } else {
        const q2 = await supabase
          .from("payrolls")
          .select("id, status, period_year, period_month, days_in_period")
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

  // === ABRIR DIRECTO EN PESTAÑA NUEVA ===
  // Construimos la URL con querystring y abrimos _blank
  const handleOpenPdf = () => {
    setOpening(true);
    try {
      const url = new URL("/api/payroll/receipt-raw", window.location.origin);
      url.searchParams.set("year", String(year));
      url.searchParams.set("month", String(month));
      url.searchParams.set("employeeName", displayName);
      url.searchParams.set("status", period?.status ?? "borrador");

      // Puedes reemplazar estos valores con cálculos reales:
      url.searchParams.set("devengos", String(1500));
      url.searchParams.set("deducciones", String(300));
      url.searchParams.set("liquido", String(1200));

      window.open(url.toString(), "_blank", "noopener");
    } catch (e) {
      alert("No se pudo abrir el PDF");
    } finally {
      setOpening(false);
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
          <button
            onClick={handleOpenPdf}
            disabled={opening}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {opening ? "Generando…" : "Generar PDF"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-600">
          Selecciona un empleado y usa “Generar PDF”. Se abrirá en una pestaña nueva con la ruta
          <code className="ml-1 rounded bg-gray-100 px-1 py-0.5">/api/payroll/receipt-raw</code>.
        </p>
      </div>
    </div>
  );
}
