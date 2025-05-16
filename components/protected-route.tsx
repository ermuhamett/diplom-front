"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth" // Import without file extension

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Skip protection for login page
    if (pathname === "/login") {
      setIsAuthorized(true)
      return
    }

    // If not loading and no user, redirect to login
    if (!isLoading) {
      if (user) {
        setIsAuthorized(true)
      } else {
        console.log("User not authenticated, redirecting to login")
        router.push("/login", { scroll: false })
      }
    }
  }, [user, isLoading, router, pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If on login page or authorized, render children
  if (pathname === "/login" || isAuthorized) {
    return <>{children}</>
  }

  // Otherwise, show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
