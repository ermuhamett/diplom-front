import type { SlagFieldPlace, Bucket, Material, SlagFieldState } from "@/lib/types"
import { dataStore } from "@/lib/data-store"

// Импортируем API сервисы
import { PlacesApi, BucketsApi, SlagFieldApi } from "./api-service"

// Helper function to format date in Kazakhstan timezone
export function formatDateKazakhstan(date: Date): string {
  return date.toLocaleString("ru-KZ", { timeZone: "Asia/Almaty" })
}

// Функция для получения мест
export async function fetchPlaces(): Promise<SlagFieldPlace[]> {
  try {
    // Пытаемся получить данные с бэкенда
    const placesFromApi = await PlacesApi.getAll()

    // Если успешно получили данные с бэкенда, обновляем локальное хранилище
    if (placesFromApi && placesFromApi.length > 0) {
      // Преобразуем данные для совместимости с фронтендом
      const processedPlaces = placesFromApi.map((place) => ({
        ...place,
        // Преобразуем row из string в number, если это необходимо
        row: place.row ? Number.parseInt(place.row.toString()) : undefined,
        // Добавляем name, если его нет
        name:
            place.name ||
            `Место ${place.row ? Number.parseInt(place.row.toString()) * 100 + (place.number || 0) : place.id}`,
      }))

      // Сохраняем полученные данные в локальное хранилище
      dataStore.syncPlacesWithApi(processedPlaces)
      return processedPlaces
    }
  } catch (error) {
    console.error("Error fetching places from API:", error)
    console.log("Falling back to local data")
  }

  // Если не удалось получить данные с бэкенда, используем локальные данные
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dataStore.getPlaces())
    }, 300)
  })
}

// Функция для получения ковшей
export async function fetchBuckets(): Promise<Bucket[]> {
  try {
    // Пытаемся получить данные с бэкенда
    const bucketsFromApi = await BucketsApi.getAll()

    // Если успешно получили данные с бэкенда, обновляем локальное хранилище
    if (bucketsFromApi && bucketsFromApi.length > 0) {
      // Преобразуем данные для совместимости с фронтендом
      const processedBuckets = bucketsFromApi.map((bucket) => ({
        ...bucket,
        // Используем description как name, если name отсутствует
        name: bucket.name || bucket.description || `Ковш ${bucket.id.substring(0, 5)}`,
      }))

      // Сохраняем полученные данные в локальное хранилище
      dataStore.syncBucketsWithApi(processedBuckets)
      return processedBuckets
    }
  } catch (error) {
    console.error("Error fetching buckets from API:", error)
    console.log("Falling back to local data")
  }

  // Если не удалось получить данные с бэкенда, используем локальные данные
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
  try {
    // Отправляем данные на бэкенд
    const updatedPlace = await PlacesApi.update(place.id, place)

    // Если успешно обновили запись на бэкенде, обновляем локальное хранилище
    if (updatedPlace) {
      // Преобразуем данные для совместимости с фронтендом
      const processedPlace = {
        ...updatedPlace,
        // Преобразуем row из string в number, если это необходимо
        row: updatedPlace.row ? Number.parseInt(updatedPlace.row.toString()) : undefined,
        // Добавляем name, если его нет
        name:
            updatedPlace.name ||
            `Место ${updatedPlace.row ? Number.parseInt(updatedPlace.row.toString()) * 100 + (updatedPlace.number || 0) : updatedPlace.id}`,
      }

      dataStore.updatePlace(place.id, processedPlace)
      return processedPlace
    }
  } catch (error) {
    console.error("Error updating place in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
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
  try {
    // Отправляем данные на бэкенд
    const newPlace = await PlacesApi.create(place)

    // Если успешно создали запись на бэкенде, сохраняем в локальное хранилище
    if (newPlace && newPlace.id) {
      // Преобразуем данные для совместимости с фронтендом
      const processedPlace = {
        ...newPlace,
        // Преобразуем row из string в number, если это необходимо
        row: newPlace.row ? Number.parseInt(newPlace.row.toString()) : undefined,
        // Добавляем name, если его нет
        name:
            newPlace.name ||
            `Место ${newPlace.row ? Number.parseInt(newPlace.row.toString()) * 100 + (newPlace.number || 0) : newPlace.id}`,
      }

      dataStore.addPlaceWithId(processedPlace)
      return processedPlace
    }
  } catch (error) {
    console.error("Error adding place to API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPlace = dataStore.addPlace(place)
      resolve(newPlace)
    }, 300)
  })
}

