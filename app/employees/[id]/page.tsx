"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calculator,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  User,
  Briefcase,
  Euro,
} from "lucide-react"
import Link from "next/link"

// Mock employee data (same as in employees page)
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
    dni: "12345678A",
    birthDate: "1990-05-15",
    address: "Calle Gran Vía, 28",
    city: "Madrid",
    postalCode: "28013",
    bankAccount: "ES91 2100 0418 4502 0005 1332",
    socialSecurityNumber: "12 1234567890",
    workingHours: 40,
    notes: "Empleada destacada con excelente rendimiento en proyectos de desarrollo web.",
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
    dni: "87654321B",
    birthDate: "1985-12-03",
    address: "Passeig de Gràcia, 45",
    city: "Barcelona",
    postalCode: "08007",
    bankAccount: "ES76 0049 0001 5025 1234 5678",
    socialSecurityNumber: "08 9876543210",
    workingHours: 40,
    notes: "Líder del equipo de ventas con amplia experiencia en el sector.",
  },
]

function EmployeeDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock API call to fetch employee data
    const fetchEmployee = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

      const foundEmployee = mockEmployees.find((emp) => emp.id === params.id)
      setEmployee(foundEmployee)
      setIsLoading(false)
    }

    fetchEmployee()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Calculator className="h-8 w-8 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Cargando empleado...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold mb-2">Empleado no encontrado</h2>
            <p className="text-muted-foreground text-center mb-4">
              El empleado que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild>
              <Link href="/employees">Volver a Empleados</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
              <Badge variant="secondary">Empleado</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/employees">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Employee Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`/abstract-geometric-shapes.png?height=96&width=96&query=${employee.name}`} />
                <AvatarFallback className="text-2xl">
                  {employee.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold font-serif">{employee.name}</h2>
                    <p className="text-xl text-muted-foreground">{employee.position}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <Badge variant={employee.status === "Activo" ? "default" : "secondary"}>{employee.status}</Badge>
                    <Badge variant="outline">{employee.contractType}</Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Desde {new Date(employee.startDate).toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Details Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Laboral</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Información Personal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">DNI/NIE</p>
                      <p className="font-medium">{employee.dni}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                      <p className="font-medium">{new Date(employee.birthDate).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                    <p className="font-medium">{employee.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.postalCode} {employee.city}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employment">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <CardTitle>Información Laboral</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Puesto</p>
                      <p className="font-medium">{employee.position}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                      <Badge variant="outline">{employee.department}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                      <p className="font-medium">{new Date(employee.startDate).toLocaleDateString("es-ES")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Contrato</p>
                      <Badge variant="outline">{employee.contractType}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horas Semanales</p>
                    <p className="font-medium">{employee.workingHours} horas</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{employee.notes || "No hay notas adicionales."}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Euro className="h-5 w-5 text-primary" />
                    <CardTitle>Información Salarial</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Salario Anual</p>
                    <p className="text-2xl font-bold">{employee.salary.toLocaleString()}€</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salario Mensual</p>
                      <p className="font-medium">{Math.round(employee.salary / 12).toLocaleString()}€</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salario por Hora</p>
                      <p className="font-medium">
                        {Math.round(employee.salary / (52 * employee.workingHours)).toLocaleString()}€
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle>Datos Bancarios</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cuenta Bancaria (IBAN)</p>
                    <p className="font-medium font-mono">{employee.bankAccount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Número de Seguridad Social</p>
                    <p className="font-medium">{employee.socialSecurityNumber}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Documentos</CardTitle>
                </div>
                <CardDescription>Documentos asociados al empleado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay documentos disponibles</p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Subir Documento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function EmployeeDetailPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <EmployeeDetailContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
