export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calculator,
  Users,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";

/**
 * NOTAS RÁPIDAS
 * - Este dashboard asume tablas en esquema PUBLIC:
 *   - public.employees        (user_id uuid)
 *   - public.payroll_runs     (user_id uuid, period_year int, period_month int, status text)
 *   - public.payroll_slips    (run_id uuid, employee_id uuid, gross numeric, net numeric, irpf numeric, ss_employer numeric)
 * - Si los nombres difieren, cambia abajo los .from("...") y los campos.
 */

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  // ----- MÉTRICAS DE CABECERA -----
  const [{ count: employeesCount = 0 }, { data: latestRun }] = await Promise.all([
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("payroll_runs")
      .select("id, period_year, period_month, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Totales del último run (si existe)
  let totals = { gross: 0, net: 0, irpf: 0, ss_er: 0 };
  if (latestRun?.id) {
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
  }

  // Placeholder para “contratos” e “informes” si aún no tienes tablas
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
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">
                  Clientum Nóminas
                </h1>
              </div>
              <Badge variant="secondary">Dashboard</Badge>
            </div>

            {/* puedes cambiar este botón cuando añadas /api/auth/logout */}
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
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/employees">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{employeesCount}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Empleados</CardTitle>
                <CardDescription>Gestionar empleados activos</CardDescription>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/contracts">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{contractsPending}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Contratos</CardTitle>
                <CardDescription>Contratos pendientes de revisión</CardDescription>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/payroll">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Calculator className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">
                    {latestRun ? "Periodo" : "—"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Nóminas</CardTitle>
                <CardDescription>
                  {latestRun
                    ? `Último: ${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})`
                    : "Aún no hay runs"}
                </CardDescription>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/reports">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{reportsPending}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Informes</CardTitle>
                <CardDescription>Informes pendientes de generar</CardDescription>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Resumen + Alertas */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
              <CardDescription>Costes de nómina del último periodo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    €{totals.gross.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Bruto</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    €{totals.net.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Neto</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    €{totals.irpf.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">IRPF</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 p-2 bg-destructive/10 rounded">
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
                <span className="text-sm">
                  {employeesCount === 0
                    ? "Aún no has añadido empleados"
                    : "Sin alertas críticas"}
                </span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">
                  {latestRun
                    ? `Último run: ${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})`
                    : "Crea tu primer run de nómina"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actividad + Próximas tareas (placeholder funcional) */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
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
              <CardTitle>Próximas Tareas</CardTitle>
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

/* ------- Componentes auxiliares ------- */

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
  badgeVariant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <Badge variant={badgeVariant as any}>{badge}</Badge>
    </div>
  );
}
