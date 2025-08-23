"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, BarChart3, Download, FileText, TrendingUp, Users, Euro, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const mockReports = [
  {
    id: "1",
    name: "Resumen Mensual de Nóminas",
    description: "Informe completo de nóminas procesadas en el mes",
    type: "monthly",
    period: "Diciembre 2024",
    status: "Disponible",
    size: "2.3 MB",
    generatedDate: "2024-12-28",
  },
  {
    id: "2",
    name: "Análisis de Costes Laborales",
    description: "Desglose detallado de costes por empleado y departamento",
    type: "analysis",
    period: "Q4 2024",
    status: "Disponible",
    size: "1.8 MB",
    generatedDate: "2024-12-25",
  },
  {
    id: "3",
    name: "Informe de Retenciones IRPF",
    description: "Resumen de retenciones fiscales para Hacienda",
    type: "tax",
    period: "2024",
    status: "Disponible",
    size: "956 KB",
    generatedDate: "2024-12-20",
  },
  {
    id: "4",
    name: "Cotizaciones Seguridad Social",
    description: "Informe de cotizaciones para la Seguridad Social",
    type: "social-security",
    period: "Diciembre 2024",
    status: "Generando",
    size: "-",
    generatedDate: "-",
  },
]

const mockAnalytics = {
  totalEmployees: 12,
  totalPayrollCost: 45600,
  averageSalary: 3800,
  totalTaxes: 11400,
  monthlyGrowth: 2.3,
  departmentCosts: [
    { name: "Desarrollo", employees: 5, cost: 19500 },
    { name: "Diseño", employees: 2, cost: 7600 },
    { name: "Marketing", employees: 3, cost: 10800 },
    { name: "Administración", employees: 2, cost: 7700 },
  ],
}

function ReportsContent() {
  const [periodFilter, setPeriodFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredReports = mockReports.filter((report) => {
    const matchesPeriod = periodFilter === "all" || report.period.includes(periodFilter)
    const matchesType = typeFilter === "all" || report.type === typeFilter
    return matchesPeriod && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "disponible":
        return "default"
      case "generando":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "monthly":
        return <Calendar className="h-4 w-4" />
      case "analysis":
        return <BarChart3 className="h-4 w-4" />
      case "tax":
        return <FileText className="h-4 w-4" />
      case "social-security":
        return <Users className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">Clientum Nóminas</h1>
              </Link>
              <Badge variant="secondary">Informes</Badge>
            </div>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generar Informe
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Informes y Análisis</h2>
          <p className="text-muted-foreground">Genera y descarga informes detallados de nóminas y costes laborales</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.totalEmployees}</div>
              <p className="text-sm text-muted-foreground">Empleados Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Euro className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">+{mockAnalytics.monthlyGrowth}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{mockAnalytics.totalPayrollCost.toLocaleString("es-ES")}</div>
              <p className="text-sm text-muted-foreground">Coste Total Nóminas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">Media</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{mockAnalytics.averageSalary.toLocaleString("es-ES")}</div>
              <p className="text-sm text-muted-foreground">Salario Medio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">25%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{mockAnalytics.totalTaxes.toLocaleString("es-ES")}</div>
              <p className="text-sm text-muted-foreground">Total Retenciones</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Informes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los períodos</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="Diciembre">Diciembre</SelectItem>
                      <SelectItem value="Q4">Q4 2024</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="analysis">Análisis</SelectItem>
                      <SelectItem value="tax">Fiscal</SelectItem>
                      <SelectItem value="social-security">Seg. Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informes Disponibles</CardTitle>
                <CardDescription>Descarga informes generados y gestiona nuevos informes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {report.period}
                            </Badge>
                            {report.size !== "-" && (
                              <span className="text-xs text-muted-foreground">{report.size}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
                        {report.status === "Disponible" && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Analysis */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis por Departamento</CardTitle>
                <CardDescription>Distribución de costes laborales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.departmentCosts.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dept.name}</span>
                        <span className="text-sm font-semibold">€{dept.cost.toLocaleString("es-ES")}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{dept.employees} empleados</span>
                        <span>{((dept.cost / mockAnalytics.totalPayrollCost) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(dept.cost / mockAnalytics.totalPayrollCost) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Informe Mensual
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análisis de Costes
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Informe IRPF
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cotizaciones SS
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas Fechas Límite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Modelo 111 IRPF</span>
                  <Badge variant="destructive" className="text-xs">
                    20 Ene
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">TC1 Seg. Social</span>
                  <Badge variant="secondary" className="text-xs">
                    31 Ene
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Modelo 303 IVA</span>
                  <Badge variant="outline" className="text-xs">
                    20 Feb
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ReportsContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
