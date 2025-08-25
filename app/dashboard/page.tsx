// app/dashboard/page.tsx
import Link from "next/link";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { cookies, headers } from "next/headers";

// Si en tu proyecto tienes este helper, úsalo.
// Debe ser una Server Action/función async compatible.
// import { getSupabaseServerClient } from "@/lib/supabase/server";

// Fallback: evita romper si el helper aún no está disponible.
async function getSupabaseSafe() {
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
        global: {
          headers: {
            "x-forwarded-host": headers().get("host") ?? "",
          },
        },
      }
    );
    return supabase;
  } catch {
    return null as any;
  }
}

type DashboardData = {
  userEmail: string | null;
  employeesCount: number;
  lastRunLabel: string | null;
  lastRunDate: string | null;
  quickLog: Array<{ id: string; title: string; when: string }>;
};

async function loadDashboard(): Promise<DashboardData> {
  // const supabase = await getSupabaseServerClient();
  const supabase = await getSupabaseSafe();

  let userEmail: string | null = null;
  let employeesCount = 0;
  let lastRunLabel: string | null = null;
  let lastRunDate: string | null = null;
  const quickLog: DashboardData["quickLog"] = [];

  if (!supabase) {
    // Modo “offline”: render bonito pero sin datos
    return { userEmail, employeesCount, lastRunLabel, lastRunDate, quickLog };
  }

  // Usuario
  try {
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  } catch {
    userEmail = null;
  }

  // Empleados (usa tu vista/tabla real)
  try {
    // Ajusta a tu fuente real: e.g. from("nominas_employees") o v_employees
    const { count } = await supabase
      .from("nominas_employees")
      .select("*", { head: true, count: "exact" });
    employeesCount = count ?? 0;
  } catch {
    employeesCount = 0;
  }

  // Última nómina (ajusta a tu tabla/vista de runs)
  try {
    // Ejemplo: "payroll_runs": { label, created_at }
    const { data } = await supabase
      .from("payroll_runs")
      .select("label, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      lastRunLabel = data.label ?? "—";
      lastRunDate = data.created_at
        ? format(new Date(data.created_at), "d MMM yyyy, HH:mm", { locale: es })
        : null;
    }
  } catch {
    lastRunLabel = null;
    lastRunDate = null;
  }

  // Log de acciones recientes (opcional). Ajústalo a tu “audit log” si tienes.
  try {
    const { data } = await supabase
      .from("payroll_slips")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (Array.isArray(data)) {
      for (const row of data) {
        quickLog.push({
          id: row.id,
          title: "Generación de recibo de nómina",
          when: row.created_at
            ? format(new Date(row.created_at), "d MMM yyyy, HH:mm", {
                locale: es,
              })
            : "—",
        });
      }
    }
  } catch {
    // vacío
  }

  return { userEmail, employeesCount, lastRunLabel, lastRunDate, quickLog };
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${className}`}
      style={{ borderColor: "rgb(226 232 240)" /* slate-200 */ }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  foot,
}: {
  label: string;
  value: string | number;
  foot?: string | null;
}) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {foot ? <div className="mt-1 text-sm text-slate-500">{foot}</div> : null}
    </Card>
  );
}

export default async function DashboardPage() {
  const {
    userEmail,
    employeesCount,
    lastRunLabel,
    lastRunDate,
    quickLog,
  } = await loadDashboard();

  return (
    <main className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Bienvenido{userEmail ? `, ${userEmail}` : ""}
        </h1>
        <p className="text-slate-600">Resumen de nóminas</p>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Empleados" value={employeesCount} foot="Total activos" />
        <Stat
          label="Última nómina"
          value={lastRunLabel ?? "—"}
          foot={lastRunDate ?? "sin registros"}
        />
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Accesos rápidos
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Gestión de empleados y plantillas
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employees"
              className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Empleados
            </Link>
            <Link
              href="/contracts/models"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Plantillas
            </Link>
          </div>
        </Card>
      </section>

      {/* Panel inferior: Acciones recientes + Ayuda */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Últimas acciones
            </h2>
            <Link
              href="/payroll"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Ver nóminas
            </Link>
          </div>

          <ul className="divide-y">
            {quickLog.length > 0 ? (
              quickLog.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {/* icono inline */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-indigo-600"
                    >
                      <path
                        d="M5 12h14M12 5v14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500">{item.when}</div>
                    </div>
                  </div>
                  <Link
                    className="text-sm text-indigo-600 hover:underline"
                    href={`/payroll/slips/${item.id}`}
                  >
                    Ver
                  </Link>
                </li>
              ))
            ) : (
              <li className="py-6 text-sm text-slate-500">
                No hay registros recientes.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-2 text-base font-semibold text-slate-900">
            ¿Problemas?
          </h2>
          <p className="text-sm text-slate-600">
            Si no ves datos, crea una nómina o revisa permisos. Para ver logs del
            servidor:
          </p>
          <div className="mt-3">
            <Link
              href="/api/diag"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              /api/diag
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/contracts/models"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {/* icono */}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M6 8h12M6 12h12M6 16h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              Ir a plantillas
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
