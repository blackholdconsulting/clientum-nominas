"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Plus, Search, Download, Eye, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const mockPayrollRuns = [
  {
    id: "1",
    period: "Diciembre 2024",
    status: "Procesada",
    employees: 12,
    totalGross: 45600.0,
    totalNet: 34200.0,
    processedDate: "2024-12-28",
    dueDate: "2024-12-31",
  },
  {
    id: "2",
    period: "Noviembre 2024",
    status: "Pagada",
    employees: 12,
    totalGross: 45600.0,
    totalNet: 34200.0,
    processedDate: "2024-11-28",
    dueDate: "2024-11-30",
  },
  {
    id: "3",
    period: "Octubre 2024",
    status: "Pagada",
    employees: 11,
    totalGross: 41800.0,
    totalNet: 31350.0,
    processedDate: "2024-10-28",
    dueDate: "2024-10-31",
  },
]

function PayrollContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPayrolls = mockPayrollRuns.filter((payroll) => {
    const matchesSearch = payroll.period.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payroll.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "procesada":
        return "secondary"
      case "pagada":
        return "default"
      case "pendiente":
        return "destructive"
      default:
        return "outline"
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
              <Badge variant="secondary">Nóminas</Badge>
            </div>
            <Button asChild>
              <Link href="/payroll/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Nómina
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Gestión de Nóminas</h2>
          <p className="text-muted-foreground">Procesa y gestiona las nóminas de tus empleados</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Empleados</CardTitle>
              <div className="text-2xl font-bold">12</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nómina Bruta</CardTitle>
              <div className="text-2xl font-bold">€45.600</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nómina Neta</CardTitle>
              <div className="text-2xl font-bold">€34.200</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Próximo Pago</CardTitle>
              <div className="text-2xl font-bold">31 Dic</div>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por período..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="procesada">Procesada</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payroll List */}
        <Card>
          <CardHeader>
            <CardTitle>Nóminas Procesadas</CardTitle>
            <CardDescription>Historial de nóminas procesadas y pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayrolls.map((payroll) => (
                <div
                  key={payroll.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{payroll.period}</h3>
                      <p className="text-sm text-muted-foreground">
                        {payroll.employees} empleados • Procesada:{" "}
                        {new Date(payroll.processedDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        €{payroll.totalNet.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">Neto</p>
                    </div>
                    <Badge variant={getStatusColor(payroll.status)}>{payroll.status}</Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/payroll/${payroll.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
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
      </main>
    </div>
  )
}

export default function PayrollPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <PayrollContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
