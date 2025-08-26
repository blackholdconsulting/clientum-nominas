export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/utils/supabase/server";
import { startPayrollPeriod } from "./actions";

type Employee = {
  id: string;
  full_name: string | null;
  email: string | null;
  position: string | null;
};

type PayrollHeader = {
  id: string;
  status: "draft" | "finalized";
  period_year: number;
  period_month: number;
  created_at: string;
  processed_at: string | null;
  gross_total: number | null;
  net_total: number | null;
};

function money(n?: number | null) {
  return Number(n ?? 0).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export default async function EditorPeriodPage({
  params,
}: {
  params: { year: string; month: string };
}) {
  const year = Number(params.year);
  const month = Number(params.month);

  if (!Number.isInteger(year) || year < 2000 || year > 3000) notFound();
  if (!Number.isInteger(month) || month < 1 || month > 12) notFound();

  const s = createSupabaseServer();

  // 1) Carga cabecera del periodo (si existe)
  const { data: payroll, error: pErr } = await s
    .from("payrolls")
    .select(
      "id, status, period_year, period_month, created_at, processed_at, gross_total, net_total",
    )
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle<PayrollHeader>();

  if (pErr) {
    // No lanzamos para no romper el render: mostramos que no hay cabecera
    // (el editor sigue abriendo sin cabecera)
    // console.error(pErr);
  }

  // 2) Carga empleados del usuario
  const { data: employees = [] } = await s
    .from("employees")
    .select("id, full_name, email, position")
    .order("full_name", { ascending: true }) as { data: Employee[] | null; error: any };

  return (
    <main className="max-w-[1200px] mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Editor — {String(month).padStart(2, "0")}/{year}
          </h1>
          <p className="text-slate-600">
            Aquí preparas la nómina del periodo por **empleado** y puedes consultar su histórico.
          </p>
        </div>

        {/* Estado del periodo */}
        <div className="rounded-lg border p-4 min-w-[280px]">
          <p className="text-xs text-slate-500">Estado del periodo</p>
          <p className="font-semibold mt-1">
            {payroll ? (
              <>
                {payroll.status === "finalized" ? "Finalizada" : "Borrador"}
                <span className="ml-2 text-slate-500">
                  (Bruto {money(payroll.gross_total)} · Neto {money(payroll.net_total)})
                </span>
              </>
            ) : (
              "Sin cabecera aún"
            )}
          </p>

          {!payroll && (
            <form action={startPayrollPeriod} className="mt-4">
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Iniciar nómina del periodo
              </button>
            </form>
          )}

          {payroll && (
            <a
              href={`/payroll/period/${year}/${month}`}
              className="inline-flex items-center justify-center rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 mt-4"
            >
              Abrir editor de ítems
            </a>
          )}
        </div>
      </header>

      {/* Lista de empleados con histórico */}
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-3">Empleados</h2>

        {employees.length === 0 && (
          <p className="text-slate-600">No hay empleados para este usuario.</p>
        )}

        <div className="divide-y">
          {employees.map((e) => (
            <EmployeeRow key={e.id} employee={e} year={year} month={month} />
          ))}
        </div>
      </section>
    </main>
  );
}

/* ---------- Fila de empleado + histórico (Server Component) ----------- */

async function EmployeeRow({
  employee,
  year,
  month,
}: {
  employee: Employee;
  year: number;
  month: number;
}) {
  const s = createSupabaseServer();

  // Intentamos usar la vista v_employee_payroll_history (si la creaste)
  let history:
    | { period_year: number; period_month: number; net: number | null; base_gross: number | null; payroll_id: string | null }[]
    | null = null;

  let viewOk = true;

  try {
    const { data, error } = await s
      .from("v_employee_payroll_history")
      .select("period_year, period_month, net, base_gross, payroll_id")
      .eq("employee_id", employee.id)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false })
      .limit(12);

    if (error) viewOk = false;
    history = data as any;
  } catch {
    viewOk = false;
  }

  // Fallback si la vista no existe: unimos manualmente payroll_items + payrolls
  if (!viewOk) {
    const { data } = await s
      .from("payroll_items")
      .select(
        "net, base_gross, payrolls!inner(id, period_year, period_month)"
      )
      .eq("employee_id", employee.id)
      .order("payrolls.period_year", { ascending: false })
      .order("payrolls.period_month", { ascending: false })
      .limit(12);

    history =
      data?.map((row: any) => ({
        period_year: row.payrolls?.period_year,
        period_month: row.payrolls?.period_month,
        net: row.net,
        base_gross: row.base_gross,
        payroll_id: row.payrolls?.id ?? null,
      })) ?? [];
  }

  return (
    <div className="py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{employee.full_name ?? "Sin nombre"}</p>
          <p className="text-xs text-slate-500">
            {employee.email} {employee.position ? `· ${employee.position}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Enlace directo al editor de ítems del periodo (no crea nada) */}
          <a
            href={`/payroll/period/${year}/${month}`}
            className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
            title="Abrir editor de ítems del periodo (no crea nada por sí solo)"
          >
            Abrir periodo
          </a>
        </div>
      </div>

      {/* Histórico compacto */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 pr-3">Periodo</th>
              <th className="py-1 pr-3">Bruto</th>
              <th className="py-1 pr-3">Neto</th>
              <th className="py-1 pr-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(history ?? []).map((h, idx) => (
              <tr key={`${employee.id}-${idx}`}>
                <td className="py-1 pr-3">
                  {String(h.period_month).padStart(2, "0")}/{h.period_year}
                </td>
                <td className="py-1 pr-3">{money(h.base_gross)}</td>
                <td className="py-1 pr-3">{money(h.net)}</td>
                <td className="py-1 pr-3">
                  {h.payroll_id ? (
                    <a
                      href={`/payroll/period/${h.period_year}/${h.period_month}`}
                      className="text-blue-600 hover:underline"
                    >
                      Abrir
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}

            {(!history || history.length === 0) && (
              <tr>
                <td colSpan={4} className="py-2 text-slate-500">
                  Sin histórico disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
