"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Payroll = {
  id: string;
  year: number;
  month: number;
  org_id?: string | null;
  organization_id?: string | null;
  status?: string | null;
};

type PayrollItem = {
  id: string;
  payroll_id: string;
  employee_id: string;
  // Campos tolerantes
  concept?: string | null;
  description?: string | null;
  amount?: number | null;
  quantity?: number | null;
  base?: number | null;
  hours?: number | null;
  type?: "earning" | "deduction" | string | null;
};

type Props = {
  year: number;
  month: number;
  employeeId?: string | null;
  activeOrgId?: string;
};

export default function EmployeePayrollEditor({ year, month, employeeId, activeOrgId }: Props) {
  const [period, setPeriod] = useState<Payroll | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = useMemo(() => {
    // Suma earnings - deductions (si hay tipo)
    return items.reduce((acc, it) => {
      const val =
        (typeof it.amount === "number" ? it.amount : 0) ||
        (typeof it.base === "number" ? it.base : 0);
      if ((it.type ?? "").toLowerCase() === "deduction") return acc - val;
      return acc + val;
    }, 0);
  }, [items]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorMsg(null);
      setItems([]);
      setPeriod(null);

      const supabase = supabaseBrowser();

      // 1) Encontrar el periodo {year, month}
      let periodQuery = supabase
        .from("payrolls")
        .select("*")
        .eq("year", year)
        .eq("month", month)
        .limit(1);

      if (activeOrgId) {
        periodQuery = periodQuery.or(`org_id.eq.${activeOrgId},organization_id.eq.${activeOrgId}`);
      }

      const { data: periodData, error: periodErr } = await periodQuery;
      if (periodErr) {
        setErrorMsg(`Error buscando periodo: ${periodErr.message}`);
        setLoading(false);
        return;
      }
      const p = (periodData ?? [])[0] as Payroll | undefined;
      if (!p) {
        setLoading(false);
        setPeriod(null);
        return;
      }
      setPeriod(p);

      // 2) Items del empleado en ese periodo
      if (employeeId) {
        const { data: itemsData, error: itemsErr } = await supabase
          .from("payroll_items")
          .select("*")
          .eq("payroll_id", p.id)
          .eq("employee_id", employeeId)
          .order("id", { ascending: true });
        if (itemsErr) {
          setErrorMsg(`Error cargando items: ${itemsErr.message}`);
          setItems([]);
        } else {
          setItems((itemsData ?? []) as PayrollItem[]);
        }
      }

      setLoading(false);
    };

    run();
  }, [year, month, employeeId, activeOrgId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Cargando editor…
      </div>
    );
  }

  if (!period) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-sm text-gray-600">
          No existe periodo <span className="font-semibold">{month}/{year}</span>.
        </p>
        <p className="text-xs text-gray-500">Genera el periodo antes de editar nóminas.</p>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-600">Selecciona un empleado en la columna izquierda.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Nómina de empleado · {month}/{year}
          </h3>
          <p className="text-xs text-gray-500">
            Periodo #{period.id} · Estado: {period.status ?? "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total neto (estimado)</p>
          <p className="text-base font-semibold">{total.toLocaleString(undefined, { style: "currency", currency: "EUR" })}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No hay conceptos para este empleado en el periodo.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => {
              const label = it.concept ?? it.description ?? "Concepto";
              const val =
                (typeof it.amount === "number" ? it.amount : null) ??
                (typeof it.base === "number" ? it.base : null);
              const qty =
                (typeof it.quantity === "number" ? it.quantity : null) ??
                (typeof it.hours === "number" ? it.hours : null);
              const type = (it.type ?? "").toLowerCase();

              return (
                <li key={it.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                  <div className="col-span-5">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">
                      {type ? (type === "deduction" ? "Deducción" : "Devengo") : "Concepto"}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-gray-500">Cantidad</p>
                    <p className="text-sm">{qty ?? "—"}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-gray-500">Importe</p>
                    <p className={`text-sm ${type === "deduction" ? "text-red-600" : "text-gray-900"}`}>
                      {val !== null
                        ? (type === "deduction" ? -val : val).toLocaleString(undefined, {
                            style: "currency",
                            currency: "EUR",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-xs text-gray-400">#{it.id}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
