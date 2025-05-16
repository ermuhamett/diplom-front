"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MaterialSetting, Material } from "@/lib/types"
import { addMaterialSetting, updateMaterialSetting } from "@/lib/data-store"

interface MaterialSettingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  setting?: MaterialSetting
  materials: Material[]
  colorType: "red" | "yellow" | "blue" | "green"
  materialId?: string
}

export function MaterialSettingModal({
  isOpen,
  onClose,
  onSave,
  setting,
  materials,
  colorType,
  materialId,
}: MaterialSettingModalProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("")
  const [duration, setDuration] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const colorNames = {
    red: "Красный",
    yellow: "Желтый",
    blue: "Синий",
    green: "Зеленый",
  }

  useEffect(() => {
    if (setting) {
      setSelectedMaterialId(setting.materialId)
      setDuration(setting.duration)
    } else if (materialId) {
      setSelectedMaterialId(materialId)
    } else {
      setSelectedMaterialId(materials[0]?.id || "")
      setDuration(0)
    }
  }, [setting, materials, materialId])

  const handleSave = async () => {
    if (!selectedMaterialId) {
      setError("Выберите материал")
      return
    }

    if (duration <= 0) {
      setError("Длительность должна быть больше 0")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (setting) {
        await updateMaterialSetting({
          ...setting,
          materialId: selectedMaterialId,
          duration,
        })
      } else {
        await addMaterialSetting({
          id: crypto.randomUUID(),
          materialId: selectedMaterialId,
          colorType,
          duration,
        })
      }
      onSave()
      onClose()
    } catch (err) {
      setError("Ошибка при сохранении настройки")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {setting ? "Изменить настройку" : "Добавить настройку"} - {colorNames[colorType]}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="material" className="text-right">
              Материал
            </Label>
            <select
              id="material"
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              disabled={!!materialId || !!setting}
            >
              <option value="">Выберите материал</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Длительность (мин)
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
