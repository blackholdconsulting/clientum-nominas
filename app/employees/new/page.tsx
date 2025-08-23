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
import { Calculator, ArrowLeft, Save, AlertCircle, User, Briefcase, MapPin, Euro } from "lucide-react"
import Link from "next/link"

interface EmployeeFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  dni: string
  birthDate: string
  address: string
  city: string
  postalCode: string

  // Employment Information
  position: string
  department: string
  startDate: string
  contractType: string
  workingHours: string
  salary: string

  // Additional Information
  bankAccount: string
  socialSecurityNumber: string
  notes: string
}

function NewEmployeeContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dni: "",
    birthDate: "",
    address: "",
    city: "",
    postalCode: "",
    position: "",
    department: "",
    startDate: "",
    contractType: "",
    workingHours: "40",
    salary: "",
    bankAccount: "",
    socialSecurityNumber: "",
    notes: "",
  })

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.dni) {
      setError("Por favor, completa todos los campos obligatorios")
      setIsLoading(false)
      return
    }

    // Mock API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would make an API call to create the employee
      console.log("Creating employee:", formData)

      // Redirect to employees list
      router.push("/employees")
    } catch (err) {
      setError("Error al crear el empleado. Inténtalo de nuevo.")
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
              <Badge variant="secondary">Nuevo Empleado</Badge>
            </div>
            <Button variant="outline" asChild>
              <Link href="/employees">
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
          <h2 className="text-3xl font-bold font-serif mb-2">Nuevo Empleado</h2>
          <p className="text-muted-foreground">Completa la información para añadir un nuevo empleado al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Información Personal</CardTitle>
              </div>
              <CardDescription>Datos personales del empleado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Juan"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="García López"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="juan.garcia@empresa.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+34 666 123 456"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI/NIE *</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    placeholder="12345678A"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Calle Mayor, 123"
                  disabled={isLoading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Madrid"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="28001"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Información Laboral</CardTitle>
              </div>
              <CardDescription>Datos del puesto de trabajo y contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractType">Tipo de Contrato</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value) => handleInputChange("contractType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indefinido">Indefinido</SelectItem>
                      <SelectItem value="Temporal">Temporal</SelectItem>
                      <SelectItem value="Prácticas">Prácticas</SelectItem>
                      <SelectItem value="Formación">Formación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                  <Label htmlFor="salary">Salario Anual (€)</Label>
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
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Información Adicional</CardTitle>
              </div>
              <CardDescription>Datos bancarios y de seguridad social</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Cuenta Bancaria (IBAN)</Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                    placeholder="ES91 2100 0418 4502 0005 1332"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialSecurityNumber">Número de Seguridad Social</Label>
                  <Input
                    id="socialSecurityNumber"
                    value={formData.socialSecurityNumber}
                    onChange={(e) => handleInputChange("socialSecurityNumber", e.target.value)}
                    placeholder="12 1234567890"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Información adicional sobre el empleado..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild disabled={isLoading}>
              <Link href="/employees">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Empleado
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function NewEmployeePage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <NewEmployeeContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
