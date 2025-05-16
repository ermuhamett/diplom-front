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
import { useToast } from "@/hooks/use-toast"
import type { Material, MaterialSetting } from "@/lib/types"
import { PlusCircle, Pencil, Trash, AlertCircle } from "lucide-react"
import {
  fetchMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  fetchSlagFieldStates,
  fetchMaterialSettings,
} from "@/lib/data-service"
import type { SlagFieldState } from "@/lib/types"

export default function MaterialsPage() {
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [slagFieldStates, setSlagFieldStates] = useState<SlagFieldState[]>([])
  const [materialSettings, setMaterialSettings] = useState<MaterialSetting[]>([])

  const [formData, setFormData] = useState({
    name: "",
  })

  // Загружаем все необходимые данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Загружаем материалы
        const materialsData = await fetchMaterials()
        setMaterials(materialsData)

        // Загружаем состояния шлакового поля
        const statesData = await fetchSlagFieldStates()
        setSlagFieldStates(statesData)

        // Загружаем настройки материалов
        const settingsData = await fetchMaterialSettings()
        setMaterialSettings(settingsData)

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные материалов",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const newMaterial = await addMaterial({
        name: formData.name,
        isDelete: false,
      })

      setMaterials([...materials, newMaterial])
      setIsAddDialogOpen(false)
      setFormData({ name: "" })

      toast({
        title: "Материал добавлен",
        description: `Материал "${formData.name}" успешно добавлен`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить материал",
        variant: "destructive",
      })
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMaterial) return

    try {
      const updatedMaterial = await updateMaterial(selectedMaterial.id, {
        name: formData.name,
      })

      const updatedMaterials = materials.map((material) =>
        material.id === selectedMaterial.id ? updatedMaterial : material,
      )

      setMaterials(updatedMaterials)
      setIsEditDialogOpen(false)
      setSelectedMaterial(null)

      toast({
        title: "Материал обновлен",
        description: `Материал успешно обновлен`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить материал",
        variant: "destructive",
      })
    }
  }

  // Исправленная функция openDeleteDialog, чтобы сначала проверять наличие настроек материала
  const openDeleteDialog = (material: Material) => {
    // Сначала проверяем, есть ли настройки для этого материала
    const hasSettings = materialSettings.some((setting) => setting.materialId === material.id)

    if (hasSettings) {
      // Показываем модальное окно с ошибкой о настройках
      setErrorMessage("Для этого материала существуют настройки в справочнике. Сначала удалите настройки материала.")
      setIsErrorDialogOpen(true)
      return
    }

    // Затем проверяем, используется ли материал на шлаковом поле
    const isInUse = slagFieldStates.some((state) => state.materialId === material.id && state.endDate === null)

    if (isInUse) {
      // Показываем модальное окно с ошибкой об использовании
      setErrorMessage("Этот материал используется на шлаковом поле. Сначала уберите ковши с этим материалом.")
      setIsErrorDialogOpen(true)
      return
    }

    // Если материал не используется и нет настроек, открываем диалог подтверждения
    setSelectedMaterial(material)
    setIsDeleteDialogOpen(true)
  }

  // Упростим функцию handleDeleteSubmit, так как проверки уже выполнены
  const handleDeleteSubmit = async () => {
    if (!selectedMaterial) return

    try {
      const success = await deleteMaterial(selectedMaterial.id)

      if (success) {
        // Обновляем список материалов
        const materialsData = await fetchMaterials()
        setMaterials(materialsData)

        // Обновляем состояния шлакового поля
        const statesData = await fetchSlagFieldStates()
        setSlagFieldStates(statesData)

        // Обновляем настройки материалов
        const settingsData = await fetchMaterialSettings()
        setMaterialSettings(settingsData)

        setIsDeleteDialogOpen(false)
        setSelectedMaterial(null)

        toast({
          title: "Материал удален",
          description: `Материал успешно удален`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить материал",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить материал",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (material: Material) => {
    setSelectedMaterial(material)
    setFormData({
      name: material.name,
    })
    setIsEditDialogOpen(true)
  }

  const isMaterialInUse = (materialId: string) => {
    return slagFieldStates.some((state) => state.materialId === materialId && state.endDate === null)
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Справочник материалов
          </h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить материал
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Материалы</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials
                  .filter((material) => !material.isDelete)
                  .map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>
                        {isMaterialInUse(material.id) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Используется
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Не используется
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(material)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Редактировать</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(material)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Удалить</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить материал</DialogTitle>
              <DialogDescription>Введите название нового материала.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Название
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать материал</DialogTitle>
              <DialogDescription>Измените название материала.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Название
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить материал</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить этот материал? Это действие нельзя отменить.
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
                Невозможно удалить
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
      </div>
    </DashboardLayout>
  )
}
