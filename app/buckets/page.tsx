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
import type { Bucket, SlagFieldState, SlagFieldPlace } from "@/lib/types"
import { PlusCircle, Pencil, Trash, AlertCircle } from "lucide-react"
import {
  fetchBuckets,
  addBucket,
  updateBucket,
  deleteBucket,
  fetchSlagFieldStates,
  fetchPlaces,
} from "@/lib/data-service"

export default function BucketsPage() {
  const { toast } = useToast()
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [slagFieldStates, setSlagFieldStates] = useState<SlagFieldState[]>([])
  const [places, setPlaces] = useState<SlagFieldPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)

  const [formData, setFormData] = useState({
    name: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Fetch buckets
        const bucketsData = await fetchBuckets()
        setBuckets(bucketsData)

        // Fetch slag field states to check which buckets are in use
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]
        setSlagFieldStates(statesData)

        // Fetch places to get place numbers
        const placesData = await fetchPlaces()
        setPlaces(placesData)

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

  // Update the getBucketStatus function to return an object with status and place info
  const getBucketStatus = (bucketId: string) => {
    // Find active state (where endDate is null) that uses this bucket
    const activeState = slagFieldStates.find((state) => state.bucketId === bucketId && state.endDate === null)

    if (activeState) {
      // Find the place to get its row and number
      const place = places.find((p) => p.id === activeState.placeId)
      if (place) {
        const placeNumber = place.row * 100 + place.number
        return {
          isInUse: true,
          placeNumber,
        }
      }
      return {
        isInUse: true,
        placeNumber: null,
      }
    }

    return {
      isInUse: false,
      placeNumber: null,
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const newBucket = await addBucket({
        name: formData.name,
        isDelete: false,
      })

      setBuckets([...buckets, newBucket])
      setIsAddDialogOpen(false)
      setFormData({ name: "" })

      toast({
        title: "Ковш добавлен",
        description: `Ковш "${formData.name}" успешно добавлен`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить ковш",
        variant: "destructive",
      })
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBucket) return

    try {
      const updatedBucket = await updateBucket(selectedBucket.id, {
        name: formData.name,
      })

      const updatedBuckets = buckets.map((bucket) => (bucket.id === selectedBucket.id ? updatedBucket : bucket))

      setBuckets(updatedBuckets)
      setIsEditDialogOpen(false)
      setSelectedBucket(null)

      toast({
        title: "Ковш обновлен",
        description: `Ковш успешно обновлен`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить ковш",
        variant: "destructive",
      })
    }
  }

  // Исправленная функция openDeleteDialog, использующая уже загруженные данные
  const openDeleteDialog = (bucket: Bucket) => {
    // Проверяем, используется ли ковш на шлаковом поле, используя уже загруженные данные
    const isInUse = slagFieldStates.some((state) => state.bucketId === bucket.id && state.endDate === null)

    if (isInUse) {
      // Вместо toast показываем модальное окно с ошибкой
      setErrorMessage("Этот ковш используется на шлаковом поле. Сначала уберите ковш с поля.")
      setIsErrorDialogOpen(true)
      return
    }

    // Если ковш не используется, открываем диалог подтверждения
    setSelectedBucket(bucket)
    setIsDeleteDialogOpen(true)
  }

  // Упростим функцию handleDeleteSubmit, так как проверка уже выполнена
  const handleDeleteSubmit = async () => {
    if (!selectedBucket) return

    try {
      const success = await deleteBucket(selectedBucket.id)

      if (success) {
        // Обновляем список ковшей
        const bucketsData = await fetchBuckets()
        setBuckets(bucketsData)

        // Обновляем состояния шлакового поля
        const statesData = await fetchSlagFieldStates()
        setSlagFieldStates(statesData)

        setIsDeleteDialogOpen(false)
        setSelectedBucket(null)

        toast({
          title: "Ковш удален",
          description: `Ковш успешно удален`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить ковш",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить ковш",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (bucket: Bucket) => {
    setSelectedBucket(bucket)
    setFormData({
      name: bucket.name,
    })
    setIsEditDialogOpen(true)
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
            Справочник ковшей
          </h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить ковш
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ковши</CardTitle>
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
                {buckets
                  .filter((bucket) => !bucket.isDelete)
                  .map((bucket) => {
                    const bucketStatus = getBucketStatus(bucket.id)

                    return (
                      <TableRow key={bucket.id}>
                        <TableCell>{bucket.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {bucketStatus.isInUse ? (
                              <>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Используется
                                </span>
                                {bucketStatus.placeNumber && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    {bucketStatus.placeNumber}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                Не используется
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(bucket)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Редактировать</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(bucket)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Удалить</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить ковш</DialogTitle>
              <DialogDescription>Введите описание нового ковша.</DialogDescription>
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
              <DialogTitle>Редактировать ковш</DialogTitle>
              <DialogDescription>Измените описание ковша.</DialogDescription>
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
              <DialogTitle>Удалить ковш</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить этот ковш? Это действие нельзя отменить.
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
