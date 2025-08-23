"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, ArrowLeft, Download, Send, Eye, Users, Euro, FileText } from "lucide-react"
import Link from "next/link"
import { use } from "react"

const mockPayrollData = {
  id: "1",
  period: "Diciembre 2024",
  status: "Procesada",
  processedDate: "2024-12-28",
  dueDate: "2024-12-31",
  employees: [
    {
      id: "1",
      name: "María García López",
      position: "Desarrolladora Senior",
      baseSalary: 4500,
      grossSalary: 4500,
      netSalary: 3766.5,
      irpf: 675,
      socialSecurity: 283.5,
      payslipGenerated: true,
    },
    {
      id: "2",
      name: "Juan Martínez Ruiz",
      position: "Diseñador UX",
      baseSalary: 3800,
      grossSalary: 3800,
      netSalary: 3178.6,
      irpf: 570,
      socialSecurity: 239.4,
      payslipGenerated: true,
    },
    {
      id: "3",
      name: "Ana Rodríguez Sánchez",
      position: "Project Manager",
      baseSalary: 4200,
      grossSalary: 4200,
      netSalary: 3511.4,
      irpf: 630,
      socialSecurity: 264.6,
      payslipGenerated: true,
    },
  ],
}

function PayrollDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const payroll = mockPayrollData

  const totalGross = payroll.employees.reduce((sum, emp) => sum + emp.grossSalary, 0)
  const totalNet = payroll.employees.reduce((sum, emp) => sum + emp.netSalary, 0)
  const totalIrpf = payroll.employees.reduce((sum, emp) => sum + emp.irpf, 0)
  const totalSocialSecurity = payroll.employees.reduce((sum, emp) => sum + emp.socialSecurity, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/payroll" className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5" />
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">Clientum Nóminas</h1>
              </Link>
              <Badge variant="secondary">Detalle de Nómina</Badge>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2">Nómina {payroll.period}</h2>
              <p className="text-muted-foreground">
                Procesada el {new Date(payroll.processedDate).toLocaleDateString("es-ES")} • Vencimiento:{" "}
                {new Date(payroll.dueDate).toLocaleDateString("es-ES")}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {payroll.status}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">{payroll.employees.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payroll.employees.length}</div>
              <p className="text-sm text-muted-foreground">Empleados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Euro className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">Bruto</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalGross.toLocaleString("es-ES")}</div>
              <p className="text-sm text-muted-foreground">Total Bruto</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Euro className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">Neto</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{totalNet.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
              </div>
              <p className="text-sm text-muted-foreground">Total Neto</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">PDF</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payroll.employees.filter((e) => e.payslipGenerated).length}</div>
              <p className="text-sm text-muted-foreground">Nóminas Generadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed View */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="deductions">Deducciones</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Detalle por Empleado</CardTitle>
                <CardDescription>Información detallada de cada empleado en esta nómina</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payroll.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-semibold">€{employee.grossSalary.toLocaleString("es-ES")}</p>
                          <p className="text-sm text-muted-foreground">Bruto</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            €{employee.netSalary.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-sm text-muted-foreground">Neto</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Totales de Nómina</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Salario Bruto</span>
                    <span className="font-semibold">€{totalGross.toLocaleString("es-ES")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total IRPF</span>
                    <span className="font-semibold text-destructive">-€{totalIrpf.toLocaleString("es-ES")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Seguridad Social</span>
                    <span className="font-semibold text-destructive">
                      -€{totalSocialSecurity.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total Neto</span>
                      <span className="font-bold">
                        €{totalNet.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información de Procesamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Fecha de Procesamiento</span>
                    <span>{new Date(payroll.processedDate).toLocaleDateString("es-ES")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha de Vencimiento</span>
                    <span>{new Date(payroll.dueDate).toLocaleDateString("es-ES")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado</span>
                    <Badge variant="secondary">{payroll.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Nóminas Generadas</span>
                    <span>
                      {payroll.employees.filter((e) => e.payslipGenerated).length}/{payroll.employees.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deductions">
            <Card>
              <CardHeader>
                <CardTitle>Desglose de Deducciones</CardTitle>
                <CardDescription>Detalle de todas las deducciones aplicadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payroll.employees.map((employee) => (
                    <div key={employee.id} className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-3">{employee.name}</h3>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">IRPF (15%)</p>
                          <p className="font-semibold">€{employee.irpf.toLocaleString("es-ES")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Seg. Social (6.3%)</p>
                          <p className="font-semibold">
                            €{employee.socialSecurity.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Deducciones</p>
                          <p className="font-semibold text-destructive">
                            €
                            {(employee.irpf + employee.socialSecurity).toLocaleString("es-ES", {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <PayrollDetailContent params={params} />
      </ProtectedRoute>
    </AuthProvider>
  )
}
