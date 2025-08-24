export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Users,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";

/**
 * Datos que se cargan:
 * - Empleados:     public.nominas_employees (vista de compatibilidad)
 * - Runs nómina:   public.payroll_runs      (user_id, period_year, period_month, status)
 * - Slips nómina:  public.payroll_slips     (run_id, gross, net, irpf, ss_employer)
 *
 * Multiusuario real: todas las consultas filtran por user.id (RLS hará el resto).
 */

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  // ---------- Empleados (por usuario) ----------
  const { count: employeesCount = 0 } = await supabase
    .from("nominas_employees")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // ---------- Último run de nómina ----------
  const { data: latestRun } = await supabase
    .from("payroll_runs")
    .select("id, period_year, period_month, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ---------- Totales del último run ----------
  let totals = { gross: 0, net: 0, irpf: 0, ss_er: 0 };
  let hasSlipsTable = true;

  if (latestRun?.id) {
    try {
      const { data: slips } = await supabase
        .from("payroll_slips")
        .select("gross, net, irpf, ss_employer")
        .eq("run_id", latestRun.id);

      if (slips?.length) {
        totals = slips.reduce(
          (acc: any, r: any) => ({
            gross: acc.gross + Number(r.gross || 0),
            net: acc.net + Number(r.net || 0),
            irpf: acc.irpf + Number(r.irpf || 0),
            ss_er: acc.ss_er + Number(r.ss_employer || 0),
          }),
          { gross: 0, net: 0, irpf: 0, ss_er: 0 }
        );
      }
    } catch {
      // Si la tabla no existe aún, seguimos sin romper UI
      hasSlipsTable = false;
    }
  }

  // Placeholders para secciones aún no conectadas
  const contractsPending = 0;
  const reportsPending = 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">
                  Clientum Nóminas
                </h1>
              </div>
              <Badge variant="secondary">Dashboard</Badge>
            </div>

            {/* Puedes cambiar esto por tu /api/auth/logout cuando lo tengas */}
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
        {/* Título */}
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
            badge={String(contractsPending)}
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
            badge={String(reportsPending)}
          />
        </div>

        {/* Resumen + Alertas */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen financiero</CardTitle>
              <CardDescription>
                Costes de nómina del último periodo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Kpi label="Total Bruto" value={`€${totals.gross.toFixed(2)}`} />
                <Kpi
                  label="Neto a pagar"
                  value={`€${totals.net.toFixed(2)}`}
                  classNameValue="text-green-600"
                />
                <Kpi
                  label="IRPF"
                  value={`€${totals.irpf.toFixed(2)}`}
                  classNameValue="text-orange-600"
                />
              </div>
              {!hasSlipsTable && (
                <p className="text-xs text-muted-foreground mt-3">
                  Nota: aún no existe <code>public.payroll_slips</code>. Los
                  totales aparecerán cuando crees tus primeras nóminas.
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
                text={
                  employeesCount === 0
                    ? "Aún no has añadido empleados"
                    : "Sin alertas críticas"
                }
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

        {/* Actividad + Próximas tareas */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityDot color="primary" title="Login correcto" meta="Ahora" />
                {latestRun && (
                  <ActivityDot
                    color="secondary"
                    title={`Run ${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})`}
                    meta="Reciente"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas tareas</CardTitle>
              <CardDescription>Tareas pendientes importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TaskRow
                  title="Añadir empleados"
                  meta="Completa tu plantilla"
                  badge="Urgente"
                  badgeVariant="destructive"
                />
                <TaskRow
                  title="Crear primer run de nómina"
                  meta="Configura el periodo actual"
                  badge="Pendiente"
                  badgeVariant="secondary"
                />
                <TaskRow
                  title="Generar informe anual"
                  meta="Cuando tengas movimientos"
                  badge="Programado"
                  badgeVariant="outline"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

/* ---------- Componentes auxiliares ---------- */

function QuickCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
      <Link href={href}>
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
      </Link>
    </Card>
  );
}

function Kpi({
  label,
  value,
  classNameValue,
}: {
  label: string;
  value: string;
  classNameValue?: string;
}) {
  return (
    <div className="text-center p-4 bg-muted/50 rounded-lg">
      <div className={`text-2xl font-bold ${classNameValue ?? ""}`}>{value}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function AlertPill({ color, text }: { color: "destructive" | "blue"; text: string }) {
  const dot =
    color === "destructive" ? "bg-destructive" : "bg-blue-500";
  const bg =
    color === "destructive" ? "bg-destructive/10" : "bg-blue-50";
  return (
    <div className={`flex items-center space-x-2 p-2 rounded ${bg}`}>
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function ActivityDot({
  color,
  title,
  meta,
}: {
  color: "primary" | "secondary" | "muted";
  title: string;
  meta: string;
}) {
  const map: Record<string, string> = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    muted: "bg-muted-foreground",
  };
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-2 h-2 rounded-full ${map[color]}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function TaskRow({
  title,
  meta,
  badge,
  badgeVariant,
}: {
  title: string;
  meta: string;
  badge: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <Badge variant={badgeVariant}>{badge}</Badge>
    </div>
  );
}
