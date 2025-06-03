// app/login/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Factory, AlertCircle, Lock, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { APP_CONFIG } from "@/lib/config"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [username, setUsername]   = useState("")
  const [password, setPassword]   = useState("")
  const [error, setError]         = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const { user, login, isLoading } = useAuth()
  const router = useRouter()

  // Редирект, если уже залогинены
  useEffect(() => {
    if (user) router.replace("/slag-field")
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Пожалуйста, введите имя пользователя и пароль")
      return
    }

    try {
      const success = await login(username, password /*, можно прокинуть rememberMe */)
      if (success) {
        router.push("/slag-field")
      } else {
        setError("Неверное имя пользователя или пароль")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Произошла ошибка при входе. Пожалуйста, попробуйте снова.")
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center login-bg p-4 relative">
        <div className="w-full max-w-md animate-slide-up relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full shadow-md mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              <Factory className="h-10 w-10 text-primary relative z-10" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {APP_CONFIG.appName}
            </h1>
          </div>

          <Card className="w-full shadow-lg border-border/50 overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="username"
                        type="text"
                        placeholder="admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        className="pl-10 form-control"
                        disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="•••••••• "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="pl-10 form-control"
                        disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                  />
                  <Label htmlFor="remember">Запомнить меня</Label>
                </div>
                <Button
                    type="submit"
                    className="w-full btn-primary btn-hover-effect"
                    disabled={isLoading}
                >
                  {isLoading ? (
                      <span className="flex items-center">
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                      <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                      />
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Вход...
                  </span>
                  ) : (
                      "Войти"
                  )}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-primary underline">
                  Зарегистрироваться
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Debug info - можно убрать в финале */}
          <div className="mt-4 p-4 bg-card/50 backdrop-blur-sm rounded-lg text-xs text-muted-foreground border border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative z-10">
              <p>Логин: admin</p>
              <p>Пароль: admin1234</p>
            </div>
          </div>
        </div>
      </div>
  )
}
