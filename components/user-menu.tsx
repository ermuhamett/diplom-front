"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface UserMenuProps {
  isCollapsed?: boolean
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between")}>
      {!isCollapsed && (
        <Link href="/profile" className="text-sm flex items-center hover:text-primary transition-colors cursor-pointer">
          <Shield className="h-4 w-4 mr-1" />
          <span>Администратор</span>
        </Link>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Выйти</span>
      </Button>
    </div>
  )
}
