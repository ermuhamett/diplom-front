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
  register: (username: string, password: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const CRED_KEY = "auth_credentials"
const USER_KEY = "user"

async function loadCredentials(): Promise<{ username: string; password: string }> {
  const raw = localStorage.getItem(CRED_KEY)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      localStorage.removeItem(CRED_KEY)
    }
  }
  // fallback к дефолту
  const { AUTH_CREDENTIALS } = await import("@/lib/config")
  return AUTH_CREDENTIALS
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // при монтировании грузим сессию
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.removeItem(USER_KEY) }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    const creds = await loadCredentials()
    if (username === creds.username && password === creds.password) {
      const userData = { username }
      setUser(userData)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setIsLoading(false)
      return true
    }
    setIsLoading(false)
    return false
  }

  const register = async (username: string, password: string) => {
    setIsLoading(true)
    // проверяем, нет ли уже
    const creds = await loadCredentials()
    if (username === creds.username) {
      setIsLoading(false)
      return false
    }
    // сохраняем новые креды
    localStorage.setItem(CRED_KEY, JSON.stringify({username, password}))
    setIsLoading(false)
    return true
  }


  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const contextValue = { user, login, logout, isLoading, register }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
