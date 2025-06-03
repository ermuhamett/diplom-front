// components/protected-route.tsx
"use client"

import { ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"

const PUBLIC_PATHS = ["/login", "/register"]

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Пока идёт загрузка авторизации — ждем
    if (isLoading) {
      return
    }

    const isPublic = PUBLIC_PATHS.includes(pathname)

    if (!user && !isPublic) {
      // Неавторизован и не на публичной странице → кидаем на логин
      router.replace("/login")
    }
  }, [user, isLoading, pathname, router])

  // Показываем спиннер пока проверяем
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )
  }

  // Когда проверка завершена — рендерим детей (и публичные, и приватные там, где нужно)
  return <>{children}</>
}
