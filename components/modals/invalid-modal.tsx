"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { SlagFieldPlace } from "@/lib/types"

interface InvalidModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  place: SlagFieldPlace
}

export function InvalidModal({ isOpen, onClose, onSubmit, place }: InvalidModalProps) {
  const [description, setDescription] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      placeId: place.id,
      description,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Очистить</DialogTitle>
          <DialogDescription>
            Очистка состояния места Ряд {place.row} место {place.number} ({place.row * 100 + place.number})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Причина
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Укажите причину очистки состояния"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="destructive">
              Очистить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
