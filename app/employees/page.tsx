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
import { Calculator, Plus, Search, Filter, Users, Mail, Phone, MapPin, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

// Mock employee data
const mockEmployees = [
  {
    id: "1",
    name: "María García López",
    email: "maria.garcia@empresa.com",
    phone: "+34 666 123 456",
    position: "Desarrolladora Senior",
    department: "Tecnología",
    salary: 45000,
    startDate: "2022-03-15",
    status: "Activo",
    contractType: "Indefinido",
    location: "Madrid",
  },
  {
    id: "2",
    name: "Juan Martínez Ruiz",
    email: "juan.martinez@empresa.com",
    phone: "+34 666 789 012",
    position: "Gerente de Ventas",
    department: "Ventas",
    salary: 52000,
    startDate: "2021-01-10",
    status: "Activo",
    contractType: "Indefinido",
    location: "Barcelona",
  },
  {
    id: "3",
    name: "Ana Rodríguez Sánchez",
    email: "ana.rodriguez@empresa.com",
    phone: "+34 666 345 678",
    position: "Diseñadora UX",
    department: "Diseño",
    salary: 38000,
    startDate: "2023-06-01",
    status: "Activo",
    contractType: "Temporal",
    location: "Valencia",
  },
  {
    id: "4",
    name: "Carlos López Fernández",
    email: "carlos.lopez@empresa.com",
    phone: "+34 666 901 234",
    position: "Contador",
    department: "Finanzas",
    salary: 35000,
    startDate: "2020-09-20",
    status: "Inactivo",
    contractType: "Indefinido",
    location: "Sevilla",
  },
  {
    id: "5",
    name: "Laura Jiménez Torres",
    email: "laura.jimenez@empresa.com",
    phone: "+34 666 567 890",
    position: "Especialista en Marketing",
    department: "Marketing",
    salary: 32000,
    startDate: "2023-02-14",
    status: "Activo",
    contractType: "Temporal",
    location: "Madrid",
  },
]

function EmployeesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [employees] = useState(mockEmployees)

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const departments = [...new Set(employees.map((emp) => emp.department))]
  const activeEmployees = employees.filter((emp) => emp.status === "Activo").length
  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0)

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
              <Badge variant="secondary">Empleados</Badge>
            </div>
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Gestión de Empleados</h2>
          <p className="text-muted-foreground">Administra la información de todos los empleados de la empresa</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{employees.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{activeEmployees}</CardTitle>
              <CardDescription>Empleados Activos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Calculator className="h-8 w-8 text-primary" />
                <Badge variant="secondary">€</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{totalSalary.toLocaleString()}€</CardTitle>
              <CardDescription>Masa Salarial Total</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Filter className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{departments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{departments.length}</CardTitle>
              <CardDescription>Departamentos</CardDescription>
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
                    placeholder="Buscar por nombre, email o puesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
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
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Empleados ({filteredEmployees.length})</CardTitle>
            <CardDescription>Información detallada de todos los empleados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Puesto</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={`/abstract-geometric-shapes.png?height=40&width=40&query=${employee.name}`} />
                            <AvatarFallback>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {employee.email}
                              </span>
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {employee.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.position}</p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {employee.location}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{employee.salary.toLocaleString()}€</span>
                        <p className="text-sm text-muted-foreground">anual</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "Activo" ? "default" : "secondary"}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.contractType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/employees/${employee.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
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

export default function EmployeesPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <EmployeesContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
