import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

function chip(status?: string | null) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    closed: "bg-amber-100 text-amber-800 border-amber-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[status ?? "draft"] ?? map.draft}`;
}
function chipLabel(status?: string | null) {
  const map: Record<string, string> = { draft: "Borrador", closed: "Cerrada", paid: "Pagada" };
  return map[status ?? "draft"] ?? "Borrador";
}

export default async function PayrollPage({ searchParams }: PageProps) {
  const now = new Date();
  const selectedYear = Number(
    typeof searchParams?.year === "string" ? searchParams.year : now.getFullYear()
  );
  const openMonth = Number(typeof searchParams?.month === "string" ? searchParams.month : 0);

  const supabase = supabaseServer();

  // Cargar periodos del año (RLS se encarga del multi-tenant)
  const { data: rows } = await supabase
    .from("payrolls")
    .select("id, year, month, status")
    .eq("year", selectedYear);

  const byMonth = new Map<number, { id: string; status: string | null }>();
  for (const r of rows ?? []) byMonth.set(r.month, { id: r.id, status: r.status ?? "draft" });

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Columna izquierda: grid de meses (estilo clásico) */}
      <div className="w-full max-w-[880px] flex-1 border-r bg-white">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestión de Nóminas</h1>
            <p className="text-xs text-gray-500">Selecciona un período para preparar las nóminas de tu equipo.</p>
          </div>
          <Link
            href={`/payroll?year=${selectedYear}&month=${now.getMonth() + 1}`}
            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
            title="Abrir el mes actual"
          >
            Abrir mes actual
          </Link>
        </div>

        <div className="px-6 pb-8 pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => {
              const month = i + 1;
              const rec = byMonth.get(month) || null;
              const exists = !!rec;
              const status = rec?.status ?? null;
              const mm = String(month).padStart(2, "0");

              return (
                <div key={month} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{MONTHS[i]}</div>
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                      {mm}/{selectedYear}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-gray-600">
                    Prepara, revisa y guarda las nóminas de tu equipo para este mes.
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {exists ? <span className={chip(status)}>{chipLabel(status)}</span> : "Sin nómina"}
                    </div>
                    {exists ? (
                      <Link
                        href={`/payroll?year=${selectedYear}&month=${month}`}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
                      >
                        Editar nómina
                      </Link>
                    ) : (
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/payroll/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "same-origin",
                            cache: "no-store",
                            body: JSON.stringify({ year: selectedYear, month }),
                          });
                          const json = await res.json();
                          if (res.ok && json.ok) {
                            // abre el panel del mes recién creado
                            location.href = `/payroll?year=${selectedYear}&month=${month}`;
                          } else {
                            alert(json.error ?? "No se ha podido crear el período.");
                          }
                        }}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
                      >
                        Crear nómina
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel lateral con iframe del editor */}
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
