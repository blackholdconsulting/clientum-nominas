export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calculator, Users, FileText, BarChart3, LogOut } from "lucide-react"

type Totals = { gross: number; net: number; irpf: number; ss_er: number }

export default async function DashboardPage() {
  // 1) Autenticación (redirecciona si no hay sesión)
  const { supabase, user } = await requireUser()

  // 2) Lecturas robustas (nunca lanzar error si faltan tablas/vistas)
  let employeesCount = 0
  let latestRun:
    | { id: string; period_year: number; period_month: number; status: string }
    | null = null
  let totals: Totals = { gross: 0, net: 0, irpf: 0, ss_er: 0 }
  let hasSlipsTable = true

  // Empleados
  try {
    const { count } = await supabase
      .from("nominas_employees") // vista de compatibilidad
      .select("*", { head: true, count: "exact" })
      .eq("user_id", user.id)
    employeesCount = count ?? 0
  } catch {}

  // Último run
  try {
    const { data } = await supabase
      .from("payroll_runs")
      .select("id, period_year, period_month, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    latestRun = data ?? null
  } catch {
    latestRun = null
  }

  // Totales del último run (si existe)
  if (latestRun?.id) {
    try {
      const { data: slips } = await supabase
        .from("payroll_slips")
        .select("gross, net, irpf, ss_employer")
        .eq("run_id", latestRun.id)

      if (slips?.length) {
        totals = slips.reduce<Totals>(
          (acc, r: any) => ({
            gross: acc.gross + Number(r.gross ?? 0),
            net: acc.net + Number(r.net ?? 0),
            irpf: acc.irpf + Number(r.irpf ?? 0),
            ss_er: acc.ss_er + Number(r.ss_employer ?? 0),
          }),
          { gross: 0, net: 0, irpf: 0, ss_er: 0 },
        )
      }
    } catch {
      hasSlipsTable = false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold font-serif text-primary">Clientum Nóminas</h1>
              <Badge variant="secondary">Dashboard</Badge>
            </div>

            {/* Ajusta a tu ruta real de logout si la tienes */}
            <form action="/auth?next=%2F" method="get">
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">
            Bienvenido{user.email ? `, ${user.email}` : ""}
          </h2>
          <p className="text-muted-foreground">
            Gestiona las nóminas y empleados de tu cuenta PRO en Clientum.
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickCard
            href="/employees"
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Empleados"
            description="Gestionar empleados activos"
            badge={String(employeesCount)}
          />
          <QuickCard
            href="/contracts"
            icon={<FileText className="h-8 w-8 text-primary" />}
            title="Contratos"
            description="Contratos pendientes de revisión"
            badge={"0"}
          />
          <QuickCard
            href="/payroll"
            icon={<Calculator className="h-8 w-8 text-primary" />}
            title="Nóminas"
            description={
              latestRun
                ? `Último: ${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})`
                : "Aún no hay runs"
            }
            badge={latestRun ? "Periodo" : "—"}
          />
          <QuickCard
            href="/reports"
            icon={<BarChart3 className="h-8 w-8 text-primary" />}
            title="Informes"
            description="Informes pendientes de generar"
            badge={"0"}
          />
        </div>

        {/* Resumen + Alertas */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen financiero</CardTitle>
              <CardDescription>Costes de nómina del último periodo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Kpi label="Total Bruto" value={`€${totals.gross.toFixed(2)}`} />
                <Kpi label="Neto a pagar" value={`€${totals.net.toFixed(2)}`} />
                <Kpi label="IRPF" value={`€${totals.irpf.toFixed(2)}`} />
              </div>
              {!hasSlipsTable && (
                <p className="text-xs text-muted-foreground mt-3">
                  Nota: aún no existe <code>public.payroll_slips</code>. Los totales
                  aparecerán cuando crees tus primeras nóminas.
                </p>
              )}
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas del sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AlertPill
                  color="destructive"
                  text={employeesCount === 0 ? "Aún no has añadido empleados" : "Sin alertas críticas"}
                />
                <AlertPill
                  color="blue"
                  text={
                    latestRun
                      ? `Último run: ${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})`
                      : "Crea tu primer run de nómina"
                  }
                />
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}

/* ---------- Auxiliares ---------- */

function QuickCard({
  href, icon, title, description, badge,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  badge: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {icon}
            <Badge variant="secondary">{badge}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-muted/50 rounded-lg">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function AlertPill({ color, text }: { color: "destructive" | "blue"; text: string }) {
  const dot = color === "destructive" ? "bg-destructive" : "bg-blue-500"
  const bg = color === "destructive" ? "bg-destructive/10" : "bg-blue-50"
  return (
    <div className={`flex items-center space-x-2 p-2 rounded ${bg}`}>
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-sm">{text}</span>
    </div>
  )
}
