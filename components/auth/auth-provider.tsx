"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string
  role: string
  organization: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - in real app this would call an API
    if (email === "admin@clientum.es" && password === "demo123") {
      const userData = {
        id: "1",
        email: "admin@clientum.es",
        name: "Administrador",
        role: "admin",
        organization: "Empresa Demo",
      }

      localStorage.setItem("auth_token", "mock_token_123")
      localStorage.setItem("user_data", JSON.stringify(userData))
      setUser(userData)
    } else {
      throw new Error("Credenciales incorrectas")
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    window.location.href = "/auth/login"
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
