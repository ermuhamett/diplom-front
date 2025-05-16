"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
  username: string
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Исправьте функцию login, чтобы избежать перезагрузки
  const login = async (username: string, password: string) => {
    setIsLoading(true)

    try {
      console.log("Attempting login with:", { username, password })

      // Direct validation for demo purposes
      const { AUTH_CREDENTIALS } = await import("@/lib/config")

      if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
        console.log("Login successful")
        const userData = { username }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        setIsLoading(false)
        return true
      }

      console.log("Login failed: Invalid credentials")
      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const contextValue = { user, login, logout, isLoading }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
