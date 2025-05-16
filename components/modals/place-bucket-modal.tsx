"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SlagFieldPlace, Bucket, Material, SlagFieldState } from "@/lib/types"
import { fetchBuckets, fetchMaterials, fetchSlagFieldStates } from "@/lib/data-service"

interface PlaceBucketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  place: SlagFieldPlace
}

export function PlaceBucketModal({ isOpen, onClose, onSubmit, place }: PlaceBucketModalProps) {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 16))
  const [materialId, setMaterialId] = useState<string>("")
  const [weight, setWeight] = useState<number>(0)
  const [bucketId, setBucketId] = useState<string>("")

  const [materials, setMaterials] = useState<Material[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [availableBuckets, setAvailableBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Загрузка материалов
        const materialsData = await fetchMaterials()
        setMaterials(materialsData)

        // Загрузка ковшей
        const bucketsData = await fetchBuckets()
        setBuckets(bucketsData)

        // Загрузка состояний шлакового поля для фильтрации используемых ковшей
        const statesData = (await fetchSlagFieldStates()) as SlagFieldState[]

        // Получаем ID ковшей, которые уже используются (где endDate === null)
        const usedBucketIds = statesData.filter((state) => state.endDate === null).map((state) => state.bucketId)

        // Фильтруем ковши, исключая те, которые уже используются
        const availableBucketsData = bucketsData.filter((bucket) => !usedBucketIds.includes(bucket.id))
        setAvailableBuckets(availableBucketsData)

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    }

    if (isOpen) {
      loadData()
      // Reset form values when modal opens
      setStartDate(new Date().toISOString().slice(0, 16))
      setMaterialId("")
      setWeight(0)
      setBucketId("")
    }
  }, [isOpen])

  // In the handleSubmit function, update to:
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      placeId: place.id,
      startDate: new Date(startDate),
      materialId,
      weight: weight * 1000, // Convert to kg
      bucketId,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Установить ковш</DialogTitle>
          <DialogDescription>
            Установка ковша на место Ряд {place.row} место {place.number} ({place.row * 100 + place.number})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Дата-время установки
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="material" className="text-right">
                Материал
              </Label>
              <Select value={materialId} onValueChange={setMaterialId} required>
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
              <Label htmlFor="weight" className="text-right">
                Масса (т)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={weight || ""}
                onChange={(e) => setWeight(Number.parseFloat(e.target.value))}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bucket" className="text-right">
                Ковш
              </Label>
              <Select value={bucketId} onValueChange={setBucketId} required>
                <SelectTrigger id="bucket" className="col-span-3">
                  <SelectValue placeholder="Выберите ковш" />
                </SelectTrigger>
                <SelectContent>
                  {availableBuckets.length > 0 ? (
                    availableBuckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-buckets" disabled>
                      Нет доступных ковшей
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || availableBuckets.length === 0}>
              Установить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
