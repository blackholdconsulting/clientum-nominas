// app/payroll/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@/lib/supabase/server"; // <- ajusta si tu ruta es otra

type PayrollRow = {
  id: string;
  period_year?: number | null;
  period_month?: number | null;
  status?: string | null;
  gross_total?: number | null;
  net_total?: number | null;
  next_pay_date?: string | null;
  created_at?: string | null;
};

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} €`;
  }
}

function formatNextPay(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  try {
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    // entornos sin locale
    return d.toISOString().slice(0, 10);
  }
}

// Intenta crear el cliente con y sin cookies (según cómo tengas tu helper)
function getSupabaseSafe() {
  try {
    // 1) firma sin argumentos
    // @ts-ignore
    const c1 = createSupabaseClient();
    if (c1) return c1;
  } catch {}
  try {
    // 2) firma con cookies
    const store = cookies();
    // @ts-ignore
    const c2 = createSupabaseClient(store);
    if (c2) return c2;
  } catch {}
  return null;
}

export default async function PayrollPage() {
  // --- cliente supabase
  const supabase = getSupabaseSafe();

  // valores por defecto para no romper el render
  let employeesCount = 0;
  let list: PayrollRow[] = [];
  let totals = { gross: 0, net: 0 };
  let nextPay: string | null = null;

  if (supabase) {
    try {
      const [{ data: employees }, { data: payrolls }] = await Promise.all([
        supabase.from("employees").select("id").order("created_at", { ascending: false }),
        supabase
          .from("payrolls")
          .select(
            "id, period_year, period_month, status, gross_total, net_total, next_pay_date, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

      employeesCount = employees?.length ?? 0;
      list = payrolls ?? [];

      totals = list.reduce(
        (acc, p) => {
          acc.gross += Number(p.gross_total ?? 0);
          acc.net += Number(p.net_total ?? 0);
          return acc;
        },
        { gross: 0, net: 0 }
      );

      nextPay =
        list.find((p) => !!p.next_pay_date)?.next_pay_date ??
        (list[0]?.next_pay_date ?? null);
    } catch (e) {
      // No rompas el render en producción
      console.error("Payroll page query error:", e);
    }
  } else {
    console.error("No se pudo crear el cliente de Supabase (revisa '@/lib/supabase/server').");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header Clientum */}
      <div className="mb-8 rounded-2xl border bg-white p-6 brand-hero">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestión de Nóminas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Procesa y gestiona las nóminas de tus empleados
            </p>
          </div>

          <Link
            href="/payroll/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nueva Nómina
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Total Empleados</div>
            <div className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.67 0-8 1.34-8 4v2h10M16 13c-1.15 0-2.67.17-4 .5 1.99.73 4 2.01 4 3.5v2h8v-2c0-2.66-5.33-4-8-4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{employeesCount}</div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Nómina Bruta</div>
            <div className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">€</div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.gross)}</div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Nómina Neta</div>
            <div className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">€</div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.net)}</div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Próximo Pago</div>
            <div className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 3v4M17 3v4M3 11h18M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatNextPay(nextPay)}</div>
        </div>
      </section>

      {/* Filtros */}
      <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            className="h-11 w-full rounded-lg border bg-white px-10 text-sm outline-none transition focus:ring-2 focus:ring-primary"
            placeholder="Buscar por periodo…"
            readOnly
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <select className="h-11 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary">
            <option>Todos los estados</option>
            <option>Procesada</option>
            <option>Pagada</option>
            <option>Pendiente</option>
          </select>
          <button className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:opacity-90">
            Filtrar
          </button>
        </div>
      </section>

      {/* Listado / empty state */}
      <section className="rounded-xl border bg-white p-10 text-center text-sm text-muted-foreground">
        {list.length === 0 ? (
          <>
            <p className="mb-1 font-medium text-foreground">Aún no tienes nóminas creadas.</p>
            <p>Haz clic en “Nueva Nómina” para empezar.</p>
          </>
        ) : (
          <div className="text-left">
            {/* Aquí iría la tabla real de nóminas */}
            <p className="text-foreground">(Aquí iría tu tabla de nóminas por periodo/estado)</p>
          </div>
        )}
      </section>
    </div>
  );
}
