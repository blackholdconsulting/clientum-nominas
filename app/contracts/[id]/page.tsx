"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Calculator,
  ArrowLeft,
  Edit,
  Download,
  FileText,
  Calendar,
  Euro,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

// Mock contract data (expanded from contracts page)
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
    salaryType: "anual",
    status: "Activo",
    renewalDate: null,
    createdDate: "2022-03-01",
    lastModified: "2022-03-10",
    probationPeriod: 6,
    workingHours: 40,
    vacationDays: 22,
    workLocation: "Madrid, España",
    noticePeriod: 15,
    benefits: ["Seguro médico privado", "Ticket restaurante", "Teletrabajo", "Horario flexible"],
    renewalClause: false,
    confidentialityClause: true,
    nonCompeteClause: false,
    additionalClauses: "El empleado tendrá acceso a formación continua en tecnologías emergentes.",
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
    salaryType: "anual",
    status: "Activo",
    renewalDate: null,
    createdDate: "2020-12-15",
    lastModified: "2021-01-05",
    probationPeriod: 3,
    workingHours: 40,
    vacationDays: 25,
    workLocation: "Barcelona, España",
    noticePeriod: 30,
    benefits: ["Seguro médico privado", "Coche de empresa", "Bonus por objetivos"],
    renewalClause: false,
    confidentialityClause: true,
    nonCompeteClause: true,
    additionalClauses: "Objetivos de ventas trimestrales con bonus del 10% sobre el salario base.",
  },
]

function ContractDetailContent() {
  const params = useParams()
  const [contract, setContract] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock API call to fetch contract data
    const fetchContract = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

      const foundContract = mockContracts.find((contract) => contract.id === params.id)
      setContract(foundContract)
      setIsLoading(false)
    }

    fetchContract()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Calculator className="h-8 w-8 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Cargando contrato...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold mb-2">Contrato no encontrado</h2>
            <p className="text-muted-foreground text-center mb-4">
              El contrato que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild>
              <Link href="/contracts">Volver a Contratos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Activo":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Próximo a Vencer":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "Finalizado":
        return <Clock className="h-5 w-5 text-gray-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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
              <Badge variant="secondary">Contrato</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/contracts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button asChild>
                <Link href={`/contracts/${contract.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Contract Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`/abstract-geometric-shapes.png?height=80&width=80&query=${contract.employeeName}`} />
                <AvatarFallback className="text-xl">
                  {contract.employeeName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold font-serif">{contract.employeeName}</h2>
                    <p className="text-xl text-muted-foreground">{contract.position}</p>
                    <p className="text-sm text-muted-foreground">{contract.department}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    {getStatusIcon(contract.status)}
                    <Badge variant={getStatusVariant(contract.status) as any}>{contract.status}</Badge>
                    <Badge variant="outline">{contract.contractType}</Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Inicio: {new Date(contract.startDate).toLocaleDateString("es-ES")}</span>
                  </div>
                  {contract.endDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Fin: {new Date(contract.endDate).toLocaleDateString("es-ES")}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {contract.salary.toLocaleString()}€ {contract.salaryType}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{contract.workLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Details Tabs */}
        <Tabs defaultValue="terms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="terms">Términos</TabsTrigger>
            <TabsTrigger value="salary">Salario</TabsTrigger>
            <TabsTrigger value="clauses">Cláusulas</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Información Temporal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                      <p className="font-medium">{new Date(contract.startDate).toLocaleDateString("es-ES")}</p>
                    </div>
                    {contract.endDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                        <p className="font-medium">{new Date(contract.endDate).toLocaleDateString("es-ES")}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Período de Prueba</p>
                      <p className="font-medium">{contract.probationPeriod} meses</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Preaviso</p>
                      <p className="font-medium">{contract.noticePeriod} días</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle>Condiciones Laborales</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Horas Semanales</p>
                      <p className="font-medium">{contract.workingHours} horas</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Días de Vacaciones</p>
                      <p className="font-medium">{contract.vacationDays} días</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lugar de Trabajo</p>
                    <p className="font-medium">{contract.workLocation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="salary">
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
                    <p className="text-sm font-medium text-muted-foreground">Salario {contract.salaryType}</p>
                    <p className="text-3xl font-bold">{contract.salary.toLocaleString()}€</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salario Mensual</p>
                      <p className="font-medium">{Math.round(contract.salary / 12).toLocaleString()}€</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salario por Hora</p>
                      <p className="font-medium">
                        {Math.round(contract.salary / (52 * contract.workingHours)).toLocaleString()}€
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Beneficios Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  {contract.benefits.length > 0 ? (
                    <div className="space-y-2">
                      {contract.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay beneficios adicionales especificados.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clauses">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Cláusulas Especiales</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Renovación automática</span>
                      <Badge variant={contract.renewalClause ? "default" : "secondary"}>
                        {contract.renewalClause ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confidencialidad</span>
                      <Badge variant={contract.confidentialityClause ? "default" : "secondary"}>
                        {contract.confidentialityClause ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">No competencia</span>
                      <Badge variant={contract.nonCompeteClause ? "default" : "secondary"}>
                        {contract.nonCompeteClause ? "Sí" : "No"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cláusulas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  {contract.additionalClauses ? (
                    <p className="text-sm leading-relaxed">{contract.additionalClauses}</p>
                  ) : (
                    <p className="text-muted-foreground">No hay cláusulas adicionales especificadas.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Historial del Contrato</CardTitle>
                </div>
                <CardDescription>Registro de cambios y modificaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contrato creado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contract.createdDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Última modificación</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contract.lastModified).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contrato activado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contract.startDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function ContractDetailPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ContractDetailContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
