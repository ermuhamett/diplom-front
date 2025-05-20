import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth" // Import without file extension
import { ProtectedRoute } from "@/components/protected-route"
import {Providers} from "@/app/providers";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Система управления шлаковым полем",
  description: "Modern interface for slag field operations management",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Set timezone to Kazakhstan time */}
        <meta name="timezone" content="Asia/Almaty" />
      </head>
      <body className={inter.className}>
      <Providers>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AuthProvider>
        </ThemeProvider>
      </Providers>
      </body>
    </html>
  )
}
