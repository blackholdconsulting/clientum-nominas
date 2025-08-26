/* app/payroll/page.tsx */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/utils/supabase/server";
import { generatePayroll } from "./actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";

// Paleta corporativa Clientum
const brand = {
  bg: "from-[#0E2A47] via-[#0F3D7A] to-[#1259C3]",
  primary: "bg-[#1E66F5] hover:bg-[#1554CB]",
  ring: "ring-1 ring-slate-200",
};

type PayrollRow = {
  id: string;
  period_year: number;
  period_month: number;
  status: "draft" | "finalized";
  gross_total: number | null;
  net_total: number | null;
  processed_at: string | null;
  created_at: string | null;
};

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function fmtCurrency(v?: number | null) {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const s = createSupabaseServer();

  // Año seleccionado (por defecto: actual)
  const now = new Date();
  const year = Number(searchParams.year ?? now.getFullYear());

  // Nóminas del año (RLS aisla por usuario)
  const { data: payrolls, error } = await s
    .from("payrolls")
    .select(
      "id, period_year, period_month, status, gross_total, net_total, processed_at, created_at"
    )
    .eq("period_year", year)
    .order("period_month", { ascending: true });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Gestión de Nóminas</h1>
        <p className="mt-8 text-red-600">Error cargando datos: {error.message}</p>
      </div>
    );
  }

  const byMonth = new Map<number, PayrollRow>();
  (payrolls ?? []).forEach((p) => byMonth.set(p.period_month, p));

  // Resumen anual
  const annualGross = (payrolls ?? []).reduce(
    (acc, r) => acc + (Number(r.gross_total ?? 0) || 0),
    0
  );
  const annualNet = (payrolls ?? []).reduce(
    (acc, r) => acc + (Number(r.net_total ?? 0) || 0),
    0
  );
  const finalizedCount = (payrolls ?? []).filter((r) => r.status === "finalized").length;

  /** ➊ Server Action: crea la nómina y redirige al editor del periodo */
  async function createThenGo(formData: FormData) {
    "use server";
    const y = Number(formData.get("y"));
    const m = Number(formData.get("m"));
    await generatePayroll(y, m);              // <<–– genera/abre nómina en BD
    redirect(`/payroll/period/${y}/${m}`);    // <<–– redirige al editor
  }

  /** Cambio de año (SSR) */
  async function changeYear(formData: FormData) {
    "use server";
    const y = String(formData.get("year"));
    redirect(`/payroll?year=${y}`);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`bg-gradient-to-r ${brand.bg} text-white`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Gestión de Nóminas</h1>
              <p className="mt-1 text-white/80">
                Administra, genera y revisa las nóminas por periodo.
              </p>
            </div>
            <form action={changeYear} className="flex items-center gap-3">
              <label className="text-white/80">Año</label>
              <select
                name="year"
                defaultValue={String(year)}
                className="rounded-md bg-white/10 text-white px-3 py-2 outline-none focus:ring-2 ring-offset-0"
              >
                {Array.from({ length: 6 }).map((_, i) => {
                  const y = now.getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y} className="text-black">
                      {y}
                    </option>
                  );
                })}
              </select>
              <button
                className="rounded-md bg-white/10 hover:bg-white/20 text-white px-3 py-2"
                type="submit"
              >
                Cambiar
              </button>
            </form>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 px-4 py-4">
              <p className="text-sm text-white/80">Bruto acumulado</p>
              <p className="text-2xl font-semibold">{fmtCurrency(annualGross)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-4">
              <p className="text-sm text-white/80">Neto acumulado</p>
              <p className="text-2xl font-semibold">{fmtCurrency(annualNet)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-4">
              <p className="text-sm text-white/80">Nóminas finalizadas</p>
              <p className="text-2xl font-semibold">
                {finalizedCount}/{MONTHS.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de meses */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MONTHS.map((label, idx) => {
            const month = idx + 1;
            const p = byMonth.get(month);
            const isFinal = p?.status === "finalized";

            return (
              <div
                key={month}
                className={`rounded-xl bg-white shadow-sm ${brand.ring} p-4 flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    {p ? (
                      <h3 className="mt-1 text-lg font-semibold">
                        {isFinal ? "Finalizada" : "Borrador"}
                      </h3>
                    ) : (
                      <h3 className="mt-1 text-lg font-semibold text-slate-600">Sin nómina</h3>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Bruto</p>
                    <p className="text-base font-medium">{fmtCurrency(p?.gross_total)}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Neto</p>
                    <p className="text-base font-medium">{fmtCurrency(p?.net_total)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {p ? (
                    <Fragment>
                      <Link
                        href={`/payroll/period/${year}/${month}`}
                        className="inline-flex items-center px-3 py-2 rounded-md text-white text-sm font-medium transition-colors bg-slate-800 hover:bg-slate-900"
                      >
                        Abrir
                      </Link>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isFinal ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isFinal ? "Finalizada" : "Borrador"}
                      </span>
                    </Fragment>
                  ) : (
                    /* ➋ Aquí se conecta el botón al action */
                    <form action={createThenGo}>
                      <input type="hidden" name="y" value={year} />
                      <input type="hidden" name="m" value={month} />
                      <button
                        className={`inline-flex items-center px-3 py-2 rounded-md text-white text-sm font-medium transition-colors ${brand.primary}`}
                      >
                        Crear nómina
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado vacío del año */}
        {(payrolls?.length ?? 0) === 0 && (
          <div className="mt-12 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <h3 className="text-lg font-medium">Aún no hay nóminas en {year}</h3>
            <p className="mt-2 text-slate-500">
              Crea la primera nómina del año y personalízala por empleado. Los importes se
              precargarán y podrás editar antes de finalizar.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              {/* También conectado al action */}
              <form action={createThenGo}>
                <input type="hidden" name="y" value={year} />
                <input type="hidden" name="m" value={now.getMonth() + 1} />
                <button className={`px-4 py-2 rounded-md text-white ${brand.primary}`}>
                  Crear nómina de {MONTHS[now.getMonth()]}
                </button>
              </form>
              <Link
                href="/payroll/new"
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Avanzado
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
