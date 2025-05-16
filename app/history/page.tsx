"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// Импорт иконок из Lucide React
import { Package, RotateCw, Trash2, AlertTriangle, CheckCircle, XCircle, Calendar, FilterX, Check } from "lucide-react"
import { format, isToday, isYesterday, isSameWeek, isSameMonth, isSameYear } from "date-fns"
import { ru } from "date-fns/locale"
import { dataStore } from "@/lib/data-store"
import type { HistoryRecord } from "@/lib/data-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Интерфейс для группировки истории по датам
interface GroupedHistory {
  date: string
  records: HistoryRecord[]
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryRecord[]>([])
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [filterType, setFilterType] = useState<"operationDate" | "placementDate">("operationDate")

  // Загрузка истории
  useEffect(() => {
    try {
      setLoading(true)
      const historyData = dataStore.getUserHistory()
      // Сортируем по времени (новые записи сверху)
      historyData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setHistory(historyData)
      setFilteredHistory(historyData)

      // Группируем историю по датам
      const grouped = groupHistoryByDate(historyData)
      setGroupedHistory(grouped)
    } catch (error) {
      console.error("Ошибка при загрузке истории:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Функция для группировки истории по датам
  const groupHistoryByDate = (historyData: HistoryRecord[]): GroupedHistory[] => {
    const groups: Record<string, HistoryRecord[]> = {}

    historyData.forEach((record) => {
      // Определяем дату для группировки в зависимости от типа фильтрации
      let dateToUse: Date

      if (filterType === "placementDate" && record.placementTime) {
        dateToUse = new Date(record.placementTime)
      } else {
        dateToUse = new Date(record.timestamp)
      }

      const dateKey = format(dateToUse, "yyyy-MM-dd")

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }

      groups[dateKey].push(record)
    })

    // Преобразуем объект в массив и сортируем по дате (новые даты сверху)
    return Object.entries(groups)
      .map(([dateKey, records]) => ({
        date: dateKey,
        records,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Функция для применения фильтра по дате

  // Обработчик изменения даты
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)

    // Автоматически применяем фильтр при выборе даты
    if (newDate) {
      // Фильтруем записи по выбранной дате и текущему типу фильтрации
      const filtered = history.filter((record) => {
        let dateToCheck: Date | undefined

        if (filterType === "placementDate" && record.placementTime) {
          dateToCheck = new Date(record.placementTime)
        } else {
          dateToCheck = new Date(record.timestamp)
        }

        if (!dateToCheck) return false

        return format(dateToCheck, "yyyy-MM-dd") === newDate
      })

      setFilteredHistory(filtered)
      const grouped = groupHistoryByDate(filtered)
      setGroupedHistory(grouped)
    } else {
      // Если дата сброшена, показываем все записи
      setFilteredHistory(history)
      const grouped = groupHistoryByDate(history)
      setGroupedHistory(grouped)
    }
  }

  // Обработчик изменения типа фильтрации
  const handleFilterTypeChange = (value: string) => {
    const newFilterType = value as "operationDate" | "placementDate"
    setFilterType(newFilterType)

    // Если есть выбранная дата, применяем фильтр с новым типом
    if (selectedDate) {
      // Фильтруем записи по выбранной дате и новому типу фильтрации
      const filtered = history.filter((record) => {
        let dateToCheck: Date | undefined

        if (newFilterType === "placementDate" && record.placementTime) {
          dateToCheck = new Date(record.placementTime)
        } else {
          dateToCheck = new Date(record.timestamp)
        }

        if (!dateToCheck) return false

        return format(dateToCheck, "yyyy-MM-dd") === selectedDate
      })

      setFilteredHistory(filtered)
      const grouped = groupHistoryByDate(filtered)
      setGroupedHistory(grouped)
    }
  }

  // Обработчик сброса фильтра
  const handleResetFilter = () => {
    setSelectedDate("")
    setFilteredHistory(history)
    const grouped = groupHistoryByDate(history)
    setGroupedHistory(grouped)
  }

  // Применяем фильтр при изменении истории
  useEffect(() => {
    if (!selectedDate) {
      setFilteredHistory(history)
      const grouped = groupHistoryByDate(history)
      setGroupedHistory(grouped)
    }
  }, [history])

  // Функция для форматирования заголовка даты
  const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()

    if (isToday(date)) {
      return "Сегодня"
    } else if (isYesterday(date)) {
      return "Вчера"
    } else if (isSameWeek(date, now, { locale: ru })) {
      return `На этой неделе - ${format(date, "EEEE, d MMMM", { locale: ru })}`
    } else if (isSameMonth(date, now)) {
      return `В этом месяце - ${format(date, "d MMMM", { locale: ru })}`
    } else if (isSameYear(date, now)) {
      return format(date, "d MMMM", { locale: ru })
    } else {
      return format(date, "d MMMM yyyy", { locale: ru })
    }
  }

  // Функция для форматирования даты и времени
  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return "-"
    return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: ru })
  }

  // Обновим функцию getActionName для корректного отображения смены состояния места
  const getActionName = (action: string | undefined) => {
    switch (action) {
      case "placeBucket":
        return "Установка ковша"
      case "emptyBucket":
        return "Опорожнение ковша"
      case "removeBucket":
        return "Удаление ковша"
      case "invalidateState":
        return "Очистка состояния"
      case "enablePlace":
      case "disablePlace":
        return "Смена состояния места"
      default:
        return "Неизвестное действие"
    }
  }

  // Функция для получения цвета бейджа в зависимости от действия
  const getActionBadge = (action: string | undefined) => {
    switch (action) {
      case "placeBucket":
        return "Установка"
      case "emptyBucket":
        return "Опорожнение"
      case "removeBucket":
        return "Удаление"
      case "invalidateState":
        return "Очистка"
      case "enablePlace":
        return "Активация"
      case "disablePlace":
        return "Деактивация"
      default:
        return "Действие"
    }
  }

  // Функция для получения цвета фона иконки в зависимости от действия
  const getActionIconBg = (action: string | undefined) => {
    switch (action) {
      case "placeBucket":
        return "bg-green-100"
      case "emptyBucket":
        return "bg-blue-100"
      case "removeBucket":
        return "bg-red-100"
      case "invalidateState":
        return "bg-yellow-100"
      case "enablePlace":
        return "bg-emerald-100"
      case "disablePlace":
        return "bg-orange-100"
      default:
        return "bg-gray-100"
    }
  }

  // Функция для получения цвета бейджа в зависимости от действия
  const getActionBadgeBg = (action: string | undefined) => {
    switch (action) {
      case "placeBucket":
        return "bg-green-100 text-green-800"
      case "emptyBucket":
        return "bg-blue-100 text-blue-800"
      case "removeBucket":
        return "bg-red-100 text-red-800"
      case "invalidateState":
        return "bg-yellow-100 text-yellow-800"
      case "enablePlace":
        return "bg-emerald-100 text-emerald-800"
      case "disablePlace":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Функция для получения иконки в зависимости от действия
  const getActionIcon = (action: string | undefined) => {
    switch (action) {
      case "placeBucket":
        return <Package className="h-5 w-5 text-green-600" />
      case "emptyBucket":
        return <RotateCw className="h-5 w-5 text-blue-600" />
      case "removeBucket":
        return <Trash2 className="h-5 w-5 text-red-600" />
      case "invalidateState":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "enablePlace":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case "disablePlace":
        return <XCircle className="h-5 w-5 text-orange-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  // Функция для получения информации о месте
  const getPlaceInfo = (record: HistoryRecord) => {
    if (record.placeRow && record.placeNumber) {
      return `${record.placeRow}${record.placeNumber.toString().padStart(2, "0")}`
    }
    return record.placeId || "-"
  }

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">История операций шлакового поля</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Фильтр: {filterType === "operationDate" ? "Дата операции" : "Дата установки"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Тип фильтрации</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterTypeChange("operationDate")}>
                <Check className={cn("mr-2 h-4 w-4", filterType === "operationDate" ? "opacity-100" : "opacity-0")} />
                Дата и время операции
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterTypeChange("placementDate")}>
                <Check className={cn("mr-2 h-4 w-4", filterType === "placementDate" ? "opacity-100" : "opacity-0")} />
                Время установки ковша
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-auto"
            placeholder="Выберите дату"
          />

          {selectedDate && (
            <Button variant="outline" size="icon" onClick={handleResetFilter} title="Сбросить фильтр">
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {groupedHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">История операций пуста</p>
            {selectedDate && (
              <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить фильтр или сбросить его</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedHistory.map((group) => (
            <div key={group.date} className="space-y-4">
              <h2 className="text-lg font-medium ml-2">{formatDateHeader(group.date)}</h2>

              {group.records.map((record) => (
                <Card key={record.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Иконка операции */}
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full ${getActionIconBg(record.action)}`}
                      >
                        {getActionIcon(record.action)}
                      </div>

                      {/* Основная информация */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{getActionName(record.action)}</h3>
                            <p className="text-sm text-muted-foreground">{formatDateTime(record.timestamp)}</p>
                          </div>
                          <Badge className={getActionBadgeBg(record.action)}>{getActionBadge(record.action)}</Badge>
                        </div>

                        {/* Для операций смены состояния места показываем только место и состояние */}
                        {record.action === "enablePlace" || record.action === "disablePlace" ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Место</p>
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                {getPlaceInfo(record)}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Новое состояние</p>
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                {record.action === "enablePlace" ? "Используется" : "Не используется"}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground mb-1">Дата и время операции</p>
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                {formatDateTime(record.operationTime || record.timestamp)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Место</p>
                                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                  {getPlaceInfo(record)}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Ковш</p>
                                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                  {record.bucketName || "-"}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Материал</p>
                                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                  {record.materialName || "-"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Дата и время операции</p>
                                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                  {formatDateTime(record.operationTime || record.timestamp)}
                                </div>
                              </div>

                              {/* Добавляем отображение даты установки для всех операций с ковшами */}
                              {record.placementTime && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Время установки ковша</p>
                                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                    {formatDateTime(record.placementTime)}
                                  </div>
                                </div>
                              )}

                              {/* Добавляем отображение веса для всех операций с ковшами */}
                              {record.weight && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Вес</p>
                                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                    {(record.weight / 1000).toFixed(2)} т
                                  </div>
                                </div>
                              )}

                              {record.action === "emptyBucket" && record.emptyTime && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Время опорожнения</p>
                                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                    {formatDateTime(record.emptyTime)}
                                  </div>
                                </div>
                              )}

                              {record.action === "invalidateState" && record.reason && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Причина очистки</p>
                                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                    {record.reason || "-"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
