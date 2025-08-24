"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

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

type DbContract = {
  id: string
  user_id: string
  employee_id: string
  template: string | null
  data: any // jsonb: guardamos campos del formulario
  status: "borrador" | "firmado" | "archivado"
  pdf_url: string | null
  created_at: string
  updated_at: string
  employees?: {
    first_name: string | null
    last_name: string | null
    position: string | null
    department: string | null
    salary: number | null
    hired_at: string | null
    work_location: string | null
    weekly_hours?: number | null
    vacation_days?: number | null
    notice_days?: number | null
  } | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function StatusIcon({ s }: { s: string }) {
  if (s === "firmado") return <CheckCircle className="h-5 w-5 text-green-500" />
  if (s === "borrador") return <Clock className="h-5 w-5 text-gray-500" />
  return <AlertTriangle className="h-5 w-5 text-yellow-500" />
}

function statusBadgeVariant(s: string) {
  if (s === "firmado") return "default"
  if (s === "archivado") return "secondary"
  return "outline"
}

function ContractDetailContent() {
  const params = useParams<{ id: string }>()
  const [row, setRow] = useState<DbContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // garantizamos sesión (RLS hará el resto)
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) {
          // el ProtectedRoute ya lo controla, pero por si acaso
          setError("No autenticado")
          setLoading(false)
          return
        }

        // Traemos el contrato + datos del empleado (FK employee_id)
        const { data, error } = await supabase
          .from("contracts")
          .select(
            `
              id, user_id, employee_id, template, data, status, pdf_url, created_at, updated_at,
              employees:employee_id (
                first_name, last_name, position, department, salary, hired_at, work_location, weekly_hours, vacation_days, notice_days
              )
            `
          )
          .eq("id", params.id)
          .single()

        if (error) throw error
        setRow(data as unknown as DbContract)
      } catch (e: any) {
        setError(e?.message ?? "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params.id])

  const ui = useMemo(() => {
    if (!row) return null

    const e = row.employees
    const fullName =
      (e?.first_name ?? "") + (e?.last_name ? ` ${e?.last_name}` : "") || row.data?.employee_name || "Empleado"

    // algunos campos vienen del json `data` (porque cada plantilla puede guardar cosas distintas)
    const position = e?.position ?? row.data?.position ?? "—"
    const department = e?.department ?? row.data?.department ?? "—"
    const startDate =
      row.data?.start_date ??
      e?.hired_at ??
      row.created_at // fallback
    const endDate = row.data?.end_date ?? null

    const workingHours = e?.weekly_hours ?? row.data?.working_hours ?? 40
    const vacationDays = e?.vacation_days ?? row.data?.vacation_days ?? 22
    const noticeDays = e?.notice_days ?? row.data?.notice_days ?? 15
    const workLocation = e?.work_location ?? row.data?.work_location ?? "—"

    const salary = e?.salary ?? row.data?.salary ?? 0
    const salaryType = row.data?.salary_type ?? "anual"

    const benefits: string[] = row.data?.benefits ?? []

    return {
      id: row.id,
      status: row.status,
      createdDate: row.created_at,
      lastModified: row.updated_at,
      employeeName: fullName,
      position,
      department,
      startDate,
      endDate,
      workingHours,
      vacationDays,
      noticeDays,
      workLocation,
      salary,
      salaryType,
      benefits,
      renewalClause: !!row.data?.renewal_clause,
      confidentialityClause: !!row.data?.confidentiality_clause,
      nonCompeteClause: !!row.data?.non_compete_clause,
      additionalClauses: row.data?.additional_clauses ?? "",
    }
  }, [row])

  if (loading) {
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

  if (error || !ui) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold mb-2">Contrato no encontrado</h2>
            <p className="text-muted-foreground text-center mb-4">
              {error ?? "El contrato que buscas no existe o ha sido eliminado."}
            </p>
            <Button asChild>
              <Link href="/contracts">Volver a Contratos</Link>
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
              <Badge variant="secondary">Contrato</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/contracts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>

              {row.pdf_url && (
                <Button asChild variant="outline">
                  <a href={row.pdf_url} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </a>
                </Button>
              )}

              <Button asChild>
                <Link href={`/contracts/${ui.id}/edit`}>
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
                <AvatarImage src={`/abstract-geometric-shapes.png?height=80&width=80&query=${ui.employeeName}`} />
                <AvatarFallback className="text-xl">
                  {ui.employeeName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold font-serif">{ui.employeeName}</h2>
                    <p className="text-xl text-muted-foreground">{ui.position}</p>
                    <p className="text-sm text-muted-foreground">{ui.department}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <StatusIcon s={row.status} />
                    <Badge variant={statusBadgeVariant(row.status) as any}>{row.status}</Badge>
                    {/* Tipo de contrato desde plantilla (si quieres, léelo desde row.template) */}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Inicio: {new Date(ui.startDate).toLocaleDateString("es-ES")}</span>
                  </div>
                  {ui.endDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Fin: {new Date(ui.endDate).toLocaleDateString("es-ES")}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {Number(ui.salary ?? 0).toLocaleString()}€ {ui.salaryType}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{ui.workLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
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
                      <p className="font-medium">
                        {new Date(ui.startDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    {ui.endDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                        <p className="font-medium">
                          {new Date(ui.endDate).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Período de Prueba</p>
                      <p className="font-medium">{ui.noticeDays ?? 15} días</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Preaviso</p>
                      <p className="font-medium">{ui.noticeDays ?? 15} días</p>
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
                      <p className="font-medium">{ui.workingHours} horas</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Días de Vacaciones</p>
                      <p className="font-medium">{ui.vacationDays} días</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lugar de Trabajo</p>
                    <p className="font-medium">{ui.workLocation}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">
                      Salario {ui.salaryType}
                    </p>
                    <p className="text-3xl font-bold">
                      {Number(ui.salary ?? 0).toLocaleString()}€
                    </p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salario Mensual</p>
                      <p className="font-medium">
                        {Math.round((Number(ui.salary ?? 0)) / 12).toLocaleString()}€
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salario por Hora</p>
                      <p className="font-medium">
                        {Math.round(
                          (Number(ui.salary ?? 0)) / (52 * (ui.workingHours || 40))
                        ).toLocaleString()}
                        €
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
                  {ui.benefits?.length ? (
                    <div className="space-y-2">
                      {ui.benefits.map((b: string, i: number) => (
                        <div key={i} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{b}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay beneficios adicionales.</p>
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
                      <Badge variant={row.data?.renewal_clause ? "default" : "secondary"}>
                        {row.data?.renewal_clause ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confidencialidad</span>
                      <Badge variant={row.data?.confidentiality_clause ? "default" : "secondary"}>
                        {row.data?.confidentiality_clause ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">No competencia</span>
                      <Badge variant={row.data?.non_compete_clause ? "default" : "secondary"}>
                        {row.data?.non_compete_clause ? "Sí" : "No"}
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
                  {ui.additionalClauses ? (
                    <p className="text-sm leading-relaxed">{ui.additionalClauses}</p>
                  ) : (
                    <p className="text-muted-foreground">No hay cláusulas adicionales.</p>
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
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contrato creado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ui.createdDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Última modificación</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ui.lastModified).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contrato activado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ui.startDate).toLocaleDateString("es-ES")}
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
