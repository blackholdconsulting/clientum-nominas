// app/payroll/period/[year]/[month]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/utils/supabase/server";
import Link from "next/link";

function eur(n?: number | null) {
  return Number(n ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default async function PeriodEditor({
  params,
}: {
  params: { year: string; month: string };
}) {
  const year = Number(params.year);
  const month = Number(params.month);

  const s = createSupabaseServer();

  // Cabecera de la nómina del periodo
  const { data: payroll, error: pErr } = await s
    .from("payrolls")
    .select("id, status")
    .eq("period_year", year)
    .eq("period_month", month)
    .single();

  if (pErr) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Editor de nómina {month}/{year}</h1>
        <p className="mt-4 text-red-600">
          No se pudo abrir la nómina del periodo: {pErr.message}
        </p>
        <Link href="/payroll" className="mt-6 inline-block text-blue-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  // Items + datos de empleado
  const { data: items, error: iErr } = await s
    .from("payroll_items")
    .select("id, employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net, employees(full_name, email)")
    .eq("payroll_id", payroll.id)
    .order("employee_id");
  if (iErr) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Editor de nómina {month}/{year}</h1>
        <p className="mt-4 text-red-600">Error leyendo items: {iErr.message}</p>
        <Link href="/payroll" className="mt-6 inline-block text-blue-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editor de nómina {month}/{year}</h1>
        <Link href="/payroll" className="text-blue-600 underline">Volver al listado</Link>
      </div>

      <div className="mt-6 border rounded-lg divide-y">
        {items?.map((it) => (
          <div key={it.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{(it as any).employees?.full_name ?? it.employee_id}</p>
              <p className="text-sm text-slate-500">{(it as any).employees?.email}</p>
            </div>
            <div className="grid grid-cols-5 gap-4 text-right text-sm">
              <div><p className="text-slate-500">Bruto</p><p>{eur(it.base_gross)}</p></div>
              <div><p className="text-slate-500">IRPF</p><p>{eur(it.irpf_amount)}</p></div>
              <div><p className="text-slate-500">SS Emp.</p><p>{eur(it.ss_emp_amount)}</p></div>
              <div><p className="text-slate-500">SS Empr.</p><p>{eur(it.ss_er_amount)}</p></div>
              <div><p className="text-slate-500">Neto</p><p>{eur(it.net)}</p></div>
            </div>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <div className="p-6 text-slate-600">No hay empleados en este periodo.</div>
        )}
      </div>
    </div>
  );
}
