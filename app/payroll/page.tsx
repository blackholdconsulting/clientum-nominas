// app/payroll/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  CalendarDays,
  Download,
  Euro,
  FilePlus2,
  Loader2,
  Receipt,
  Users2,
} from "lucide-react";

type PayrollRow = {
  id: string;
  user_id: string | null;
  period_year: number | null;
  period_month: number | null;
  gross_total: number | null;
  net_total: number | null;
  status: "draft" | "processed" | "paid" | string | null;
  created_at: string | null;
};

function fmtCurrency(n: number | null | undefined) {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  return v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function monthName(m?: number | null) {
  if (!m) return "-";
  const d = new Date(2024, m - 1, 1);
  return d.toLocaleDateString("es-ES", { month: "long" });
}

function fmtDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export default async function PayrollPage() {
  const supabase = createClient(await cookies());

  // 1) Usuario
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
          Debes iniciar sesión para ver tus nóminas.
        </div>
      </main>
    );
  }
  const user = userData.user;

  // 2) Empleados del usuario (para la métrica)
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id);
  const totalEmployees = empErr || !Array.isArray(employees) ? 0 : employees.length;

  // 3) Nóminas del usuario
  const { data: payrollsRaw, error: pErr } = await supabase
    .from("payrolls")
    .select(
      "id, user_id, period_year, period_month, gross_total, net_total, status, created_at"
    )
    .eq("user_id", user.id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  const payrolls: PayrollRow[] = Array.isArray(payrollsRaw) ? payrollsRaw : [];

  // 4) Métricas rápidas
  const processedOrPaid = payrolls.filter(
    (p) => p.status === "processed" || p.status === "paid"
  );
  const grossSum = processedOrPaid.reduce(
    (acc, r) => acc + Number(r.gross_total ?? 0),
    0
  );
  const netSum = processedOrPaid.reduce(
    (acc, r) => acc + Number(r.net_total ?? 0),
    0
  );

  // Próximo pago (si hay alguna "processed", usa último día del mes; si no, "-")
  const nextProcessed = payrolls.find((p) => p.status === "processed");
  let nextPayDate = "-";
  if (nextProcessed?.period_year && nextProcessed?.period_month) {
    const y = nextProcessed.period_year;
    const m = nextProcessed.period_month; // 1..12
    const lastDay = new Date(y, m, 0);
    nextPayDate = lastDay.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de Nóminas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Procesa y gestiona las nóminas de tus empleados
          </p>
        </div>

        <Link
          href="/payroll/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
        >
          <FilePlus2 className="h-4 w-4" />
          Nueva Nómina
        </Link>
      </div>

      {/* Stats */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Empleados</p>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{totalEmployees}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Nómina Bruta</p>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{fmtCurrency(grossSum)}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Nómina Neta</p>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{fmtCurrency(netSum)}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Próximo Pago</p>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{nextPayDate}</p>
        </div>
      </section>

      {/* Filtros (placeholder visual) */}
      <section className="mb-6 rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-3">
            <input
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Buscar por periodo…"
            />
            <select className="w-56 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary">
              <option>Todos los estados</option>
              <option>Procesada</option>
              <option>Pagada</option>
              <option>Borrador</option>
            </select>
          </div>
          <button className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90">
            Filtrar
          </button>
        </div>
      </section>

      {/* Lista de nóminas */}
      <section className="rounded-xl border bg-white">
        {pErr ? (
          <div className="p-6 text-sm text-destructive">
            Error cargando nóminas: {pErr.message}
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aún no tienes nóminas creadas.
          </div>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground">
              <div className="col-span-5 sm:col-span-4">Periodo</div>
              <div className="col-span-3 sm:col-span-3">Bruto</div>
              <div className="col-span-3 sm:col-span-3">Neto</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-12 hidden justify-end sm:col-span-1 sm:flex">
                Acciones
              </div>
            </div>

            {payrolls.map((p) => {
              const badge =
                p.status === "paid"
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                  : p.status === "processed"
                    ? "bg-blue-100 text-blue-700 ring-blue-200"
                    : "bg-slate-100 text-slate-700 ring-slate-200";

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4"
                >
                  <div className="col-span-5 sm:col-span-4">
                    <div className="font-medium">
                      {monthName(p.period_month)} {p.period_year}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Creada: {fmtDate(p.created_at)}
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-3 font-medium">
                    {fmtCurrency(p.gross_total)}
                  </div>
                  <div className="col-span-3 sm:col-span-3 font-medium">
                    {fmtCurrency(p.net_total)}
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${badge}`}
                    >
                      {p.status === "paid"
                        ? "Pagada"
                        : p.status === "processed"
                          ? "Procesada"
                          : "Borrador"}
                    </span>
                  </div>

                  <div className="col-span-12 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted"
                      title="Descargar PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

// Loading fallback opcional (si usas suspense en layouts)
export function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando nóminas…
      </div>
    </main>
  );
}
