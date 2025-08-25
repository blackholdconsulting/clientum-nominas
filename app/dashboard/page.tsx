// app/dashboard/page.tsx
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

function getSupabaseServerClient() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {}, // no-op en Server Components
        remove: () => {}, // no-op
      },
      global: { headers: { "x-forwarded-host": headers().get("host") ?? "" } },
    }
  );
  return supabase;
}

export default async function DashboardPage() {
  try {
    const supabase = getSupabaseServerClient();

    // 1) Probar la vista si existe
    let employeesCount: number | null = null;
    let lastRunAt: string | null = null;

    const { data: resume, error: resumeErr } = await supabase
      .from("v_dashboard_resume")
      .select("employees_count,last_run_at")
      .limit(1)
      .maybeSingle();

    if (!resumeErr && resume) {
      employeesCount = resume.employees_count ?? null;
      lastRunAt = resume.last_run_at ?? null;
    }

    // 2) Fallback si no hay vista
    if (employeesCount === null) {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      employeesCount = count ?? 0;
    }

    if (lastRunAt === null) {
      const { data: lastRun } = await supabase
        .from("payroll_runs")
        .select("run_date")
        .order("run_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastRun?.run_date) lastRunAt = lastRun.run_date;
    }

    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Card empleados */}
          <div className="rounded-2xl border bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500">Empleados</p>
            <p className="mt-2 text-4xl font-semibold">{employeesCount ?? 0}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Total de empleados de tu organización
            </p>
          </div>

          {/* Card última nómina */}
          <div className="rounded-2xl border bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500">Última nómina</p>
            <p className="mt-2 text-2xl font-semibold">
              {lastRunAt ? new Date(lastRunAt).toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Fecha del último proceso registrado
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/employees"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Ver empleados
          </Link>
          <Link
            href="/contracts/models"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
          >
            Plantillas de contrato
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          Si el problema persiste, revisa los logs del servidor o{" "}
          <Link href="/api/diag" className="underline">
            /api/diag
          </Link>
          .
        </p>
      </main>
    );
  } catch {
    // Pantalla segura si algo peta
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          <h2 className="text-lg font-semibold">Ha ocurrido un error</h2>
          <p className="mt-2 text-sm">
            El dashboard no pudo cargar. Revisa <code>/api/diag</code> para más detalles.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
