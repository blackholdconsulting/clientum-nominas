"use client"

import { useState } from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calculator,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
} from "lucide-react"
import Link from "next/link"

// Mock contract data
const mockContracts = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "María García López",
    contractType: "Indefinido",
    position: "Desarrolladora Senior",
    department: "Tecnología",
    startDate: "2022-03-15",
    endDate: null,
    salary: 45000,
    status: "Activo",
    renewalDate: null,
    createdDate: "2022-03-01",
    lastModified: "2022-03-10",
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Juan Martínez Ruiz",
    contractType: "Indefinido",
    position: "Gerente de Ventas",
    department: "Ventas",
    startDate: "2021-01-10",
    endDate: null,
    salary: 52000,
    status: "Activo",
    renewalDate: null,
    createdDate: "2020-12-15",
    lastModified: "2021-01-05",
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "Ana Rodríguez Sánchez",
    contractType: "Temporal",
    position: "Diseñadora UX",
    department: "Diseño",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    salary: 38000,
    status: "Activo",
    renewalDate: "2024-04-01",
    createdDate: "2023-05-15",
    lastModified: "2023-05-28",
  },
  {
    id: "4",
    employeeId: "4",
    employeeName: "Carlos López Fernández",
    contractType: "Indefinido",
    position: "Contador",
    department: "Finanzas",
    startDate: "2020-09-20",
    endDate: "2024-01-15",
    salary: 35000,
    status: "Finalizado",
    renewalDate: null,
    createdDate: "2020-09-01",
    lastModified: "2024-01-10",
  },
  {
    id: "5",
    employeeId: "5",
    employeeName: "Laura Jiménez Torres",
    contractType: "Prácticas",
    position: "Especialista en Marketing",
    department: "Marketing",
    startDate: "2023-02-14",
    endDate: "2024-02-13",
    salary: 32000,
    status: "Próximo a Vencer",
    renewalDate: "2024-01-14",
    createdDate: "2023-01-20",
    lastModified: "2023-02-10",
  },
]

function ContractsContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [contracts] = useState(mockContracts)

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.department.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || contract.contractType === typeFilter
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const contractTypes = [...new Set(contracts.map((contract) => contract.contractType))]
  const activeContracts = contracts.filter((contract) => contract.status === "Activo").length
  const expiringContracts = contracts.filter((contract) => contract.status === "Próximo a Vencer").length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Activo":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Próximo a Vencer":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "Finalizado":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Activo":
        return "default"
      case "Próximo a Vencer":
        return "destructive"
      case "Finalizado":
        return "secondary"
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
              <Badge variant="secondary">Contratos</Badge>
            </div>
            <Button asChild>
              <Link href="/contracts/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contrato
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Gestión de Contratos</h2>
          <p className="text-muted-foreground">Administra todos los contratos laborales de la empresa</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{contracts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{contracts.length}</CardTitle>
              <CardDescription>Total Contratos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <Badge variant="secondary">{activeContracts}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{activeContracts}</CardTitle>
              <CardDescription>Contratos Activos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <Badge variant="destructive">{expiringContracts}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{expiringContracts}</CardTitle>
              <CardDescription>Próximos a Vencer</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Filter className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{contractTypes.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{contractTypes.length}</CardTitle>
              <CardDescription>Tipos de Contrato</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por empleado, puesto o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Próximo a Vencer">Próximo a Vencer</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contratos ({filteredContracts.length})</CardTitle>
            <CardDescription>Información detallada de todos los contratos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo de Contrato</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={`/abstract-geometric-shapes.png?height=40&width=40&query=${contract.employeeName}`}
                            />
                            <AvatarFallback>
                              {contract.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contract.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{contract.position}</p>
                            <p className="text-xs text-muted-foreground">{contract.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.contractType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>Inicio: {new Date(contract.startDate).toLocaleDateString("es-ES")}</span>
                          </div>
                          {contract.endDate && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Fin: {new Date(contract.endDate).toLocaleDateString("es-ES")}</span>
                            </div>
                          )}
                          {contract.renewalDate && (
                            <div className="flex items-center text-sm text-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>Renovar: {new Date(contract.renewalDate).toLocaleDateString("es-ES")}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{contract.salary.toLocaleString()}€</span>
                        <p className="text-sm text-muted-foreground">anual</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(contract.status)}
                          <Badge variant={getStatusVariant(contract.status) as any}>{contract.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/contracts/${contract.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/contracts/${contract.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function ContractsPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ContractsContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
