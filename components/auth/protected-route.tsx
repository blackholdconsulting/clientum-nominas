"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Calculator } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/login"
    }
  }, [isLoading, isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Calculator className="h-8 w-8 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground text-center">No tienes permisos para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
