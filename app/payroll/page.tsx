import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import CreatePeriodButton from "@/components/payroll/CreatePeriodButton";
import CreateMonthInlineButton from "@/components/payroll/CreateMonthInlineButton";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function badgeClass(status?: string | null) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    closed: "bg-amber-100 text-amber-800 border-amber-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[status ?? "draft"] ?? map.draft}`;
}
function badgeLabel(status?: string | null) {
  const map: Record<string, string> = { draft: "Borrador", closed: "Cerrada", paid: "Pagada" };
  return map[status ?? "draft"] ?? "Borrador";
}

export default async function PayrollPage({ searchParams }: PageProps) {
  const now = new Date();
  const selectedYear = Number(
    typeof searchParams?.year === "string" ? searchParams?.year : now.getFullYear()
  );
  const openMonth = Number(typeof searchParams?.month === "string" ? searchParams?.month : 0);

  const supabase = supabaseServer();

  // Nóminas del año (RLS aplicado por Supabase)
  const { data: payrollRows } = await supabase
    .from("payrolls")
    .select("id, year, month, status")
    .eq("year", selectedYear);

  const byMonth = new Map<number, { id: string; status: string | null }>();
  for (const row of payrollRows ?? []) {
    if (!byMonth.has(row.month)) byMonth.set(row.month, { id: row.id, status: row.status ?? "draft" });
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* LISTA */}
      <div className="w-full max-w-[880px] flex-1 border-r bg-white">
        {/* Header profesional */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Nóminas {selectedYear}</h1>
            <span className="text-xs text-gray-500">Multi-tenant (RLS activo)</span>
          </div>
          {/* Botón global “Crear nómina” con selector de mes/año */}
          <CreatePeriodButton defaultYear={selectedYear} />
        </div>

        <div className="px-6 pb-8 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, idx) => {
              const month = idx + 1;
              const mm = String(month).padStart(2, "0");
              const rec = byMonth.get(month) || null;
              const exists = !!rec;
              const status = rec?.status ?? null;
              const openHref = `/payroll?year=${selectedYear}&month=${month}`;

              return (
                <div
                  key={month}
                  className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-gray-900">
                        {mm} · {MONTHS[idx]}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {exists ? (
                          <span className={badgeClass(status)}>{badgeLabel(status)}</span>
                        ) : (
                          "Sin nómina"
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
                      {mm}/{selectedYear}
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] leading-5 text-gray-600">
                    Prepara, revisa y guarda las nóminas de tu equipo para este mes.
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    {exists ? (
                      <Link
                        href={openHref}
                        className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
                        title="Abrir editor en panel"
                      >
                        Editar nómina
                      </Link>
                    ) : (
                      <CreateMonthInlineButton year={selectedYear} month={month} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL LATERAL (iframe con /payroll/editor) */}
      <div
        className={`relative h-full w-[0px] overflow-hidden transition-all duration-200 ${
          openMonth ? "w-[min(920px,52vw)] border-l" : ""
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
