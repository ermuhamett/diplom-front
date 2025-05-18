"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { SlagFieldPlace } from "@/lib/types"
import { PlusCircle, Grid3X3 } from "lucide-react"
import { fetchPlaces, addPlace } from "@/lib/data-service"

export default function PlacesPage() {
  const { toast } = useToast()
  const [places, setPlaces] = useState<SlagFieldPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    row: 1,
    number: 1,
    isEnable: true,
  })

  // Добавим состояние для отслеживания загрузки при операциях
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load places from the data service
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const placesData = await fetchPlaces()
        setPlaces(placesData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading places:", error)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные мест",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadPlaces()
  }, [toast])

  // Обновить функцию добавления места
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Проверка на диапазон номера места
    if (formData.number < 1 || formData.number > 20) {
      toast({
        title: "Ошибка валидации",
        description: "Номер места должен быть от 1 до 20",
        variant: "destructive",
      })
      return
    }

    try {
      // Показываем индикатор загрузки
      setIsSubmitting(true)

      const newPlace = await addPlace({
        row: formData.row,
        number: formData.number,
        isEnable: formData.isEnable,
      })

      // Обновляем список мест
      setPlaces([...places, newPlace])
      setIsAddDialogOpen(false)
      setFormData({ row: 1, number: 1, isEnable: true })

      toast({
        title: "Место добавлено",
        description: `Место Ряд ${formData.row} место ${formData.number} успешно добавлено`,
      })
    } catch (error) {
      console.error("Error adding place:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить место. Проверьте подключение к серверу.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Функция для открытия диалога добавления с предзаполненными данными
  const openAddDialogWithRowData = (rowNumber: number) => {
    // Находим все места в этом ряду
    const rowPlaces = places.filter((place) => {
      // Обработка случая, когда row может быть строкой или числом
      const placeRow = typeof place.row === "string" ? Number.parseInt(place.row) : place.row
      return placeRow === rowNumber
    })

    // Определяем следующий номер места в ряду
    let nextPlaceNumber = 1
    if (rowPlaces.length > 0) {
      // Находим максимальный номер места в ряду и добавляем 1
      nextPlaceNumber = Math.max(...rowPlaces.map((place) => place.number || 0)) + 1
    }

    // Устанавливаем данные формы
    setFormData({
      row: Number(rowNumber),
      number: nextPlaceNumber,
      isEnable: true,
    })

    // Открываем диалог
    setIsAddDialogOpen(true)
  }

  // Группировка мест по рядам
  const placesByRow = places.reduce(
      (acc, place) => {
        // Обработка случая, когда row может быть строкой или числом
        const rowKey = typeof place.row === "string" ? place.row : place.row?.toString() || "0"
        if (!acc[rowKey]) {
          acc[rowKey] = []
        }
        acc[rowKey].push(place)
        return acc
      },
      {} as Record<string, SlagFieldPlace[]>,
  )

  if (loading) {
    return (
        <DashboardLayout>
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
    )
  }

  return (
      <DashboardLayout>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Справочник мест
          </h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить место
          </Button>
        </div>

        {Object.entries(placesByRow).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(placesByRow).map(([rowKey, rowPlaces]) => (
                  <Card key={rowKey} className="overflow-hidden border-none shadow-lg">
                    {/* Gradient top border */}
                    <div className="h-1 bg-gradient-to-r from-blue-600 via-primary to-blue-400"></div>

                    <CardHeader className="pb-2 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Grid3X3 className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-xl font-bold">Ряд {rowKey}</CardTitle>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                            {rowPlaces.length} мест
                          </Badge>
                        </div>
                        <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                        >
                          Активных: {rowPlaces.filter((p) => p.isEnable).length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 bg-white dark:bg-card">
                      <div className="flex flex-wrap gap-4">
                        {rowPlaces.map((place) => {
                          // Обработка случая, когда row может быть строкой или числом
                          const row = typeof place.row === "string" ? Number.parseInt(place.row) : place.row || 0
                          const placeNumber = row * 100 + (place.number || 0)

                          return (
                              <div
                                  key={place.id}
                                  className={`flex flex-col items-center justify-center rounded-lg transition-all duration-200 hover:shadow-md ${
                                      place.isEnable
                                          ? "slag-place border-2 border-green-500 dark:border-green-700"
                                          : "slag-place border-2 border-red-500 dark:border-red-700"
                                  }`}
                                  style={{ height: "80px", width: "80px" }}
                              >
                                <span className="text-xl font-bold">{placeNumber}</span>
                                <span className="text-[9px] mt-1 text-muted-foreground whitespace-nowrap">
                          {place.isEnable ? "Используется" : "Не используется"}
                        </span>
                              </div>
                          )
                        })}
                        {/* Кнопка добавления нового места в ряд */}
                        <div
                            className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                            style={{ height: "80px", width: "80px" }}
                            onClick={() => openAddDialogWithRowData(Number(rowKey))}
                        >
                          <PlusCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-medium">Нет данных</h3>
              <p className="text-muted-foreground">Не найдено мест для отображения</p>
            </div>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить место</DialogTitle>
              <DialogDescription>Заполните информацию о новом месте шлакового поля.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="row" className="text-right">
                    Номер ряда
                  </Label>
                  <Input
                      id="row"
                      type="number"
                      min="1"
                      value={formData.row}
                      onChange={(e) => setFormData({ ...formData, row: Number.parseInt(e.target.value) })}
                      className="col-span-3"
                      required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="number" className="text-right">
                    Номер места
                  </Label>
                  <Input
                      id="number"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: Number.parseInt(e.target.value) })}
                      className="col-span-3"
                      required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isEnable" className="text-right">
                    Доступно
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                        id="isEnable"
                        checked={formData.isEnable}
                        onCheckedChange={(checked) => setFormData({ ...formData, isEnable: checked as boolean })}
                    />
                    <label
                        htmlFor="isEnable"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Место доступно для использования
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Сохранение...
                      </>
                  ) : (
                      "Сохранить"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
  )
}
