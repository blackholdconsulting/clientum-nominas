// Render dinámico (sin caché) — no consultamos Supabase en server aquí
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import CreatePeriodButton from "@/components/payroll/CreatePeriodButton";
import PayrollGrid from "@/components/payroll/PayrollGrid";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function PayrollPage({ searchParams }: PageProps) {
  const now = new Date();
  const selectedYear = Number(
    typeof searchParams?.year === "string" ? searchParams.year : now.getFullYear()
  );
  const openMonth = Number(typeof searchParams?.month === "string" ? searchParams.month : 0);

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Columna izquierda: grid de meses */}
      <div className="w-full max-w-[880px] flex-1 border-r bg-white">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestión de Nóminas</h1>
            <p className="text-xs text-gray-500">
              Selecciona un período para preparar las nóminas de tu equipo.
            </p>
          </div>

        {/* Botón global (cliente) */}
          <CreatePeriodButton defaultYear={selectedYear} />
        </div>

        <div className="px-6 pb-8 pt-5">
          {/* Grid en cliente: consulta Supabase con RLS */}
          <PayrollGrid year={selectedYear} />
        </div>
      </div>

      {/* Panel lateral con el editor embebido (mantiene UX original) */}
      <div
        className={`relative h-full w-[0px] overflow-hidden transition-all duration-200 ${
          openMonth ? "w-[min(900px,50vw)] border-l" : ""
        }`}
      >
        {openMonth ? (
          <div className="flex h-full flex-col bg-gray-50">
            <div className="flex items-center justify-between border-b bg-white px-4 py-3">
              <div className="text-sm font-medium text-gray-800">
                Editor — {String(openMonth).padStart(2, "0")}/{selectedYear}
              </div>
              <Link
                href={`/payroll?year=${selectedYear}`}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cerrar
              </Link>
            </div>
            <iframe
              src={`/payroll/editor?year=${selectedYear}&month=${openMonth}`}
              className="h-full w-full"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
