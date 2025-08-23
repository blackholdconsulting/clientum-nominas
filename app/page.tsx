import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calculator, FileText, BarChart3, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">Clientum Nóminas</h1>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                Sistema Profesional
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Comenzar Prueba</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-serif text-foreground mb-6">
            Gestión de Nóminas
            <span className="text-primary block">Simplificada</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema completo para la gestión de empleados, contratos y nóminas. Cumple con la normativa española y
            automatiza tus procesos de RRHH.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/auth/register">Comenzar Ahora</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
              <Link href="/dashboard">Ver Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold font-serif text-center mb-12">Funcionalidades Principales</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Gestión de Empleados</CardTitle>
                <CardDescription>Administra toda la información de tus empleados de forma centralizada</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Datos personales y laborales</li>
                  <li>• Historial de contratos</li>
                  <li>• Documentación digital</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Contratos Digitales</CardTitle>
                <CardDescription>Crea y gestiona contratos cumpliendo la normativa laboral española</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Plantillas predefinidas</li>
                  <li>• Firma electrónica</li>
                  <li>• Renovaciones automáticas</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calculator className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Cálculo de Nóminas</CardTitle>
                <CardDescription>Automatiza el cálculo de salarios, deducciones e impuestos</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Cálculos automáticos</li>
                  <li>• Cumplimiento fiscal</li>
                  <li>• Recibos digitales</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Informes y Analytics</CardTitle>
                <CardDescription>Genera informes detallados y analiza los costes laborales</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Dashboards interactivos</li>
                  <li>• Exportación a Excel/PDF</li>
                  <li>• Análisis de tendencias</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Seguridad y Cumplimiento</CardTitle>
                <CardDescription>Protección de datos y cumplimiento de la normativa RGPD</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Cifrado de extremo a extremo</li>
                  <li>• Auditorías de acceso</li>
                  <li>• Cumplimiento RGPD</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Automatización</CardTitle>
                <CardDescription>Automatiza procesos repetitivos y ahorra tiempo valioso</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Nóminas programadas</li>
                  <li>• Notificaciones automáticas</li>
                  <li>• Integraciones API</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold font-serif mb-6">¿Listo para Simplificar tu Gestión de Nóminas?</h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya confían en Clientum Nóminas para gestionar sus recursos humanos de forma
            eficiente.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <Link href="/auth/register">Comenzar Prueba Gratuita</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-6 w-6 text-primary" />
                <span className="font-bold font-serif text-primary">Clientum Nóminas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema profesional de gestión de nóminas para empresas españolas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Funcionalidades</li>
                <li>Precios</li>
                <li>Integraciones</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Centro de Ayuda</li>
                <li>Documentación</li>
                <li>Contacto</li>
                <li>Estado del Sistema</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Términos de Uso</li>
                <li>Política de Privacidad</li>
                <li>RGPD</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 Clientum Nóminas. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
