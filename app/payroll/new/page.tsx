"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calculator, ArrowLeft, Users, Euro } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const mockEmployees = [
  { id: "1", name: "María García López", position: "Desarrolladora Senior", baseSalary: 4500, selected: true },
  { id: "2", name: "Juan Martínez Ruiz", position: "Diseñador UX", baseSalary: 3800, selected: true },
  { id: "3", name: "Ana Rodríguez Sánchez", position: "Project Manager", baseSalary: 4200, selected: true },
  { id: "4", name: "Carlos López Fernández", position: "Desarrollador Junior", baseSalary: 2800, selected: true },
  { id: "5", name: "Laura Martín González", position: "Marketing Manager", baseSalary: 3600, selected: false },
]

function NewPayrollContent() {
  const [selectedEmployees, setSelectedEmployees] = useState(
    mockEmployees.reduce((acc, emp) => ({ ...acc, [emp.id]: emp.selected }), {} as Record<string, boolean>),
  )
  const [payrollPeriod, setPayrollPeriod] = useState("")
  const [payrollMonth, setPayrollMonth] = useState("")
  const [payrollYear, setPayrollYear] = useState("2024")

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  const selectedCount = Object.values(selectedEmployees).filter(Boolean).length
  const totalGrossSalary = mockEmployees
    .filter((emp) => selectedEmployees[emp.id])
    .reduce((sum, emp) => sum + emp.baseSalary, 0)

  const calculateNetSalary = (grossSalary: number) => {
    // Simplified Spanish tax calculation
    const irpf = grossSalary * 0.15 // 15% IRPF approximation
    const socialSecurity = grossSalary * 0.063 // 6.3% employee social security
    return grossSalary - irpf - socialSecurity
  }

  const totalNetSalary = mockEmployees
    .filter((emp) => selectedEmployees[emp.id])
    .reduce((sum, emp) => sum + calculateNetSalary(emp.baseSalary), 0)

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
              <Badge variant="secondary">Nueva Nómina</Badge>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href="/payroll">Cancelar</Link>
              </Button>
              <Button>Procesar Nómina</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Crear Nueva Nómina</h2>
          <p className="text-muted-foreground">Configura y procesa una nueva nómina para tus empleados</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Nómina</CardTitle>
                <CardDescription>Define el período y parámetros de la nómina</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mes</Label>
                    <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">Enero</SelectItem>
                        <SelectItem value="02">Febrero</SelectItem>
                        <SelectItem value="03">Marzo</SelectItem>
                        <SelectItem value="04">Abril</SelectItem>
                        <SelectItem value="05">Mayo</SelectItem>
                        <SelectItem value="06">Junio</SelectItem>
                        <SelectItem value="07">Julio</SelectItem>
                        <SelectItem value="08">Agosto</SelectItem>
                        <SelectItem value="09">Septiembre</SelectItem>
                        <SelectItem value="10">Octubre</SelectItem>
                        <SelectItem value="11">Noviembre</SelectItem>
                        <SelectItem value="12">Diciembre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Select value={payrollYear} onValueChange={setPayrollYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selección de Empleados</CardTitle>
                <CardDescription>Selecciona los empleados para incluir en esta nómina</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedEmployees[employee.id]}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
                        <div>
                          <h3 className="font-semibold">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{employee.baseSalary.toLocaleString("es-ES")}</p>
                        <p className="text-sm text-muted-foreground">Salario base</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Nómina</CardTitle>
                <CardDescription>Totales calculados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Empleados</span>
                  </div>
                  <span className="font-semibold">{selectedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Bruto</span>
                  </div>
                  <span className="font-semibold">€{totalGrossSalary.toLocaleString("es-ES")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Neto</span>
                  </div>
                  <span className="font-semibold">
                    €{totalNetSalary.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deducciones</span>
                    <span className="font-semibold text-destructive">
                      €{(totalGrossSalary - totalNetSalary).toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desglose de Deducciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>IRPF (15%)</span>
                  <span>€{(totalGrossSalary * 0.15).toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seg. Social (6.3%)</span>
                  <span>€{(totalGrossSalary * 0.063).toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NewPayrollPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <NewPayrollContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
