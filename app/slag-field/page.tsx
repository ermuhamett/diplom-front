"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Info, Grid3X3 } from "lucide-react"
import { PlaceBucketModal } from "@/components/modals/place-bucket-modal"
import { EmptyBucketModal } from "@/components/modals/empty-bucket-modal"
import { RemoveBucketModal } from "@/components/modals/remove-bucket-modal"
import { InvalidModal } from "@/components/modals/invalid-modal"
import { useToast } from "@/hooks/use-toast"
import type { SlagFieldPlace, SlagFieldState, MaterialSetting } from "@/lib/types"
import {
  fetchPlaces,
  fetchSlagFieldStates,
  placeBucket,
  emptyBucket,
  removeBucket,
  invalidateState,
  fetchMaterialSettings,
  markPlaceInUse,
  markPlaceOutOfUse,
} from "@/lib/data-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"


const COOLING_TIME_MS = 5 * 60 * 1000 // 5 минут

export default function SlagFieldPage() {
  const { toast } = useToast()
  const [places, setPlaces] = useState<SlagFieldPlace[]>([])
  const [states, setStates] = useState<SlagFieldState[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<SlagFieldPlace | null>(null)
  const [isPlaceBucketOpen, setIsPlaceBucketOpen] = useState(false)
  const [isEmptyBucketOpen, setIsEmptyBucketOpen] = useState(false)
  const [isRemoveBucketOpen, setIsRemoveBucketOpen] = useState(false)
  const [isInvalidOpen, setIsInvalidOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [materialSettings, setMaterialSettings] = useState<MaterialSetting[]>([])
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [infoPlace, setInfoPlace] = useState<SlagFieldPlace | null>(null)

  // Update current time every minute to keep elapsed time display accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Load data from the Places directory and states
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Fetch places from the Places directory
        const placesData = await fetchPlaces()
        setPlaces(placesData)

        // Fetch slag field states
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]
        setStates(statesData)

        // Fetch material settings
        const materialSettingsData = await fetchMaterialSettings()
        setMaterialSettings(materialSettingsData)

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные мест",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const getPlaceState = (placeId: string) => {
    // теперь найдём ОДНУ запись для места — любую, какая есть
    return states.find((s) => s.placeId === placeId)
  }

  // Вынесем логику формирования сообщения о времени охлаждения
  const notifyCoolingNotFinished = (placeState: SlagFieldState) => {
    // 1) берем все настройки этого материала
    const settings = materialSettings.filter(
        (s) => s.materialId === placeState.materialId
    );
    // 2) находим последнюю (максимальную) стадию охлаждения
    const lastStage = settings.reduce((latest, cur) =>
            cur.maxHours !== undefined && (!latest || cur.maxHours! > latest.maxHours!) ? cur : latest
        , settings[0]);
    // 3) собираем текст
    const materialName = placeState.materialName || "материала";
    let message = `Время охлаждения ${materialName} ещё не завершилось.`;
    if (lastStage?.minHours !== undefined) {
      message += ` Опустошение возможно после ${lastStage.minHours} часов.`;
    }
    // 4) показываем тост
    toast({
      title: "Невозможно опустошить ковш",
      description: message,
      variant: "destructive",
    });
  };

  // Исправим функцию getElapsedTime, чтобы таймер начинался с 00:00
  const getElapsedTime = (startDate: Date | string) => {
    // Ensure we're working with a Date object
    const start = startDate instanceof Date ? startDate : new Date(startDate)

    // Check if the date is valid
    if (isNaN(start.getTime())) {
      return "0:00"
    }

    // Получаем текущее время в UTC+0
    const now = new Date()
    // Вычисляем разницу в миллисекундах
    const diffMs = now.getTime() - start.getTime()
    // Преобразуем в часы и минуты
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    // Format minutes with leading zero if needed
    const formattedMinutes = diffMins < 10 ? `0${diffMins}` : `${diffMins}`
    return `${diffHrs}:${formattedMinutes}`
  }

  // Get elapsed hours for a place
  const getElapsedHours = (startDate: Date | string) => {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    if (isNaN(start.getTime())) return 0

    const diffMs = currentTime.getTime() - start.getTime()
    return diffMs / (1000 * 60 * 60)
  }

  // Функция для проверки, можно ли опустошить ковш
  const canEmptyBucket = (ps?: SlagFieldState): boolean => {
    if (!ps || ps.state !== "BucketPlaced") return false

    // Берём все настройки по материалу
    const cfg = materialSettings.filter((s) => s.materialId === ps.materialId)
    // Максимальная длительность в часах
    const maxDurationHours = (cfg[0]?.duration ?? 0) / 60
    // Прошло часов с начала
    const elapsed = getElapsedHours(ps.startDate)

    // Последняя стадия по minHours
    const lastStage = cfg.reduce((acc, cur) =>
            cur.minHours !== undefined && (!acc || cur.minHours! > acc.minHours!)
                ? cur
                : acc
        , cfg[0])

    const canByStage = lastStage?.minHours !== undefined && elapsed >= lastStage.minHours
    const canByMax   = elapsed >= maxDurationHours

    return canByStage || canByMax
  }

  const handlePlaceBucket = async (data: any) => {
    try {
      setLoading(true)
      const success = await placeBucket({
        placeId: selectedPlace?.id || "",
        bucketId: data.bucketId,
        materialId: data.materialId,
        startDate: data.startDate,
        weight: data.weight,
      })

      if (success) {
        // Обновляем состояния
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]
        setStates(statesData)

        toast({
          title: "Ковш установлен",
          description: `Ковш установлен на место ${selectedPlace?.row || ""} ${selectedPlace?.number || ""}`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось установить ковш",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error placing bucket:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при установке ковша",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsPlaceBucketOpen(false)
    }
  }

  const handleEmptyBucket = async (data: any) => {
    try {
      setLoading(true)

      // Проверяем, можно ли опустошить ковш
      const ps = getPlaceState(selectedPlace?.id || "");
      if (!ps || !canEmptyBucket(ps)) {
        notifyCoolingNotFinished(ps!);
        alert("Not ready for empty");
        //setLoading(false);
        setIsEmptyBucketOpen(false);
        return;
      }

      const success = await emptyBucket({
        placeId: selectedPlace?.id || "",
        endDate: data.endDate,
      })

      if (success) {
        // Обновляем состояния
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]

        // Обновляем состояние вручную, чтобы гарантировать, что оно изменится на "BucketEmptied"
        const updatedStates = statesData.map((state) => {
          if (state.placeId === selectedPlace?.id && state.endDate === null) {
            return {
              ...state,
              state: "BucketEmptied",
              endDate:data.endDate
            }
          }
          return state
        })

        setStates(updatedStates)

        toast({
          title: "Ковш опустошен",
          description: `Ковш опустошен на месте ${selectedPlace?.row || ""} ${selectedPlace?.number || ""}`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось опустошить ковш",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error emptying bucket:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при опустошении ковша",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsEmptyBucketOpen(false)
    }
  }

  const handleRemoveBucket = async () => {
    try {
      setLoading(true)
      // Проверяем, прошло ли достаточно времени для удаления ковша
      const placeState = getPlaceState(selectedPlace?.id || "")

      if (placeState?.state !== "BucketEmptied") {
        toast({
          title: "Невозможно убрать ковш",
          description: "Ковш должен быть опустошен перед удалением",
          variant: "destructive",
        })
        return
      }
      const success = await removeBucket(selectedPlace?.id || "")

      if (success) {
        // Обновляем состояния
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]
        setStates(statesData)

        toast({
          title: "Ковш убран",
          description: `Ковш убран с места ${selectedPlace?.row || ""} ${selectedPlace?.number || ""}`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось убрать ковш",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing bucket:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении ковша",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRemoveBucketOpen(false)
    }
  }

  const handleInvalid = async (data: any) => {
    try {
      setLoading(true)
      const success = await invalidateState({
        placeId: selectedPlace?.id || "",
        description: data.description,
      })

      if (success) {
        // Обновляем состояния
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]
        setStates(statesData)

        toast({
          title: "Состояние очищено",
          description: `Состояние места ${selectedPlace?.row || ""} ${selectedPlace?.number || ""} очищено: ${data.description}`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось очистить состояние",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error invalidating state:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при очистке состояния",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsInvalidOpen(false)
    }
  }

  // Обновим метод handleWentInUse
  const handleWentInUse = async (placeId: string) => {
    try {
      setLoading(true)
      // Вызываем API для отметки места как используемое
      const success = await markPlaceInUse(placeId)

      if (success) {
        // Обновляем локальное состояние
        const updatedPlaces = places.map((place) => (place.id === placeId ? { ...place, isEnable: true } : place))
        setPlaces(updatedPlaces)

        toast({
          title: "Место используется",
          description: "Место отмечено как используемое",
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить статус места",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking place as in use:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус места",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Обновим метод handleOutOfUse
  const handleOutOfUse = async (placeId: string) => {
    try {
      setLoading(true)
      // Вызываем API для отметки места как неиспользуемое
      const success = await markPlaceOutOfUse(placeId)

      if (success) {
        // Обновляем локальное состояние
        const updatedPlaces = places.map((place) => (place.id === placeId ? { ...place, isEnable: false } : place))
        setPlaces(updatedPlaces)

        toast({
          title: "Место не используется",
          description: "Место отмечено как неиспользуемое",
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить статус места",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking place as out of use:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус места",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add this function after other handler functions
  const openInfoModal = (place: SlagFieldPlace) => {
    setInfoPlace(place)
    setIsInfoModalOpen(true)
  }

  // Group places by row
  const placesByRow = places.reduce(
      (acc, place) => {
        // Проверяем, что place.row существует и не undefined
        const rowKey = place.row?.toString() || "0"
        if (!acc[rowKey]) {
          acc[rowKey] = []
        }
        acc[rowKey].push(place)
        return acc
      },
      {} as Record<string, SlagFieldPlace[]>,
  )

  // Update the getPlaceClass function to have consistent borders
  const getPlaceClass = (place: SlagFieldPlace) => {
    if (!place.isEnable) {
      return "slag-place border-2 border-gray-300 dark:border-gray-700 bg-transparent"
    } else if (getPlaceState(place.id)) {
      return "slag-place border-2 border-gray-300 dark:border-gray-700 bg-transparent"
    } else {
      return "slag-place border-2 border-gray-300 dark:border-gray-700 bg-transparent"
    }
  }

  // Find the appropriate material setting based on elapsed time
  const findMaterialSettingForPlace = (place: SlagFieldPlace) => {
    const placeState = getPlaceState(place.id)
    if (!placeState) return null

    const elapsedHours = getElapsedHours(placeState.startDate)

    // Найдем все настройки для этого материала
    const materialSettingsForMaterial = materialSettings.filter(
        (setting) => setting.materialId === placeState.materialId && setting.visualStateCode,
    )

    // Найдем настройку, которая соответствует текущему времени
    return materialSettingsForMaterial.find(
        (setting) =>
            setting.minHours !== undefined &&
            setting.maxHours !== undefined &&
            elapsedHours >= setting.minHours &&
            elapsedHours < setting.maxHours,
    )
  }

  // Add a new function to determine icon color based on material settings and time
  const getIconColorClass = (place: SlagFieldPlace) => {
    const placeState = getPlaceState(place.id)
    if (!placeState) return ""

    // Find the appropriate material setting based on elapsed time
    const materialSetting = findMaterialSettingForPlace(place)

    if (materialSetting && materialSetting.visualStateCode) {
      // Apply color based on visual state code (for text elements only)
      switch (materialSetting.visualStateCode) {
        case "Красный":
          return "text-red-500"
        case "Зеленый":
          return "text-green-500"
        case "Желтый":
          return "text-yellow-500"
        case "Синий":
          return "text-blue-500"
        default:
          return "text-primary"
      }
    }

    // If no matching setting found, use default color
    return "text-primary"
  }

  // Function to get place state info for tooltip
  const getPlaceStateInfo = (place: SlagFieldPlace) => {
    const state = getPlaceState(place.id)
    if (!state) return null

    const materialSetting = findMaterialSettingForPlace(place)
    const elapsedHours = getElapsedHours(state.startDate)
    const elapsedTime = getElapsedTime(state.startDate)

    // Найдем все настройки для этого материала
    const settingsForMaterial = materialSettings.filter((setting) => setting.materialId === state.materialId)

    // Найдем максимальную длительность для этого материала
    const maxDuration = settingsForMaterial.length > 0 ? settingsForMaterial[0].duration : 0
    const maxDurationHours = maxDuration / 60 // Convert minutes to hours
    const exceedsMaxDuration = maxDurationHours > 0 && elapsedHours > maxDurationHours

    return {
      bucketDescription: state.bucketDescription || "Неизвестный ковш",
      materialName: state.materialName || "Неизвестный материал",
      startDate: new Date(state.startDate).toLocaleString(),
      endDate: state.endDate
          ? new Date(state.endDate).toLocaleString()
          : undefined,
      weight: (state.weight / 1000).toFixed(2) + " кг",
      state: state.state || "Неизвестно",
      elapsedTime,
      elapsedHours: elapsedHours.toFixed(1),
      visualStateCode: materialSetting?.visualStateCode || "Не определен",
      timeRange: materialSetting ? `${materialSetting.minHours}-${materialSetting.maxHours} ч` : "Не определен",
      exceedsMaxDuration,
      maxDurationHours: maxDurationHours.toFixed(1),
    }
  }

  // Modify the renderIcon function to apply the color classes
  const renderIcon = (place: SlagFieldPlace) => {
    if (!place.isEnable) {
      // Place exists but not in use - show disabled image
      return <img src="/images/disabled.png" alt="Не используется" className="h-16 w-16 sm:h-16 sm:w-16" />
    } else if (getPlaceState(place.id)) {
      const placeState = getPlaceState(place.id)

      // Если ковш опорожнен, показываем изображение пустого ковша
      if (placeState?.state === "BucketEmptied") {

        return <img src="/images/empty_bucket.png" alt="Опустошен" className="h-16 w-16 sm:h-16 sm:w-16" />
      }

      // Place has a bucket - show appropriate image based on state and material setting
      const elapsedHours = getElapsedHours(placeState!.startDate)

      // Найдем все настройки для этого материала
      const settingsForMaterial = materialSettings.filter((setting) => setting.materialId === placeState!.materialId)

      // Найдем максимальную длительность для этого материала
      const maxDuration = settingsForMaterial.length > 0 ? settingsForMaterial[0].duration : 0
      const durationHours = maxDuration / 60 // Convert minutes to hours
      const exceedsDuration = durationHours > 0 && elapsedHours > durationHours

      // If the bucket exceeds its material's duration, show a blinking green bucket
      if (exceedsDuration) {
        return (
            <img src="/images/green.png" alt="Превышено время" className="h-16 w-16 sm:h-16 sm:w-16 blink-animation" />
        )
      }

      // Otherwise, show the appropriate image based on material setting
      const materialSetting = findMaterialSettingForPlace(place)
      if (materialSetting && materialSetting.visualStateCode) {
        // Apply image based on visual state code
        switch (materialSetting.visualStateCode) {
          case "Красный":
            return <img src="/images/red.png" alt="Красный" className="h-16 w-16 sm:h-16 sm:w-16" />
          case "Желтый":
            return <img src="/images/yellow.png" alt="Желтый" className="h-16 w-16 sm:h-16 sm:w-16" />
          case "Синий":
            return <img src="/images/blue.png" alt="Синий" className="h-16 w-16 sm:h-16 sm:w-16" />
          case "Зеленый":
            return <img src="/images/green.png" alt="Зеленый" className="h-16 w-16 sm:h-16 sm:w-16" />
          default:
            return <img src="/images/red.png" alt="По умолчанию" className="h-16 w-16 sm:h-16 sm:w-16" />
        }
      }

      // If no matching setting found, use default red image
      return <img src="/images/red.png" alt="По умолчанию" className="h-16 w-16 sm:h-16 sm:w-16" />
    } else {
      // Place is enabled but empty - no image
      return null
    }
  }

  // Function to close all context menus
  const closeAllContextMenus = () => {
    const menus = document.querySelectorAll(".slag-field-context-menu")
    menus.forEach((menu) => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu)
      }
    })
  }

  // Обновим функцию создания контекстного меню, чтобы расположить его правее
  const createContextMenu = (e: React.MouseEvent, place: SlagFieldPlace) => {
    e.preventDefault()
    setSelectedPlace(place)

    // Закрываем все открытые контекстные меню
    closeAllContextMenus()

    // Создаем контекстное меню
    const menu = document.createElement("div")
    menu.className =
        "absolute z-50 bg-white dark:bg-gray-800 shadow-xl rounded-md py-2 min-w-[200px] slag-field-context-menu"

    // Добавляем стили для более заметного меню
    menu.style.cssText = `
      position: absolute;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 2px solid rgba(59, 130, 246, 0.3);
    `

    // Позиционируем меню рядом с элементом
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()

    // Позиционируем меню справа от элемента
    menu.style.left = `${rect.right + window.scrollX + 5}px` // Смещаем меню вправо от элемента
    menu.style.top = `${rect.top + window.scrollY + rect.height / 2 - 50}px` // По центру элемента по вертикали

    // Общий класс для элементов меню
    const menuItemClass =
        "px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-primary cursor-pointer flex items-center transition-colors duration-150"

    // Add menu items
    if (place.isEnable) {
      const placeState = getPlaceState(place.id)

      // Если место свободно, показываем опцию "Установить ковш"
      if (!placeState) {
        const placeItem = document.createElement("div")
        placeItem.className = menuItemClass
        placeItem.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path><path d="M16.5 9.4 7.55 4.24"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg> Установить ковш'
        placeItem.onclick = () => {
          document.body.removeChild(menu)
          setIsPlaceBucketOpen(true)
        }
        menu.appendChild(placeItem)
      }

      // Если ковш установлен (BucketPlaced), показываем опцию "Опустошить ковш"
      if (placeState?.state === "BucketPlaced") {
        const emptyItem = document.createElement("div")
        emptyItem.className = menuItemClass
        emptyItem.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Опустошить ковш'
        emptyItem.onclick = () => {
          document.body.removeChild(menu)
          const ps = getPlaceState(place.id)
          if(!ps) return; // нет состояния — ничего не делаем
          if (!canEmptyBucket(ps)) {
            notifyCoolingNotFinished(ps);
            return
          }
          setIsEmptyBucketOpen(true)
        }
        menu.appendChild(emptyItem)
      }

      // Если ковш опорожнен (BucketEmptied), показываем опцию "Убрать ковш"
      if (placeState?.state === "BucketEmptied") {
        const removeItem = document.createElement("div")
        removeItem.className = menuItemClass
        removeItem.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> Убрать ковш'
        removeItem.onclick = () => {
          document.body.removeChild(menu)
          setIsRemoveBucketOpen(true)
        }
        menu.appendChild(removeItem)
      }

      if (placeState) {
        const invalidItem = document.createElement("div")
        invalidItem.className = menuItemClass
        invalidItem.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Очистить'
        invalidItem.onclick = () => {
          document.body.removeChild(menu)
          setIsInvalidOpen(true)
        }
        menu.appendChild(invalidItem)
      }

      // Only show "Не используется" option if there's no bucket on the place
      if (!placeState) {
        const disableItem = document.createElement("div")
        disableItem.className = menuItemClass
        disableItem.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg> Не используется'
        disableItem.onclick = () => {
          document.body.removeChild(menu)
          handleOutOfUse(place.id)
        }
        menu.appendChild(disableItem)
      }
    } else {
      const enableItem = document.createElement("div")
      enableItem.className = menuItemClass
      enableItem.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Используется'
      enableItem.onclick = () => {
        document.body.removeChild(menu)
        handleWentInUse(place.id)
      }
      menu.appendChild(enableItem)
    }

    // Add to body
    document.body.appendChild(menu)

    // Проверяем, не выходит ли меню за пределы экрана
    const menuRect = menu.getBoundingClientRect()

    // Если меню выходит за верхний край экрана
    if (menuRect.top < 0) {
      menu.style.top = `${window.scrollY + 5}px`
    }

    // Если меню выходит за левый край экрана
    if (menuRect.left < 0) {
      menu.style.left = `${window.scrollX + 5}px`
    }

    // Если меню выходит за правый край экрана
    if (menuRect.right > window.innerWidth) {
      menu.style.left = `${window.scrollX + window.innerWidth - menuRect.width - 5}px`
    }

    // Remove when clicking elsewhere
    const removeMenu = () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu)
      }
      document.removeEventListener("click", removeMenu)
    }

    setTimeout(() => {
      document.addEventListener("click", removeMenu)
    }, 100)
  }

  // Render info panel

  if (loading) {
    return (
        <DashboardLayout>
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
    )
  }

  // Обновляем отображение карты шлакового поля
  return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Карта шлакового поля
              </h1>
            </div>
          </div>

          {Object.entries(placesByRow).length > 0 ? (
              <div className="space-y-6">
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
                        <div className="relative w-full">
                          <div className="overflow-x-auto pb-4 scrollbar-container w-full">
                            <div className="flex flex-nowrap space-x-4 px-1 py-1">
                              {rowPlaces.map((place) => {
                                const stateInfo = getPlaceStateInfo(place)
                                const placeState = getPlaceState(place.id)

                                // Calculate elapsed time if there's a bucket placed
                                let elapsedTime = null
                                if (placeState && placeState.startDate) {
                                  elapsedTime = getElapsedTime(placeState.startDate)
                                }

                                // Обновим отображение мест в ряду, чтобы они были выровнены по одной линии
                                return (
                                    <TooltipProvider key={place.id}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex flex-col items-center h-full">
                                            {/* Фиксированная высота для верхней части (для времени) */}
                                            <div className="h-6 flex items-center justify-center mb-1">
                                              {placeState?.state === "BucketPlaced" && elapsedTime && (
                                                  <div className="text-xs font-medium text-white bg-primary px-2 py-0.5 rounded-md shadow-sm">
                                                    {elapsedTime}
                                                  </div>
                                              )}
                                            </div>
                                            {/* Контейнер для места с фиксированной высотой */}
                                            <div
                                                className={`${getPlaceClass(place)} w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center bg-card relative`}
                                                onContextMenu={(e) => createContextMenu(e, place)}
                                            >
                                              {renderIcon(place)}
                                            </div>
                                            <div className="mt-1 flex items-center justify-center relative">
                                      <span className="text-sm font-medium">
                                        {/* Проверяем, что place.row и place.number существуют */}
                                        {place.row !== undefined && place.number !== undefined
                                            ? place.row * 100 + place.number
                                            : "N/A"}
                                      </span>
                                              {getPlaceState(place.id) && (
                                                  <button
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        openInfoModal(place)
                                                      }}
                                                      className="absolute -right-6 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                                  >
                                                    <Info className="h-3 w-3" />
                                                  </button>
                                              )}
                                            </div>
                                          </div>
                                        </TooltipTrigger>
                                      </Tooltip>
                                    </TooltipProvider>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-medium">Нет данны</h3>
                <p className="text-muted-foreground">Не найдено мест для отображения</p>
              </div>
          )}
        </div>

        {infoPlace && (
            <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Информация о месте{" "}
                    {infoPlace.row !== undefined && infoPlace.number !== undefined
                        ? infoPlace.row * 100 + infoPlace.number
                        : "N/A"}
                  </DialogTitle>
                </DialogHeader>
                {(() => {
                  const stateInfo = getPlaceStateInfo(infoPlace)
                  if (!stateInfo) {
                    return (
                        <div className="py-6 text-center">
                          <p>На этом месте нет ковша</p>
                        </div>
                    )
                  }

                  // Update the info modal to show duration information
                  return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium text-muted-foreground">Ковш:</div>
                          <div>{stateInfo.bucketDescription}</div>

                          <div className="font-medium text-muted-foreground">Материал:</div>
                          <div>{stateInfo.materialName}</div>

                          <div className="font-medium text-muted-foreground">Дата установки:</div>
                          <div>{stateInfo.startDate}</div>

                          {/* если ковш ещё в процессе — показываем таймер и предупреждение */}
                          {stateInfo.state === "BucketPlaced" && (
                              <>
                                <div className="font-medium text-muted-foreground">Прошло времени:</div>
                                <div>
                                  {stateInfo.elapsedTime} ({stateInfo.elapsedHours} ч)
                                </div>
                                {stateInfo.exceedsMaxDuration && (
                                    <>
                                      <div className="font-medium text-red-500">Внимание:</div>
                                      <div className="text-red-500 font-semibold">
                                        Превышено максимальное время ({stateInfo.maxDurationHours} ч)
                                      </div>
                                    </>
                                )}
                              </>
                          )}

                          {/* если ковш уже опустошён — вместо таймера показываем дату опустошения */}
                          {stateInfo.state === "BucketEmptied" && (
                              <>
                                <div className="font-medium text-muted-foreground">Дата опустошения:</div>
                                <div>{stateInfo.endDate}</div>
                              </>
                          )}

                          <div className="font-medium text-muted-foreground">Вес:</div>
                          <div>{stateInfo.weight}</div>

                          <div className="font-medium text-muted-foreground">Статус:</div>
                          <div>{stateInfo.state}</div>

                          <div className="font-medium text-muted-foreground">Визуальный код:</div>
                          <div className="flex items-center">
                            <div className={`h-6 w-6 mr-2 rounded-md ${getIconColorClass(infoPlace)}`}></div>
                            {stateInfo.visualStateCode} ({stateInfo.timeRange})
                          </div>
                        </div>
                      </div>
                  )
                })()}
              </DialogContent>
            </Dialog>
        )}

        {selectedPlace && (
            <>
              <PlaceBucketModal
                  isOpen={isPlaceBucketOpen}
                  onClose={() => setIsPlaceBucketOpen(false)}
                  onSubmit={handlePlaceBucket}
                  place={selectedPlace}
              />

              <EmptyBucketModal
                  isOpen={isEmptyBucketOpen}
                  onClose={() => setIsEmptyBucketOpen(false)}
                  onSubmit={handleEmptyBucket}
                  place={selectedPlace}
              />

              <RemoveBucketModal
                  isOpen={isRemoveBucketOpen}
                  onClose={() => setIsRemoveBucketOpen(false)}
                  onSubmit={handleRemoveBucket}
                  place={selectedPlace}
              />

              <InvalidModal
                  isOpen={isInvalidOpen}
                  onClose={() => setIsInvalidOpen(false)}
                  onSubmit={handleInvalid}
                  place={selectedPlace}
              />
            </>
        )}
      </DashboardLayout>
  )
}
