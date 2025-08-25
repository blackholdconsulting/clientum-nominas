// app/dashboard/page.tsx
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  Users,
  ReceiptText,
  Rocket,
  ChevronRight,
  ListTree,
  FileText,
  Activity,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type LastPayroll = { id: string; run_date: string | null };
type AuditItem = { id: string; message: string; created_at: string };

async function getDashboard() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
      global: {
        headers: {
          "x-forwarded-host": (await headers()).get("host") ?? "",
        },
      },
    }
  );

  // 🔧 Ajusta nombres de tablas/campos a tu esquema real
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { employeesCount: 0, lastPayroll: null, recent: [] as AuditItem[] };

  const [{ count: employeesCount }, { data: lastPayroll }, { data: recent }] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("active", true),
    supabase
      .from("payroll_runs")
      .select("id, run_date")
      .eq("user_id", user.id)
      .order("run_date", { ascending: false })
      .limit(1)
      .maybeSingle<LastPayroll>(),
    supabase
      .from("audit_log") // si no tienes tabla de auditoría, devuelvo vacío
      .select("id, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<AuditItem[]>(),
  ]);

  return {
    employeesCount: employeesCount ?? 0,
    lastPayroll: lastPayroll ?? null,
    recent: recent ?? [],
  };
}

export default async function DashboardPage() {
  const { employeesCount, lastPayroll, recent } = await getDashboard();

  return (
    <main className="min-h-[calc(100dvh-64px)]">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 opacity-10" />
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bienvenido,
            <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600">
              {/** Puedes traer el email con supabase si quieres */}
            </span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Resumen de nóminas y accesos rápidos.
          </p>
        </div>
      </section>

      {/* KPIs */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <KpiCard
            title="Empleados"
            value={employeesCount.toString()}
            helper="Total activos"
            icon={<Users className="size-5 text-indigo-600" />}
          />

          <KpiCard
            title="Última nómina"
            value={lastPayroll?.run_date ? new Date(lastPayroll.run_date).toLocaleDateString() : "—"}
            helper={lastPayroll ? "Fecha de la última ejecución" : "sin registros"}
            icon={<ReceiptText className="size-5 text-violet-600" />}
          />

          <div className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Accesos rápidos</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Gestión de empleados y plantillas
                </p>
              </div>
              <Rocket className="size-6 text-fuchsia-600" />
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href="/employees"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                Empleados <ChevronRight className="size-4" />
              </Link>
              <Link
                href="/contracts/models"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition"
              >
                Plantillas <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Últimas acciones */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Últimas acciones
              </h3>
              <Link
                href="/payroll"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                Ver nóminas <ExternalLink className="size-3.5" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon={<Activity className="size-5 text-slate-400" />}
                title="No hay registros recientes."
                caption="Se mostrarán aquí las acciones más relevantes de tu cuenta."
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {recent.map((r) => (
                  <li key={r.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 size-2 rounded-full bg-indigo-500" />
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{r.message}</p>
                      <time className="ml-2 shrink-0 text-xs text-slate-500">
                        {new Date(r.created_at).toLocaleString()}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTA Plantillas */}
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2">
                <FileText className="size-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Plantillas de contrato
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Crea o edita tus modelos de contrato y úsalo en minutos.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/contracts/models"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ListTree className="size-4" /> Ir a plantillas
              </Link>
              <Link
                href="/api/diag"
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 underline underline-offset-2"
              >
                /api/diag
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------ UI bits ------------------------------ */

function KpiCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          {helper && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{helper}</p>
          )}
        </div>
        {icon}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  caption,
}: {
  icon?: React.ReactNode;
  title: string;
  caption?: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 py-10">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-2">{icon}</div>
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {caption && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{caption}</p>
      )}
    </div>
  );
}
