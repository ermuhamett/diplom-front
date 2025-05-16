"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { SlagFieldPlace } from "@/lib/types"

interface RemoveBucketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  place: SlagFieldPlace
}

export function RemoveBucketModal({ isOpen, onClose, onSubmit, place }: RemoveBucketModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Убрать ковш</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите убрать ковш с места Ряд {place.row} место {place.number} (
            {place.row * 100 + place.number})?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="button" onClick={onSubmit}>
            Убрать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
