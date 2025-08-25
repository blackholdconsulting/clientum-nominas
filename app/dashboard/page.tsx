import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const revalidate = 60 // revalida cada minuto (opcional)

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  // Empleados
  let employeesCount = 0
  {
    const { count, error } = await supabase
      .from("employees")
      .select("id", { head: true, count: "exact" })
    if (!error && typeof count === "number") employeesCount = count
  }

  // Última nómina (fecha aproximada)
  let lastRunLabel: string | null = null
  {
    const { data, error } = await supabase
      .from("payroll_runs")
      .select("period, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      // si tienes un campo period tipo '2024-05', úsalo; si no, cae a created_at
      const label =
        (data as any).period ??
        (data as any).created_at ??
        null
      if (label) lastRunLabel = String(label)
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-serif tracking-tight text-foreground">
            Bienvenido
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de nóminas
          </p>
        </header>

        {/* Grid de tarjetas */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Empleados */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Empleados</h2>
            </div>
            <div className="mt-3 text-4xl font-semibold text-foreground">
              {employeesCount}
            </div>
            <div className="mt-4">
              <Link
                href="/employees"
                className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Ver empleados
              </Link>
            </div>
          </div>

          {/* Última nómina */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Última nómina</h2>
            </div>
            <div className="mt-3 text-2xl font-semibold text-foreground">
              {lastRunLabel ?? "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Si no ves datos, crea una nómina o revisa permisos.
            </p>
          </div>

          {/* Plantillas de contrato */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Plantillas de contrato
              </h2>
            </div>
            <div className="mt-3 text-2xl font-semibold text-foreground">Acceso rápido</div>
            <div className="mt-4">
              <Link
                href="/contracts/models"
                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Ir a plantillas
              </Link>
            </div>
          </div>
        </section>

        {/* Ayuda / diagnóstico */}
        <section className="mt-10">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground">¿Problemas?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Si el problema persiste, revisa los logs del servidor o{" "}
              <Link href="/api/diag" className="underline underline-offset-4">
                /api/diag
              </Link>.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