// Функция для удаления места
export async function deletePlace(id: string): Promise<boolean> {
  try {
    // Отправляем запрос на удаление на бэкенд
    const success = await PlacesApi.delete(id)

    // Если успешно удалили запись на бэкенде, обновляем локальное хранилище
    if (success) {
      dataStore.deletePlace(id)
      return true
    }
  } catch (error) {
    console.error("Error deleting place from API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.deletePlace(id)
      resolve(result)
    }, 300)
  })
}

// Функция для добавления ковша
export async function addBucket(bucket: Omit<Bucket, "id">): Promise<Bucket> {
  try {
    // Отправляем данные на бэкенд
    const newBucket = await BucketsApi.create(bucket)

    // Если успешно создали запись на бэкенде, сохраняем в локальное хранилище
    if (newBucket && newBucket.id) {
      // Преобразуем данные для совместимости с фронтендом
      const processedBucket = {
        ...newBucket,
        // Используем description как name, если name отсутствует
        name: newBucket.name || newBucket.description || `Ковш ${newBucket.id.substring(0, 5)}`,
      }

      dataStore.addBucketWithId(processedBucket)
      return processedBucket
    }
  } catch (error) {
    console.error("Error adding bucket to API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const newBucket = dataStore.addBucket(bucket)
      resolve(newBucket)
    }, 300)
  })
}

// Функция для обновления ковша
export async function updateBucket(id: string, bucket: Partial<Bucket>): Promise<Bucket> {
  try {
    // Отправляем данные на бэкенд
    const updatedBucket = await BucketsApi.update(id, bucket)

    // Если успешно обновили запись на бэкенде, обновляем локальное хранилище
    if (updatedBucket) {
      // Преобразуем данные для совместимости с фронтендом
      const processedBucket = {
        ...updatedBucket,
        // Используем description как name, если name отсутствует
        name: updatedBucket.name || updatedBucket.description || `Ковш ${updatedBucket.id.substring(0, 5)}`,
      }

      dataStore.updateBucket(id, processedBucket)
      return processedBucket
    }
  } catch (error) {
    console.error("Error updating bucket in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
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
  try {
    // Отправляем запрос на удаление на бэкенд
    const success = await BucketsApi.delete(id)

    // Если успешно удалили запись на бэкенде, обновляем локальное хранилище
    if (success) {
      dataStore.deleteBucket(id)
      return true
    }
  } catch (error) {
    console.error("Error deleting bucket from API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
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

// Функция для получения состояний шлакового поля
export async function fetchSlagFieldStates(): Promise<SlagFieldState[]> {
  try {
    // Пытаемся получить данные с бэкенда
    const statesFromApi = await SlagFieldApi.getCurrentState()

    if (statesFromApi && statesFromApi.length > 0) {
      // Преобразуем данные для совместимости с фронтендом
      const processedStates = statesFromApi.map((state) => ({
        id: state.stateId || `temp-${state.placeId}`,
        placeId: state.placeId,
        state: state.state,
        bucketId: state.bucketId,
        materialId: state.materialId,
        startDate: state.startDate,
        endDate: state.endDate,
        weight: state.slagWeight || 0,
        description: state.description,
        // Дополнительные поля для совместимости с интерфейсом
        status:
            state.state === "BucketPlaced"
                ? "active"
                : state.state === "BucketEmptied"
                    ? "completed"
                    : state.state === "BucketRemoved"
                        ? "removed"
                        : state.state === "Invalid"
                            ? "invalid"
                            : "none",
      }))

      // Фильтруем состояния, чтобы оставить только те, которые имеют ковши
      // Состояния NotInUse не должны отображаться как активные состояния
      const filteredStates = processedStates.filter((state) => state.state !== "NotInUse" && state.bucketId)
      const enrichedStates = await enrichSlagFieldStates(filteredStates)
      return enrichedStates
    }
  } catch (error) {
    console.error("Error fetching slag field states from API:", error)
    console.log("Falling back to local data")
  }

  // Если не удалось получить данные с бэкенда, используем локальные данные
  return new Promise((resolve) => {
    setTimeout(() => {
      const states = dataStore.getEnrichedSlagFieldStates()
      resolve(states)
    }, 300)
  })
}

// Функция для обогащения состояний шлакового поля данными о местах, ковшах и материалах
async function enrichSlagFieldStates(states: SlagFieldState[]): Promise<SlagFieldState[]> {
  // Получаем места, ковши и материалы
  const places = await fetchPlaces()
  const buckets = await fetchBuckets()
  const materials = await fetchMaterials()

  // Обогащаем состояния данными
  return states.map((state) => {
    const place = places.find((p) => p.id === state.placeId)
    const bucket = buckets.find((b) => b.id === state.bucketId)
    const material = materials.find((m) => m.id === state.materialId)

    return {
      ...state,
      place,
      bucket,
      material,
      bucketDescription: bucket?.name || bucket?.description || "Неизвестный ковш",
      materialName: material?.name || "Неизвестный материал",
    }
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
  try {
    // Отправляем запрос на бэкенд
    const success = await SlagFieldApi.placeBucket(data.placeId, {
      bucketId: data.bucketId,
      materialId: data.materialId,
      slagWeight: data.weight,
      startDate: data.startDate,
    })

    if (success) {
      return true
    }
  } catch (error) {
    console.error("Error placing bucket in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.placeBucket(data)
      resolve(!!result)
    }, 300)
  })
}

export async function emptyBucket(data: { placeId: string; endDate: Date }): Promise<boolean> {
  try {
    // Отправляем запрос на бэкенд
    const success = await SlagFieldApi.emptyBucket(data.placeId, {
      endDate: data.endDate,
    })

    if (success) {
      // Обновляем локальное состояние, чтобы показать empty_bucket.png
      /*const states = await fetchSlagFieldStates()
      const state = states.find((s) => s.placeId === data.placeId)

      if (state) {
        // Обновляем состояние вручную, чтобы гарантировать, что оно изменится на "BucketEmptied"
        state.state = "BucketEmptied"*
      }*/
      const state = dataStore.emptyBucket(data)
      return true
    }
  } catch (error) {
    console.error("Error emptying bucket in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.emptyBucket(data)
      resolve(!!result)
    }, 300)
  })
}

export async function removeBucket(placeId: string): Promise<boolean> {
  try {
    // Отправляем запрос на бэкенд
    const success = await SlagFieldApi.removeBucket(placeId)

    if (success) {
      return true
    }
  } catch (error) {
    console.error("Error removing bucket in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.removeBucket(placeId)
      resolve(result)
    }, 300)
  })
}

export async function invalidateState(data: { placeId: string; description: string }): Promise<boolean> {
  try {
    // Отправляем запрос на бэкенд
    const success = await SlagFieldApi.markInvalid(data.placeId, {
      description: data.description,
    })

    if (success) {
      return true
    }
  } catch (error) {
    console.error("Error invalidating state in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = dataStore.invalidateState(data)
      resolve(result)
    }, 300)
  })
}

