export const dynamic = "force-dynamic";
export const revalidate = 0;

import EmployeesList from "@/components/payroll/EmployeesList";
import EmployeePayrollEditor from "@/components/payroll/EmployeePayrollEditor";

export default function PayrollEditorPage({
  searchParams,
}: {
  searchParams?: { year?: string; month?: string; employee?: string; orgId?: string };
}) {
  const now = new Date();
  const year = Number(searchParams?.year ?? now.getFullYear());
  const month = Number(searchParams?.month ?? now.getMonth() + 1);
  const employeeId = (searchParams?.employee ?? "").trim();
  const orgId = (searchParams?.orgId ?? "").trim() || undefined;

  return (
    <div className="flex h-[100dvh] w-full bg-white">
      {/* Columna izquierda: lista de empleados (multi-tenant con RLS) */}
      <aside className="w-[360px] shrink-0 border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Empleados</p>
            <p className="text-xs text-gray-500">Multi-tenant (RLS)</p>
          </div>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
            {String(month).padStart(2, "0")}/{year}
          </span>
        </div>

        {/* La lista maneja la navegación (recarga esta página con ?employee=...) */}
        <EmployeesList year={year} month={month} />
      </aside>

      {/* Panel derecho: editor */}
      <main className="flex-1">
        {employeeId ? (
          <EmployeePayrollEditor
            year={year}
            month={month}
            employeeId={employeeId}
            orgId={orgId}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-600">
              Selecciona un empleado a la izquierda para editar su nómina y generar el PDF.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
