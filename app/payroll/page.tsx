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

  // Cargar nóminas del año seleccionado (RLS aplicado por Supabase)
  const { data: payrollRows } = await supabase
    .from("payrolls")
    .select("id, year, month, status")
    .eq("year", selectedYear);

  // Mapa mes -> { exists, status, id }
  const byMonth = new Map<number, { id: string; status: string | null }>();
  for (const row of payrollRows ?? []) {
    if (!byMonth.has(row.month)) {
      byMonth.set(row.month, { id: row.id, status: row.status ?? "draft" });
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* LISTA IZQUIERDA */}
      <div className="w-full max-w-[860px] flex-1 border-r bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Nóminas {selectedYear}</h1>
            <span className="text-xs text-gray-500">Multi-tenant (RLS activo)</span>
          </div>
          <CreatePeriodButton defaultYear={selectedYear} />
        </div>

        <div className="px-4 pb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, idx) => {
              const month = idx + 1;
              const rec = byMonth.get(month) || null;
              const exists = !!rec;
              const status = rec?.status ?? null;
              const mm = String(month).padStart(2, "0");
              const openHref = `/payroll?year=${selectedYear}&month=${month}`;

              return (
                <div
                  key={month}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {mm} · {MONTHS[idx]}
                      </div>
                      {exists ? (
                        <span className={badgeClass(status)}>{badgeLabel(status)}</span>
                      ) : (
                        <span className="text-[11px] text-gray-500">Sin nómina</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {exists ? (
                        <Link
                          href={openHref}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          title="Abrir editor en panel"
                        >
                          Ver nómina
                        </Link>
                      ) : (
                        <CreateMonthInlineButton year={selectedYear} month={month} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL LATERAL CON IFRAME DEL EDITOR */}
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
