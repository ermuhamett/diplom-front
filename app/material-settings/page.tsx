"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Material, MaterialSetting } from "@/lib/types"
import { PlusCircle, Pencil, Trash, AlertCircle } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { fetchMaterials } from "@/lib/data-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

// Interface for grouped material settings
interface GroupedMaterialSettings {
  materialId: string
  materialName: string
  settings: MaterialSetting[]
  totalDuration: number
}

// Interface for color range
interface ColorRange {
  color: string
  minHours: number
  maxHours: number
}

export default function MaterialSettingsPage() {
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialSettings, setMaterialSettings] = useState<MaterialSetting[]>([])
  const [groupedSettings, setGroupedSettings] = useState<GroupedMaterialSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [selectedSettings, setSelectedSettings] = useState<MaterialSetting[]>([])

  // Добавим модальное окно с ошибкой для настроек материалов
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Form data for add/edit
  const [formData, setFormData] = useState({
    materialId: "",
    totalHours: 48,
    colorRanges: [
      { color: "Красный", minHours: 0, maxHours: 12 },
      { color: "Желтый", minHours: 12, maxHours: 24 },
      { color: "Синий", minHours: 24, maxHours: 36 },
      { color: "Зеленый", minHours: 36, maxHours: 48 },
    ] as ColorRange[],
  })

  // Visual state code options
  const visualStateCodes = [
    { value: "Красный", color: "red", bgColor: "bg-red-500", textColor: "text-white" },
    { value: "Желтый", color: "yellow", bgColor: "bg-yellow-400", textColor: "text-black" },
    { value: "Синий", color: "blue", bgColor: "bg-blue-500", textColor: "text-white" },
    { value: "Зеленый", color: "green", bgColor: "bg-green-500", textColor: "text-white" },
  ]

  // Изменим функцию groupSettingsByMaterial, чтобы не включать материалы без настроек
  const groupSettingsByMaterial = (settings: MaterialSetting[], materials: Material[]) => {
    const materialMap = new Map<string, Material>()
    materials.forEach((material) => {
      materialMap.set(material.id, material)
    })

    const groupedByMaterial = new Map<string, { settings: MaterialSetting[]; totalDuration: number }>()

    // Заполняем настройками только те материалы, у которых они есть
    settings.forEach((setting) => {
      if (!groupedByMaterial.has(setting.materialId)) {
        groupedByMaterial.set(setting.materialId, {
          settings: [],
          totalDuration: 0,
        })
      }

      const materialSettings = groupedByMaterial.get(setting.materialId)!
      materialSettings.settings.push(setting)

      // Find the maximum duration for this material
      if (setting.duration > materialSettings.totalDuration) {
        materialSettings.totalDuration = setting.duration
      }
    })

    const result: GroupedMaterialSettings[] = []

    groupedByMaterial.forEach((data, materialId) => {
      const material = materialMap.get(materialId)
      if (material) {
        result.push({
          materialId,
          materialName: material.name,
          settings: data.settings,
          totalDuration: data.totalDuration,
        })
      }
    })

    return result
  }

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Загрузка материалов
        const materialsData = await fetchMaterials()
        setMaterials(materialsData)

        // Загрузка настроек материалов
        const settingsData = dataStore.getMaterialSettings()
        setMaterialSettings(settingsData)

        // Group settings by material
        const grouped = groupSettingsByMaterial(settingsData, materialsData)
        setGroupedSettings(grouped)

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Функция для форматирования длительности в часы и минуты
  const formatDuration = (minutes: number) => {
    if (!minutes) return "-"

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins} минут`
    } else if (mins === 0) {
      return `${hours} ${getHourText(hours)}`
    } else {
      return `${hours} ${getHourText(hours)} ${mins} минут`
    }
  }

  // Функция для получения правильного склонения слова "час"
  const getHourText = (hours: number) => {
    if (hours === 1) return "час"
    if (hours >= 2 && hours <= 4) return "часа"
    return "часов"
  }

  // Get color for time range
  const getColorForTimeRange = (settings: MaterialSetting[], hours: number): string | null => {
    for (const setting of settings) {
      if (setting.minHours !== undefined && setting.maxHours !== undefined) {
        if (hours >= setting.minHours && hours < setting.maxHours) {
          return setting.visualStateCode || null
        }
      }
    }
    return null
  }

  // Validate form
  const validateForm = () => {
    if (formData.materialId === "") {
      toast({
        title: "Ошибка валидации",
        description: "Выберите материал",
        variant: "destructive",
      })
      return false
    }

    if (formData.totalHours <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Общая длительность должна быть больше 0",
        variant: "destructive",
      })
      return false
    }

    // Check if color ranges cover the entire duration without gaps or overlaps
    const sortedRanges = [...formData.colorRanges].sort((a, b) => a.minHours - b.minHours)

    // Check for gaps and overlaps
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].maxHours !== sortedRanges[i + 1].minHours) {
        toast({
          title: "Ошибка валидации",
          description: "Временные диапазоны должны быть непрерывными без перекрытий",
          variant: "destructive",
        })
        return false
      }
    }

    // Check if the ranges cover from 0 to totalHours
    if (sortedRanges[0].minHours !== 0 || sortedRanges[sortedRanges.length - 1].maxHours !== formData.totalHours) {
      toast({
        title: "Ошибка валидации",
        description: `Временные диапазоны должны покрывать всю длительность от 0 до ${formData.totalHours} часов`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Handle add submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Convert total hours to minutes
      const totalDuration = formData.totalHours * 60

      // Delete existing settings for this material
      const existingSettings = materialSettings.filter((s) => s.materialId === formData.materialId)
      existingSettings.forEach((setting) => {
        dataStore.deleteMaterialSetting(setting.id)
      })

      // Create new settings for each color range
      const newSettings: MaterialSetting[] = []

      // Sort color ranges by minHours to ensure correct order
      const sortedRanges = [...formData.colorRanges].sort((a, b) => a.minHours - b.minHours)

      sortedRanges.forEach((range) => {
        const newSetting = dataStore.addMaterialSetting({
          materialId: formData.materialId,
          duration: totalDuration,
          visualStateCode: range.color,
          minHours: range.minHours,
          maxHours: range.maxHours,
        })
        newSettings.push(newSetting)
      })

      // Update state
      const updatedSettings = materialSettings.filter((s) => s.materialId !== formData.materialId).concat(newSettings)

      setMaterialSettings(updatedSettings)

      // Update grouped settings
      const grouped = groupSettingsByMaterial(updatedSettings, materials)
      setGroupedSettings(grouped)

      setIsAddDialogOpen(false)
      resetFormData()

      toast({
        title: "Настройки добавлены",
        description: `Настройки для материала успешно добавлены`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить настройки",
        variant: "destructive",
      })
    }
  }

  // Handle edit submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Convert total hours to minutes
      const totalDuration = formData.totalHours * 60

      // Delete existing settings for this material
      const existingSettings = materialSettings.filter((s) => s.materialId === formData.materialId)
      existingSettings.forEach((setting) => {
        dataStore.deleteMaterialSetting(setting.id)
      })

      // Create new settings for each color range
      const newSettings: MaterialSetting[] = []

      // Sort color ranges by minHours to ensure correct order
      const sortedRanges = [...formData.colorRanges].sort((a, b) => a.minHours - b.minHours)

      sortedRanges.forEach((range) => {
        const newSetting = dataStore.addMaterialSetting({
          materialId: formData.materialId,
          duration: totalDuration,
          visualStateCode: range.color,
          minHours: range.minHours,
          maxHours: range.maxHours,
        })
        newSettings.push(newSetting)
      })

      // Update state
      const updatedSettings = materialSettings.filter((s) => s.materialId !== formData.materialId).concat(newSettings)

      setMaterialSettings(updatedSettings)

      // Update grouped settings
      const grouped = groupSettingsByMaterial(updatedSettings, materials)
      setGroupedSettings(grouped)

      setIsEditDialogOpen(false)
      setSelectedMaterial(null)
      setSelectedSettings([])
      resetFormData()

      toast({
        title: "Настройки обновлены",
        description: `Настройки для материала успешно обновлены`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройки",
        variant: "destructive",
      })
    }
  }

  // Handle delete submit
  const handleDeleteSubmit = () => {
    if (!selectedMaterial) return

    try {
      // Delete all settings for this material
      const existingSettings = materialSettings.filter((s) => s.materialId === selectedMaterial)
      existingSettings.forEach((setting) => {
        dataStore.deleteMaterialSetting(setting.id)
      })

      // Update state
      const updatedSettings = materialSettings.filter((s) => s.materialId !== selectedMaterial)
      setMaterialSettings(updatedSettings)

      // Update grouped settings
      const grouped = groupSettingsByMaterial(updatedSettings, materials)
      setGroupedSettings(grouped)

      setIsDeleteDialogOpen(false)
      setSelectedMaterial(null)
      setSelectedSettings([])

      toast({
        title: "Настройки удалены",
        description: `Настройки для материала успешно удалены`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить настройки",
        variant: "destructive",
      })
    }
  }

  // Reset form data
  const resetFormData = () => {
    setFormData({
      materialId: "",
      totalHours: 48,
      colorRanges: [
        { color: "Красный", minHours: 0, maxHours: 12 },
        { color: "Желтый", minHours: 12, maxHours: 24 },
        { color: "Синий", minHours: 24, maxHours: 36 },
        { color: "Зеленый", minHours: 36, maxHours: 48 },
      ],
    })
  }

  // Open delete dialog
  const openDeleteDialog = (materialId: string, settings: MaterialSetting[]) => {
    setSelectedMaterial(materialId)
    setSelectedSettings(settings)
    setIsDeleteDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (materialId: string, settings: MaterialSetting[]) => {
    setSelectedMaterial(materialId)
    setSelectedSettings(settings)

    // Find total duration (all settings should have the same duration)
    const totalDuration = settings.length > 0 ? settings[0].duration : 2880 // Default to 48 hours
    const totalHours = Math.floor(totalDuration / 60)

    // Extract color ranges
    const colorRanges: ColorRange[] = []

    settings.forEach((setting) => {
      if (setting.visualStateCode && setting.minHours !== undefined && setting.maxHours !== undefined) {
        colorRanges.push({
          color: setting.visualStateCode,
          minHours: setting.minHours,
          maxHours: setting.maxHours,
        })
      }
    })

    // If no color ranges found, use default
    if (colorRanges.length === 0) {
      colorRanges.push(
        { color: "Красный", minHours: 0, maxHours: Math.floor(totalHours / 4) },
        { color: "Желтый", minHours: Math.floor(totalHours / 4), maxHours: Math.floor(totalHours / 2) },
        { color: "Синий", minHours: Math.floor(totalHours / 2), maxHours: Math.floor((totalHours * 3) / 4) },
        { color: "Зеленый", minHours: Math.floor((totalHours * 3) / 4), maxHours: totalHours },
      )
    }

    // Sort color ranges by minHours
    colorRanges.sort((a, b) => a.minHours - b.minHours)

    setFormData({
      materialId,
      totalHours,
      colorRanges,
    })

    setIsEditDialogOpen(true)
  }

  // Open add dialog
  const openAddDialog = () => {
    resetFormData()
    setIsAddDialogOpen(true)
  }

  // Update color range
  const updateColorRange = (index: number, field: keyof ColorRange, value: any) => {
    const newRanges = [...formData.colorRanges]
    newRanges[index] = { ...newRanges[index], [field]: value }

    // If changing minHours, update maxHours of previous range
    if (field === "minHours" && index > 0) {
      newRanges[index - 1] = { ...newRanges[index - 1], maxHours: value }
    }

    // If changing maxHours, update minHours of next range
    if (field === "maxHours" && index < newRanges.length - 1) {
      newRanges[index + 1] = { ...newRanges[index + 1], minHours: value }
    }

    setFormData({ ...formData, colorRanges: newRanges })
  }

  // Update total hours
  const updateTotalHours = (hours: number) => {
    const newRanges = [...formData.colorRanges]

    // Update the last range to end at the new total hours
    if (newRanges.length > 0) {
      const lastIndex = newRanges.length - 1
      newRanges[lastIndex] = { ...newRanges[lastIndex], maxHours: hours }
    }

    setFormData({ ...formData, totalHours: hours, colorRanges: newRanges })
  }

  // Swap color ranges
  const swapColorRanges = (index1: number, index2: number) => {
    if (index1 < 0 || index1 >= formData.colorRanges.length || index2 < 0 || index2 >= formData.colorRanges.length) {
      return
    }

    const newRanges = [...formData.colorRanges]

    // Swap colors only, not time ranges
    const color1 = newRanges[index1].color
    const color2 = newRanges[index2].color

    newRanges[index1] = { ...newRanges[index1], color: color2 }
    newRanges[index2] = { ...newRanges[index2], color: color1 }

    setFormData({ ...formData, colorRanges: newRanges })
  }

  // Move color range up
  const moveColorRangeUp = (index: number) => {
    if (index <= 0) return
    swapColorRanges(index, index - 1)
  }

  // Move color range down
  const moveColorRangeDown = (index: number) => {
    if (index >= formData.colorRanges.length - 1) return
    swapColorRanges(index, index + 1)
  }

  // Улучшим отображение временной шкалы цветов
  const renderColorTimeline = (settings: MaterialSetting[], totalDuration: number) => {
    if (settings.length === 0 || totalDuration === 0) return null

    const totalHours = Math.floor(totalDuration / 60)
    const colorRanges: ColorRange[] = []

    settings.forEach((setting) => {
      if (setting.visualStateCode && setting.minHours !== undefined && setting.maxHours !== undefined) {
        colorRanges.push({
          color: setting.visualStateCode,
          minHours: setting.minHours,
          maxHours: setting.maxHours,
        })
      }
    })

    // Sort color ranges by minHours
    colorRanges.sort((a, b) => a.minHours - b.minHours)

    return (
      <div className="w-full flex flex-col gap-1">
        <div className="w-full h-12 flex rounded-md overflow-hidden shadow-sm border">
          {colorRanges.map((range, index) => {
            const width = ((range.maxHours - range.minHours) / totalHours) * 100
            const bgColor = visualStateCodes.find((c) => c.value === range.color)?.bgColor || "bg-gray-300"
            const textColor = visualStateCodes.find((c) => c.value === range.color)?.textColor || "text-black"

            return (
              <div
                key={index}
                className={`${bgColor} ${textColor} flex items-center justify-center text-xs font-medium relative`}
                style={{ width: `${width}%` }}
                title={`${range.color}: ${range.minHours}-${range.maxHours} часов`}
              >
                {width > 15 ? (
                  `${range.minHours}-${range.maxHours}ч`
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full h-full flex items-center justify-center cursor-help">
                          {width > 5 ? "..." : ""}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{`${range.color}: ${range.minHours}-${range.maxHours} часов`}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0ч</span>
          <span>{totalHours}ч</span>
        </div>
      </div>
    )
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Настройки материалов
        </h1>
        <Button onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Добавить настройку
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Настройки обработки материалов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Материал</TableHead>
                  <TableHead className="w-[140px]">Общая длительность</TableHead>
                  <TableHead>Временная шкала цветов</TableHead>
                  <TableHead className="text-right w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedSettings.map((group) => (
                  <TableRow key={group.materialId}>
                    <TableCell className="font-medium">{group.materialName}</TableCell>
                    <TableCell>{formatDuration(group.totalDuration)}</TableCell>
                    <TableCell>{renderColorTimeline(group.settings, group.totalDuration)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(group.materialId, group.settings)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Редактировать настройки</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(group.materialId, group.settings)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Удалить настройки</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Добавить настройки материала</DialogTitle>
            <DialogDescription>Настройте временные диапазоны для цветовых состояний материала.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 h-[calc(90vh-180px)]">
            <form id="addForm" onSubmit={handleAddSubmit}>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="material" className="text-right">
                    Материал
                  </Label>
                  <Select
                    value={formData.materialId}
                    onValueChange={(value) => setFormData({ ...formData, materialId: value })}
                    required
                  >
                    <SelectTrigger id="material" className="col-span-3">
                      <SelectValue placeholder="Выберите материал" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="totalHours" className="text-right">
                    Общая длительность
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="totalHours"
                      type="number"
                      min="1"
                      value={formData.totalHours}
                      onChange={(e) => updateTotalHours(Number.parseInt(e.target.value) || 0)}
                      className="w-24"
                      required
                    />
                    <span>часов</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Настройка цветовых диапазонов</h3>

                  <div className="w-full h-8 flex rounded-md overflow-hidden mb-6">
                    {formData.colorRanges.map((range, index) => {
                      const width = ((range.maxHours - range.minHours) / formData.totalHours) * 100
                      const bgColor = visualStateCodes.find((c) => c.value === range.color)?.bgColor || "bg-gray-300"
                      const textColor = visualStateCodes.find((c) => c.value === range.color)?.textColor || "text-black"

                      return (
                        <div
                          key={index}
                          className={`${bgColor} ${textColor} flex items-center justify-center text-xs`}
                          style={{ width: `${width}%` }}
                        >
                          {width > 10 && `${range.minHours}-${range.maxHours}ч`}
                        </div>
                      )
                    })}
                  </div>

                  {formData.colorRanges.map((range, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 mb-6 p-3 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <Select
                          value={range.color}
                          onValueChange={(value) => {
                            const newRanges = [...formData.colorRanges]
                            newRanges[index] = { ...newRanges[index], color: value }
                            setFormData({ ...formData, colorRanges: newRanges })
                          }}
                        >
                          <SelectTrigger className="w-auto p-0 h-auto border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                            <div
                              className={`w-6 h-6 rounded-full ${
                                visualStateCodes.find((c) => c.value === range.color)?.bgColor || "bg-gray-300"
                              }`}
                            ></div>
                          </SelectTrigger>
                          <SelectContent>
                            {visualStateCodes.map((code) => (
                              <SelectItem key={code.value} value={code.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${code.bgColor}`}></div>
                                  <span>{code.value}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="font-medium">{range.color}</span>
                      </div>

                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`min-${index}`} className="whitespace-nowrap">
                            От:
                          </Label>
                          <Input
                            id={`min-${index}`}
                            type="number"
                            min="0"
                            max={formData.totalHours}
                            value={range.minHours}
                            onChange={(e) => updateColorRange(index, "minHours", Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                            disabled={index === 0} // First range always starts at 0
                          />
                          <span>ч</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`max-${index}`} className="whitespace-nowrap">
                            До:
                          </Label>
                          <Input
                            id={`max-${index}`}
                            type="number"
                            min="0"
                            max={formData.totalHours}
                            value={range.maxHours}
                            onChange={(e) => updateColorRange(index, "maxHours", Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                            disabled={index === formData.colorRanges.length - 1} // Last range always ends at totalHours
                          />
                          <span>ч</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button form="addForm" type="submit">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Редактировать настройки материала</DialogTitle>
            <DialogDescription>Настройте временные диапазоны для цветовых состояний материала.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 h-[calc(90vh-180px)]">
            <form id="editForm" onSubmit={handleEditSubmit}>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-material" className="text-right">
                    Материал
                  </Label>
                  <div className="col-span-3">
                    <div className="p-2 border rounded-md bg-muted">
                      {materials.find((m) => m.id === formData.materialId)?.name || "Выбранный материал"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-totalHours" className="text-right">
                    Общая длительность
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="edit-totalHours"
                      type="number"
                      min="1"
                      value={formData.totalHours}
                      onChange={(e) => updateTotalHours(Number.parseInt(e.target.value) || 0)}
                      className="w-24"
                      required
                    />
                    <span>часов</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Настройка цветовых диапазонов</h3>

                  <div className="w-full h-8 flex rounded-md overflow-hidden mb-6">
                    {formData.colorRanges.map((range, index) => {
                      const width = ((range.maxHours - range.minHours) / formData.totalHours) * 100
                      const bgColor = visualStateCodes.find((c) => c.value === range.color)?.bgColor || "bg-gray-300"
                      const textColor = visualStateCodes.find((c) => c.value === range.color)?.textColor || "text-black"

                      return (
                        <div
                          key={index}
                          className={`${bgColor} ${textColor} flex items-center justify-center text-xs`}
                          style={{ width: `${width}%` }}
                        >
                          {width > 10 && `${range.minHours}-${range.maxHours}ч`}
                        </div>
                      )
                    })}
                  </div>

                  {formData.colorRanges.map((range, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 mb-6 p-3 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <Select
                          value={range.color}
                          onValueChange={(value) => {
                            const newRanges = [...formData.colorRanges]
                            newRanges[index] = { ...newRanges[index], color: value }
                            setFormData({ ...formData, colorRanges: newRanges })
                          }}
                        >
                          <SelectTrigger className="w-auto p-0 h-auto border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                            <div
                              className={`w-6 h-6 rounded-full ${
                                visualStateCodes.find((c) => c.value === range.color)?.bgColor || "bg-gray-300"
                              }`}
                            ></div>
                          </SelectTrigger>
                          <SelectContent>
                            {visualStateCodes.map((code) => (
                              <SelectItem key={code.value} value={code.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${code.bgColor}`}></div>
                                  <span>{code.value}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="font-medium">{range.color}</span>
                      </div>

                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`edit-min-${index}`} className="whitespace-nowrap">
                            От:
                          </Label>
                          <Input
                            id={`edit-min-${index}`}
                            type="number"
                            min="0"
                            max={formData.totalHours}
                            value={range.minHours}
                            onChange={(e) => updateColorRange(index, "minHours", Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                            disabled={index === 0} // First range always starts at 0
                          />
                          <span>ч</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`edit-max-${index}`} className="whitespace-nowrap">
                            До:
                          </Label>
                          <Input
                            id={`edit-max-${index}`}
                            type="number"
                            min="0"
                            max={formData.totalHours}
                            value={range.maxHours}
                            onChange={(e) => updateColorRange(index, "maxHours", Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                            disabled={index === formData.colorRanges.length - 1} // Last range always ends at totalHours
                          />
                          <span>ч</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button form="editForm" type="submit">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить настройки</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить все настройки для материала "
              {materials.find((m) => m.id === selectedMaterial)?.name}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Ошибка
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p>{errorMessage}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsErrorDialogOpen(false)}>
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
