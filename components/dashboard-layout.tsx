"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Factory,
  Grid3X3,
  Container,
  FlaskRoundIcon as Flask,
  Sliders,
  Menu,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavProps {
  isCollapsed: boolean
  links: {
    title: string
    label?: string
    icon: React.ReactNode
    variant: "default" | "ghost"
    href: string
  }[]
}

const Nav = React.forwardRef<HTMLDivElement, NavProps>(({ links, isCollapsed }, ref) => {
  const pathname = usePathname()

  return (
    <div data-collapsed={isCollapsed} className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2" ref={ref}>
      <nav className="grid gap-2 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) => {
          const isActive = pathname === link.href

          return isCollapsed ? (
            <TooltipProvider key={index} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      "sidebar-item flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                      isActive ? "active shadow-md shadow-primary/20" : "",
                    )}
                  >
                    {link.icon}
                    <span className="sr-only">{link.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {link.title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              key={index}
              href={link.href}
              className={cn(
                "sidebar-item flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive ? "active shadow-md shadow-primary/20" : "",
              )}
              prefetch={true}
            >
              {link.icon}
              <span className="animate-fade-in">{link.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
})
Nav.displayName = "Nav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // After mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const links = [
    {
      title: "Шлаковое поле",
      icon: <Factory className="h-5 w-5" />,
      variant: "default",
      href: "/slag-field",
    },
    {
      title: "Места",
      icon: <Grid3X3 className="h-5 w-5" />,
      variant: "ghost",
      href: "/places",
    },
    {
      title: "Ковши",
      icon: <Container className="h-5 w-5" />,
      variant: "ghost",
      href: "/buckets",
    },
    {
      title: "Материалы",
      icon: <Flask className="h-5 w-5" />,
      variant: "ghost",
      href: "/materials",
    },
    {
      title: "Настройки материалов",
      icon: <Sliders className="h-5 w-5" />,
      variant: "ghost",
      href: "/material-settings",
    },
    {
      title: "История операций",
      icon: <History className="h-5 w-5" />,
      variant: "ghost",
      href: "/history",
    },
  ]

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Боковое меню - фиксированное, не скроллится */}
      <div
        className={cn(
          "sidebar hidden md:flex md:flex-col transition-all duration-300 ease-in-out h-screen",
          isCollapsed ? "md:w-[70px]" : "md:w-[240px]",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Шапка бокового меню */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-gradient-to-r from-blue-600 via-primary to-blue-400">
            <Link
              href="/slag-field"
              className={cn(
                "flex items-center gap-2 font-semibold transition-all duration-300",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto",
              )}
            >
              <div className="p-1 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner shadow-blue-700/30">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-semibold text-white drop-shadow-sm">Шлаковое поле</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>

          {/* Навигация - скроллится внутри бокового меню */}
          <div className="flex-1 overflow-y-auto scrollbar-container py-4">
            <Nav isCollapsed={isCollapsed} links={links} />
          </div>

          {/* Футер бокового меню */}
          <div className="border-t border-border pt-4 px-4">
            <div className={cn("flex items-center py-2", isCollapsed ? "justify-center" : "")}>
              <UserMenu isCollapsed={isCollapsed} />
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент - скроллится */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Мобильное меню */}
        {mounted && (
          <div className="fixed bottom-4 right-4 z-50 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="icon" className="h-12 w-12 rounded-full shadow-lg">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Меню</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-blue-600 via-primary to-blue-400">
                    <Link href="/slag-field" className="flex items-center gap-2 font-semibold">
                      <div className="p-1 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner shadow-blue-700/30">
                        <Factory className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-white drop-shadow-sm">Шлаковое поле</span>
                    </Link>
                  </div>

                  <div className="flex-1 overflow-auto py-4">
                    <Nav isCollapsed={false} links={links} />
                  </div>

                  <div className="mt-auto border-t pt-4 px-6">
                    <div className="py-2">
                      <UserMenu isCollapsed={false} />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Контейнер для основного контента со скроллингом */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
