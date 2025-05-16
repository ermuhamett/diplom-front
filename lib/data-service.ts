import type { SlagFieldPlace, Bucket, Material } from "@/lib/types"
import { dataStore } from "@/lib/data-store"

// Helper function to format date in Kazakhstan timezone
export function formatDateKazakhstan(date: Date): string {
  return date.toLocaleString("ru-KZ", { timeZone: "Asia/Almaty" })
}

// Функция для получения мест
export async function fetchPlaces(): Promise<SlagFieldPlace[]> {
  // Имитируем задержку сети
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dataStore.getPlaces())
    }, 300)
  })
}

// Функция для получения ковшей
export async function fetchBuckets(): Promise<Bucket[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dataStore.getBuckets())
    }, 300)
  })
}

// Функция для получения материалов
export async function fetchMaterials(): Promise<Material[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dataStore.getMaterials())
    }, 300)
  })
}

// Функция для обновления места
export async function updatePlace(place: SlagFieldPlace): Promise<SlagFieldPlace> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updatedPlace = dataStore.updatePlace(place.id, place)
      if (updatedPlace) {
        resolve(updatedPlace)
      } else {
        reject(new Error("Не удалось обновить место"))
      }
    }, 300)
  })
}

// Функция для добавления места
export async function addPlace(place: Omit<SlagFieldPlace, "id">): Promise<SlagFieldPlace> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPlace = dataStore.addPlace(place)
      resolve(newPlace)
    }, 300)
  })
}

// Функция для удаления места
export async function deletePlace(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.deletePlace(id)
      resolve(result)
    }, 300)
  })
}

// Функция для добавления ковша
export async function addBucket(bucket: Omit<Bucket, "id">): Promise<Bucket> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newBucket = dataStore.addBucket(bucket)
      resolve(newBucket)
    }, 300)
  })
}

// Функция для обновления ковша
export async function updateBucket(id: string, bucket: Partial<Bucket>): Promise<Bucket> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updatedBucket = dataStore.updateBucket(id, bucket)
      if (updatedBucket) {
        resolve(updatedBucket)
      } else {
        reject(new Error("Не удалось обновить ковш"))
      }
    }, 300)
  })
}

// Функция для удаления ковша
export async function deleteBucket(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.deleteBucket(id)
      resolve(result)
    }, 300)
  })
}

// Функция для добавления материала
export async function addMaterial(material: Omit<Material, "id">): Promise<Material> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMaterial = dataStore.addMaterial(material)
      resolve(newMaterial)
    }, 300)
  })
}

// Функция для обновления материала
export async function updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const updatedMaterial = dataStore.updateMaterial(id, material)
      if (updatedMaterial) {
        resolve(updatedMaterial)
      } else {
        reject(new Error("Не удалось обновить материал"))
      }
    }, 300)
  })
}

// Функция для удаления материала
export async function deleteMaterial(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.deleteMaterial(id)
      resolve(result)
    }, 300)
  })
}

// Функции для работы с шлаковым полем
export async function placeBucket(data: {
  placeId: string
  bucketId: string
  materialId: string
  startDate: Date
  weight: number
}): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.placeBucket(data)
      resolve(!!result)
    }, 300)
  })
}

export async function emptyBucket(data: { placeId: string; endDate: Date }): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.emptyBucket(data)
      resolve(!!result)
    }, 300)
  })
}

export async function removeBucket(placeId: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.removeBucket(placeId)
      resolve(result)
    }, 300)
  })
}

export async function invalidateState(data: { placeId: string; description: string }): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.invalidateState(data)
      resolve(result)
    }, 300)
  })
}

// Функция для получения состояний шлакового поля
export async function fetchSlagFieldStates() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const states = dataStore.getEnrichedSlagFieldStates()

      // Don't modify the date objects, just pass them through
      resolve(states)
    }, 300)
  })
}

// Add this function if it doesn't already exist
export interface MaterialSetting {
  id: string
  name: string
  // Add other properties as needed
}

export async function fetchMaterialSettings(): Promise<MaterialSetting[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const settings = dataStore.getMaterialSettings()
      resolve(settings)
    }, 300)
  })
}
