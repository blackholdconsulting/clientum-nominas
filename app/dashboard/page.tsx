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

    // 1) Intentamos leer la vista si existe (no falla si no existe)
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

    // 2) Si la vista no existe o no trae datos, calculamos “a la vieja usanza”
    if (employeesCount === null) {
      const { count: eCount, error: eErr } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      if (!eErr) employeesCount = eCount ?? 0;
      else employeesCount = 0; // fallback
    }

    if (lastRunAt === null) {
      const { data: lastRun, error: rErr } = await supabase
        .from("payroll_runs")
        .select("run_date")
        .order("run_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!rErr && lastRun?.run_date) lastRunAt = lastRun.run_date;
    }

    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          Bienvenido
        </h1>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Resumen de nóminas
          </h2>
          <p>Empleados: {employeesCount ?? 0}</p>
          <p>Última nómina: {lastRunAt ? new Date(lastRunAt).toLocaleString() : "—"}</p>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <Link href="/employees">Ver empleados</Link>
            <Link href="/contracts/models">Plantillas de contrato</Link>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: "#555" }}>
            Si el problema persiste, revisa los logs del servidor o{" "}
            <Link href="/api/diag">/api/diag</Link>.
          </p>
        </section>
      </main>
    );
  } catch (err) {
    // NUNCA rompas el SSR: devuelve una pantalla segura
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Ha ocurrido un error</h1>
        <p>El dashboard no pudo cargar. Revisa /api/diag para más detalle.</p>
        <div style={{ marginTop: 12 }}>
          <Link href="/">Ir al inicio</Link>
        </div>
      </main>
    );
  }
}
