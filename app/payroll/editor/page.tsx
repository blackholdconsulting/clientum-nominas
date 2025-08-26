"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmployeesList, { Employee } from "@/components/payroll/EmployeesList";
import EmployeePayrollEditor from "@/components/payroll/EmployeePayrollEditor";

/**
 * URL esperada: /payroll/editor?year=YYYY&month=MM[&employee=EMP_ID][&org=ORG_ID]
 */
export default function EditorPage({
  searchParams,
}: {
  searchParams?: { year?: string; month?: string; employee?: string; org?: string };
}) {
  const params = useSearchParams();
  const router = useRouter();

  const year = useMemo(() => Number(params.get("year") ?? searchParams?.year ?? NaN), [params, searchParams]);
  const month = useMemo(() => Number(params.get("month") ?? searchParams?.month ?? NaN), [params, searchParams]);
  const employeeId = useMemo(() => params.get("employee") ?? searchParams?.employee ?? null, [params, searchParams]);
  const activeOrgId = useMemo(() => params.get("org") ?? searchParams?.org ?? undefined, [params, searchParams]);

  const validPeriod = Number.isFinite(year) && Number.isFinite(month) && year > 1900 && month >= 1 && month <= 12;

  // Click en la tarjeta completa (UX rápida dentro del panel)
  const handleSelectEmployee = (e: Employee) => {
    const q = new URLSearchParams(params.toString());
    q.set("employee", e.id);
    router.replace(`/payroll/editor?${q.toString()}`);
  };

  // Enlace "Ver nómina →" (anchor que conserva todos los query params y solo cambia employee)
  const buildHref = (e: Employee) => {
    const q = new URLSearchParams(params.toString());
    q.set("employee", e.id);
    return `/payroll/editor?${q.toString()}`;
  };

  if (!validPeriod) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          Falta indicar <span className="font-semibold">year</span> y <span className="font-semibold">month</span> en la URL.
          <div className="mt-1 text-xs text-amber-700">Ejemplo: /payroll/editor?year=2025&month=8</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[100dvh] grid-cols-12 bg-white">
      {/* Columna izquierda: Empleados */}
      <aside className="col-span-4 border-r bg-gray-50">
        <EmployeesList
          activeOrgId={activeOrgId}
          onSelect={handleSelectEmployee}
          linkBuilder={buildHref}
          title="Empleados"
        />
      </aside>

      {/* Columna derecha: Editor de nómina */}
      <main className="col-span-8">
        <EmployeePayrollEditor
          year={year}
          month={month}
          employeeId={employeeId}
          activeOrgId={activeOrgId}
        />
      </main>
    </div>
  );
}
