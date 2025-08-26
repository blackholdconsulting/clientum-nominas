/* app/payroll/period/[year]/[month]/page.tsx */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/utils/supabase/server";
// 👇 ruta relativa desde /payroll/period/[year]/[month]/ hacia /payroll/actions.ts
import { generatePayroll } from "../../../actions";

type Payroll = {
  id: string;
  period_year: number;
  period_month: number;
  status: "draft" | "finalized";
  gross_total: number | null;
  net_total: number | null;
  created_at: string;
  processed_at: string | null;
};

export default async function PeriodPage({
  params,
}: {
  params: { year: string; month: string };
}) {
  const year = Number(params.year);
  const month = Number(params.month);

  if (!Number.isInteger(year) || year < 2000 || year > 3000) notFound();
  if (!Number.isInteger(month) || month < 1 || month > 12) notFound();

  const s = createSupabaseServer();

  // 1) Intentar leer nómina del periodo (RLS aísla por user)
  const { data: payroll, error } = await s
    .from("payrolls")
    .select(
      "id, period_year, period_month, status, gross_total, net_total, created_at, processed_at"
    )
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle<Payroll>();

  // 2) Si no existe, crearla y recargar el mismo editor
  if (!payroll) {
    await generatePayroll(year, month);
    redirect(`/payroll/period/${year}/${month}`);
  }

  const fmt = (n?: number | null) =>
    Number(n ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Editor de nómina — {String(month).padStart(2, "0")}/{year}
        </h1>
        <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
          Volver
        </Link>
      </div>

      <section className="mt-6 rounded-lg border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Estado</p>
            <p className="text-lg font-semibold">{payroll!.status}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Bruto</p>
            <p className="text-lg font-semibold">{fmt(payroll!.gross_total)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Neto</p>
            <p className="text-lg font-semibold">{fmt(payroll!.net_total)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Creada</p>
            <p className="text-sm">{new Date(payroll!.created_at).toLocaleString("es-ES")}</p>
          </div>
        </div>

        {/* Aquí irán los componentes del editor (empleados/ítems/preview/pdf) */}
        <div className="mt-6 rounded-md border border-dashed p-6 text-slate-600">
          Contenido del editor… (tabla de empleados, conceptos, etc.)
        </div>
      </section>
    </main>
  );
}
