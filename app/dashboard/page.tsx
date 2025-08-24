// app/dashboard/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

type CountResult = { count: number; error?: any };

// helper: cuenta filas con seguridad
async function safeCount(
  table: string,
  filter: (q: ReturnType<ReturnType<typeof supabaseServer>["from"]>) => any
): Promise<CountResult> {
  const supabase = supabaseServer();
  try {
    // head:true + count:"exact" evita traer filas
    const { count, error } = await filter(supabase.from(table).select("*", { head: true, count: "exact" }));
    // si la tabla no existe, Postgres devuelve 42P01
    if (error && (error as any).code === "42P01") return { count: 0 };
    return { count: count ?? 0, error };
  } catch {
    return { count: 0 };
  }
}

export default async function DashboardPage() {
  const supabase = supabaseServer();

  // sesión/usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "usuario";

  // empleados del usuario (multi-tenant por user_id)
  const employees = await safeCount("employees", (q) => q.eq("user_id", user?.id ?? "__none__"));

  // última nómina (si existe la tabla)
  let lastRunDate: string | null = null;
  let lastRunId: string | null = null;
  try {
    const { data, error } = await supabase
      .from("payroll_runs")
      .select("id, created_at")
      .eq("user_id", user?.id ?? "__none__")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      lastRunDate = new Date(data.created_at).toLocaleString();
      lastRunId = data.id as unknown as string;
    }
  } catch {
    /* si no existe la tabla, seguimos */
  }

  // nº de recibos de la última nómina (si existen tablas)
  let lastSlips = 0;
  try {
    if (lastRunId) {
      const { count } = await supabase
        .from("payroll_slips")
        .select("*", { count: "exact", head: true })
        .eq("run_id", lastRunId);
      lastSlips = count ?? 0;
    }
  } catch {
    /* ignorar */
  }

  return (
    <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 16px", lineHeight: 1.5 }}>
      <h1>Bienvenido, {email}</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Resumen de nóminas</h2>

        {employees.error ? (
          <p>
            No se pudo cargar el dashboard.
            <br />
            Detalle: {String(employees.error?.message ?? employees.error)}
          </p>
        ) : (
          <>
            <p>
              <strong>Empleados:</strong> {employees.count}
            </p>

            <p>
              <strong>Última nómina:</strong>{" "}
              {lastRunDate ? (
                <>
                  {lastRunDate} — {lastSlips} recibo(s)
                </>
              ) : (
                "—"
              )}
            </p>
          </>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <Link href="/employees" style={{ textDecoration: "underline" }}>
            Ver empleados
          </Link>
          <Link href="/contracts/models" style={{ textDecoration: "underline" }}>
            Plantillas de contrato
          </Link>
        </div>

        {/* Ruta de diagnóstico opcional */}
        <p style={{ marginTop: 24, fontSize: 13, color: "#666" }}>
          Si el problema persiste, revisa los logs del servidor o{" "}
          <a href="/api/diag" style={{ textDecoration: "underline" }}>
            /api/diag
          </a>
          .
        </p>
      </section>
    </main>
  );
}
