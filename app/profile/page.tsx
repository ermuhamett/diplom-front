"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { Shield, Lock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Профиль пользователя
  const [profile, setProfile] = useState({
    fullName: "Администратор Системы",
    email: "admin@example.com",
    position: "Главный администратор",
    department: "ИТ отдел",
    joinedDate: "01.01.2023",
    lastActive: new Date().toLocaleString("ru-RU"),
  })

  // Форма изменения пароля
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Форма редактирования профиля
  const [editForm, setEditForm] = useState({ ...profile })

  // Обработчик изменения пароля
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Проверка совпадения паролей
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Новый пароль и подтверждение не совпадают",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Имитация запроса к API
    setTimeout(() => {
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль был успешно изменен",
      })
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsLoading(false)
    }, 1000)
  }

  // Обработчик сохранения профиля
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Имитация запроса к API
    setTimeout(() => {
      setProfile(editForm)
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль был успешно обновлен",
      })
      setIsLoading(false)
    }, 1000)
  }

  // Если пользователь не авторизован
  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Доступ запрещен</CardTitle>
              <CardDescription>Вы должны войти в систему для просмотра этой страницы</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => (window.location.href = "/login")}>
                Перейти на страницу входа
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Профиль администратора
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Карточка профиля */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Аватар" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-semibold">{profile.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{profile.position}</p>
                  <div className="flex items-center justify-center space-x-1 text-primary">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-medium">Администратор</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <Button variant="destructive" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </CardFooter>
          </Card>

          {/* Вкладки настроек */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Настройки профиля</CardTitle>
              <CardDescription>Управляйте настройками вашего профиля и безопасностью</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Профиль</TabsTrigger>
                  <TabsTrigger value="password">Безопасность</TabsTrigger>
                </TabsList>

                {/* Вкладка профиля */}
                <TabsContent value="profile" className="space-y-4 pt-4">
                  <form onSubmit={handleProfileSave}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">ФИО</Label>
                        <Input
                          id="fullName"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="position">Должность</Label>
                          <Input
                            id="position"
                            value={editForm.position}
                            onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="department">Отдел</Label>
                          <Input
                            id="department"
                            value={editForm.department}
                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Сохранение..." : "Сохранить изменения"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* Вкладка безопасности */}
                <TabsContent value="password" className="space-y-4 pt-4">
                  <form onSubmit={handlePasswordChange}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Текущий пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type="password"
                            className="pl-10"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">Новый пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type="password"
                            className="pl-10"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            className="pl-10"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Изменение..." : "Изменить пароль"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