// Функция для отметки места как используемое
export async function markPlaceInUse(placeId: string): Promise<boolean> {
  try {
    // Отправляем запрос на бэкенд
    const success = await PlacesApi.wentInUse(placeId)

    if (success) {
      // Обновляем локальное хранилище
      const place = dataStore.getPlace(placeId)
      if (place) {
        dataStore.updatePlace(placeId, { ...place, isEnable: true })
      }
      return true
    }
  } catch (error) {
    console.error("Error marking place as in use in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const place = dataStore.getPlace(placeId)
      if (place) {
        dataStore.updatePlace(placeId, { ...place, isEnable: true })
        resolve(true)
      } else {
        resolve(false)
      }
    }, 300)
  })
}

// Функция для отметки места как неиспользуемое
export async function markPlaceOutOfUse(placeId: string): Promise<boolean> {
  try {
    // Отправляем запрос на бэкенд
    const success = await PlacesApi.outOfUse(placeId)

    if (success) {
      // Обновляем локальное хранилище
      const place = dataStore.getPlace(placeId)
      if (place) {
        dataStore.updatePlace(placeId, { ...place, isEnable: false })
      }
      return true
    }
  } catch (error) {
    console.error("Error marking place as out of use in API:", error)
    console.log("Falling back to local storage")
  }

  // Если не удалось отправить данные на бэкенд, используем локальное хранилище
  return new Promise((resolve) => {
    setTimeout(() => {
      const place = dataStore.getPlace(placeId)
      if (place) {
        dataStore.updatePlace(placeId, { ...place, isEnable: false })
        resolve(true)
      } else {
        resolve(false)
      }
    }, 300)
  })
}

export async function fetchMaterialSettings() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const settings = dataStore.getMaterialSettings()
      resolve(settings)
    }, 300)
  })
}
