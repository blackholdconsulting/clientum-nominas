"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calculator, ArrowLeft, Save, AlertCircle, FileText, User, Calendar, Euro } from "lucide-react"
import Link from "next/link"

interface ContractFormData {
  employeeId: string
  contractType: string
  position: string
  department: string
  startDate: string
  endDate: string
  probationPeriod: string
  workingHours: string
  salary: string
  salaryType: string
  benefits: string[]
  workLocation: string
  vacationDays: string
  noticePeriod: string
  renewalClause: boolean
  confidentialityClause: boolean
  nonCompeteClause: boolean
  additionalClauses: string
}

// Mock employee data for selection
const mockEmployees = [
  { id: "1", name: "María García López", position: "Desarrolladora Senior" },
  { id: "2", name: "Juan Martínez Ruiz", position: "Gerente de Ventas" },
  { id: "3", name: "Ana Rodríguez Sánchez", position: "Diseñadora UX" },
  { id: "4", name: "Carlos López Fernández", position: "Contador" },
  { id: "5", name: "Laura Jiménez Torres", position: "Especialista en Marketing" },
]

function NewContractContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<ContractFormData>({
    employeeId: "",
    contractType: "",
    position: "",
    department: "",
    startDate: "",
    endDate: "",
    probationPeriod: "6",
    workingHours: "40",
    salary: "",
    salaryType: "anual",
    benefits: [],
    workLocation: "",
    vacationDays: "22",
    noticePeriod: "15",
    renewalClause: false,
    confidentialityClause: false,
    nonCompeteClause: false,
    additionalClauses: "",
  })

  const handleInputChange = (field: keyof ContractFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBenefitChange = (benefit: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      benefits: checked ? [...prev.benefits, benefit] : prev.benefits.filter((b) => b !== benefit),
    }))
  }

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = mockEmployees.find((emp) => emp.id === employeeId)
    if (employee) {
      setFormData((prev) => ({
        ...prev,
        employeeId,
        position: employee.position,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!formData.employeeId || !formData.contractType || !formData.startDate || !formData.salary) {
      setError("Por favor, completa todos los campos obligatorios")
      setIsLoading(false)
      return
    }

    // Mock API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would make an API call to create the contract
      console.log("Creating contract:", formData)

      // Redirect to contracts list
      router.push("/contracts")
    } catch (err) {
      setError("Error al crear el contrato. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
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
              <Badge variant="secondary">Nuevo Contrato</Badge>
            </div>
            <Button variant="outline" asChild>
              <Link href="/contracts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-serif mb-2">Nuevo Contrato</h2>
          <p className="text-muted-foreground">Crea un nuevo contrato laboral siguiendo la normativa española</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Información Básica</CardTitle>
              </div>
              <CardDescription>Datos básicos del contrato y empleado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Empleado *</Label>
                  <Select value={formData.employeeId} onValueChange={handleEmployeeSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractType">Tipo de Contrato *</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value) => handleInputChange("contractType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indefinido">Contrato Indefinido</SelectItem>
                      <SelectItem value="Temporal">Contrato Temporal</SelectItem>
                      <SelectItem value="Prácticas">Contrato en Prácticas</SelectItem>
                      <SelectItem value="Formación">Contrato de Formación</SelectItem>
                      <SelectItem value="Obra y Servicio">Contrato por Obra y Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Puesto de Trabajo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                    placeholder="Desarrollador Senior"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tecnología">Tecnología</SelectItem>
                      <SelectItem value="Ventas">Ventas</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finanzas">Finanzas</SelectItem>
                      <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                      <SelectItem value="Diseño">Diseño</SelectItem>
                      <SelectItem value="Operaciones">Operaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Terms */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Términos del Contrato</CardTitle>
              </div>
              <CardDescription>Fechas y condiciones del contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    disabled={isLoading || formData.contractType === "Indefinido"}
                  />
                  {formData.contractType === "Indefinido" && (
                    <p className="text-xs text-muted-foreground">Los contratos indefinidos no tienen fecha de fin</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="probationPeriod">Período de Prueba (meses)</Label>
                  <Select
                    value={formData.probationPeriod}
                    onValueChange={(value) => handleInputChange("probationPeriod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin período de prueba</SelectItem>
                      <SelectItem value="2">2 meses</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingHours">Horas Semanales</Label>
                  <Input
                    id="workingHours"
                    type="number"
                    value={formData.workingHours}
                    onChange={(e) => handleInputChange("workingHours", e.target.value)}
                    placeholder="40"
                    min="1"
                    max="40"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacationDays">Días de Vacaciones</Label>
                  <Input
                    id="vacationDays"
                    type="number"
                    value={formData.vacationDays}
                    onChange={(e) => handleInputChange("vacationDays", e.target.value)}
                    placeholder="22"
                    min="22"
                    max="30"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workLocation">Lugar de Trabajo</Label>
                <Input
                  id="workLocation"
                  value={formData.workLocation}
                  onChange={(e) => handleInputChange("workLocation", e.target.value)}
                  placeholder="Madrid, España / Remoto / Híbrido"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary and Benefits */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Euro className="h-5 w-5 text-primary" />
                <CardTitle>Salario y Beneficios</CardTitle>
              </div>
              <CardDescription>Compensación y beneficios adicionales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salario *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => handleInputChange("salary", e.target.value)}
                      placeholder="35000"
                      min="0"
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryType">Tipo de Salario</Label>
                  <Select value={formData.salaryType} onValueChange={(value) => handleInputChange("salaryType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anual">Salario Anual</SelectItem>
                      <SelectItem value="mensual">Salario Mensual</SelectItem>
                      <SelectItem value="por_hora">Por Hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Beneficios Adicionales</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Seguro médico privado",
                    "Ticket restaurante",
                    "Transporte público",
                    "Formación continua",
                    "Teletrabajo",
                    "Horario flexible",
                    "Bonus por objetivos",
                    "Días adicionales de vacaciones",
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center space-x-2">
                      <Checkbox
                        id={benefit}
                        checked={formData.benefits.includes(benefit)}
                        onCheckedChange={(checked) => handleBenefitChange(benefit, checked as boolean)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={benefit} className="text-sm">
                        {benefit}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Clauses */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Cláusulas Legales</CardTitle>
              </div>
              <CardDescription>Cláusulas adicionales del contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod">Período de Preaviso (días)</Label>
                  <Select
                    value={formData.noticePeriod}
                    onValueChange={(value) => handleInputChange("noticePeriod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="60">60 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Cláusulas Especiales</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="renewalClause"
                      checked={formData.renewalClause}
                      onCheckedChange={(checked) => handleInputChange("renewalClause", checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="renewalClause" className="text-sm">
                      Cláusula de renovación automática
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confidentialityClause"
                      checked={formData.confidentialityClause}
                      onCheckedChange={(checked) => handleInputChange("confidentialityClause", checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="confidentialityClause" className="text-sm">
                      Cláusula de confidencialidad
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nonCompeteClause"
                      checked={formData.nonCompeteClause}
                      onCheckedChange={(checked) => handleInputChange("nonCompeteClause", checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="nonCompeteClause" className="text-sm">
                      Cláusula de no competencia
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalClauses">Cláusulas Adicionales</Label>
                <Textarea
                  id="additionalClauses"
                  value={formData.additionalClauses}
                  onChange={(e) => handleInputChange("additionalClauses", e.target.value)}
                  placeholder="Especifica cualquier cláusula adicional específica para este contrato..."
                  rows={4}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild disabled={isLoading}>
              <Link href="/contracts">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                "Creando contrato..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Contrato
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function NewContractPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <NewContractContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
