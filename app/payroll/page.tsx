export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import PayrollToolbar from "@/components/payroll/PayrollToolbar";
import PayrollGrid from "@/components/payroll/PayrollGrid";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function PayrollPage({ searchParams }: PageProps) {
  const now = new Date();
  const year = Number(typeof searchParams?.year === "string" ? searchParams.year : now.getFullYear());
  const monthOpen = Number(typeof searchParams?.month === "string" ? searchParams.month : 0);
  const orgId = typeof searchParams?.orgId === "string" ? (searchParams!.orgId as string) : undefined;

  return (
    <div className="flex h-[calc(100vh-0px)]">
      <div className="w-full max-w-[980px] flex-1 border-r bg-white">
        <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3 px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Gestión de Nóminas</h1>
              <p className="text-xs text-gray-500">Prepara, revisa y guarda las nóminas de tu equipo.</p>
            </div>
            <PayrollToolbar defaultYear={year} />
          </div>
        </div>

        <div className="mx-auto max-w-[980px] px-6 py-5">
          <PayrollGrid year={year} />
        </div>
      </div>

      <div
        className={`relative h-full w-[0px] overflow-hidden transition-all duration-200 ${
          monthOpen ? "w-[min(980px,52vw)] border-l" : ""
        }`}
      >
        {monthOpen ? (
          <div className="flex h-full flex-col bg-gray-50">
            <div className="flex items-center justify-between border-b bg-white px-4 py-3">
              <div className="text-sm font-medium text-gray-800">
                Editor — {String(monthOpen).padStart(2, "0")}/{year}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/payroll?year=${year}${orgId ? `&orgId=${orgId}` : ""}`}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cerrar
                </Link>
              </div>
            </div>
            <iframe
              src={`/payroll/editor?year=${year}&month=${monthOpen}${orgId ? `&orgId=${orgId}` : ""}`}
              className="h-full w-full"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
