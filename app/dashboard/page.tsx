"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthProvider, useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Users, FileText, BarChart3, LogOut } from "lucide-react"
import Link from "next/link"

function DashboardContent() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">Clientum Nóminas</h1>
              </div>
              <Badge variant="secondary">Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.organization}</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Bienvenido, {user?.name}</h2>
          <p className="text-muted-foreground">Gestiona las nóminas y empleados de {user?.organization}</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/employees">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">12</Badge>
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
                  <Badge variant="secondary">8</Badge>
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
                  <Badge variant="secondary">Dic</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Nóminas</CardTitle>
                <CardDescription>Procesar nóminas de diciembre</CardDescription>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/reports">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">3</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Informes</CardTitle>
                <CardDescription>Informes pendientes de generar</CardDescription>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
              <CardDescription>Costes de nómina del último trimestre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">€45.600</div>
                  <p className="text-sm text-muted-foreground">Total Bruto</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">€34.200</div>
                  <p className="text-sm text-muted-foreground">Total Neto</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">€11.400</div>
                  <p className="text-sm text-muted-foreground">Retenciones</p>
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
                <span className="text-sm">2 contratos expiran este mes</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-orange-100 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Modelo 111 vence el 20/01</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Backup completado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nómina procesada para María García</p>
                    <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuevo empleado añadido: Juan López</p>
                    <p className="text-xs text-muted-foreground">Hace 4 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Contrato renovado para Ana Martín</p>
                    <p className="text-xs text-muted-foreground">Ayer</p>
                  </div>
                </div>
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
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Procesar nóminas de diciembre</p>
                    <p className="text-xs text-muted-foreground">Vence: 31 de diciembre</p>
                  </div>
                  <Badge variant="destructive">Urgente</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Revisar contratos temporales</p>
                    <p className="text-xs text-muted-foreground">Vence: 15 de enero</p>
                  </div>
                  <Badge variant="secondary">Pendiente</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Generar informe anual</p>
                    <p className="text-xs text-muted-foreground">Vence: 31 de enero</p>
                  </div>
                  <Badge variant="outline">Programado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
