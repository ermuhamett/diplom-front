'use client';

import type React from 'react';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SlagFieldPlace } from '@/lib/types';

interface EmptyBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  place: SlagFieldPlace;
}

export function EmptyBucketModal({
  isOpen,
  onClose,
  onSubmit,
  place,
}: EmptyBucketModalProps) {
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      placeId: place.id,
      endDate: new Date(endDate),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Опустошить ковш</DialogTitle>
          <DialogDescription>
            Опустошение ковша на месте Ряд {place.row} место {place.number} (
            {place.row * 100 + place.number})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='endDate' className='text-right'>
                Дата-время опустошения
              </Label>
              <Input
                id='endDate'
                type='datetime-local'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().slice(0, 16)} // запретит выбрать > сейчас
                className='col-span-3'
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Отмена
            </Button>
            <Button type='submit'>Опустошить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
