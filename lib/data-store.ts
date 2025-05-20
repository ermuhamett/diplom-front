import { v4 as uuidv4 } from "uuid"
import type { SlagFieldPlace, Bucket, Material, MaterialSetting, SlagFieldState } from "@/lib/types"

// Определим тип для записи истории
export type HistoryRecord = {
  id: string
  timestamp: Date
  action: string
  entityType: string
  entityId?: string

  // Общие поля для операций с местами
  placeId?: string
  placeRow?: number
  placeNumber?: number

  // Поля для операций с ковшами
  bucketId?: string
  bucketName?: string

  // Поля для операций с материалами
  materialId?: string
  materialName?: string
  weight?: number

  // Поля для времени операций
  operationTime?: Date
  placementTime?: Date
  emptyTime?: Date

  // Дополнительные поля
  reason?: string
  details?: string
}

// Добавим новый ключ для истории в STORAGE_KEYS
const STORAGE_KEYS = {
  PLACES: "slag_field_places",
  BUCKETS: "slag_field_buckets",
  MATERIALS: "slag_field_materials",
  MATERIAL_SETTINGS: "slag_field_material_settings",
  SLAG_FIELD_STATES: "slag_field_states",
  USER_HISTORY: "user_action_history", // Ключ для истории
}

// Класс для хранения данных
class DataStore {
  private places: SlagFieldPlace[] = []
  private buckets: Bucket[] = []
  private materials: Material[] = []
  private slagFieldStates: SlagFieldState[] = []
  private materialSettings: MaterialSetting[] = []
  private userHistory: HistoryRecord[] = [] // Новое поле для истории

  constructor() {
    // Инициализация данных
    //this.initializePlaces()
    //this.initializeBuckets()
    this.initializeMaterials()
    this.initializeMaterialSettings()
  }

  // Методы для синхронизации с API
  syncPlacesWithApi(places: SlagFieldPlace[]): void {
    // Обновляем локальное хранилище данными с API
    this.places = places
    // Сохраняем в localStorage
    this.saveToStorage()
  }

  syncBucketsWithApi(buckets: Bucket[]): void {
    // Обновляем локальное хранилище данными с API
    this.buckets = buckets
    // Сохраняем в localStorage
    this.saveToStorage()
  }

  // Метод для добавления места с уже существующим ID (из API)
  addPlaceWithId(place: SlagFieldPlace): SlagFieldPlace {
    this.places.push(place)
    // Сохраняем в localStorage
    this.saveToStorage()
    return place
  }

  // Метод для добавления ковша с уже существующим ID (из API)
  addBucketWithId(bucket: Bucket): Bucket {
    this.buckets.push(bucket)
    // Сохраняем в localStorage
    this.saveToStorage()
    return bucket
  }

  // Методы для работы с местами
  getPlaces(): SlagFieldPlace[] {
    return this.places
  }

  getPlace(id: string): SlagFieldPlace | undefined {
    return this.places.find((place) => place.id === id)
  }

  addPlace(place: Omit<SlagFieldPlace, "id">): SlagFieldPlace {
    const newPlace: SlagFieldPlace = {
      id: uuidv4(),
      ...place,
    }
    this.places.push(newPlace)

    // Добавляем запись в историю
    this.addToHistory(
        "add",
        "place",
        newPlace.id,
        `Добавлено место: ${place.name || `${place.row || 0}-${place.number || 0}`}`,
    )

    // Сохраняем в localStorage
    this.saveToStorage()
    return newPlace
  }

  updatePlace(id: string, place: Partial<SlagFieldPlace>): SlagFieldPlace | undefined {
    const index = this.places.findIndex((p) => p.id === id)
    if (index !== -1) {
      this.places[index] = { ...this.places[index], ...place }

      // Добавляем запись в историю
      this.addToHistory(
          "update",
          "place",
          id,
          `Обновлено место: ${place.name || `${place.row || 0}-${place.number || 0}`}`,
      )

      // Сохраняем в localStorage
      this.saveToStorage()
      return this.places[index]
    }
    return undefined
  }

  deletePlace(id: string): boolean {
    const initialLength = this.places.length
    const placeToDelete = this.getPlace(id)
    this.places = this.places.filter((place) => place.id !== id)
    const deleted = this.places.length !== initialLength

    if (deleted && placeToDelete) {
      // Добавляем запись в историю
      this.addToHistory(
          "delete",
          "place",
          id,
          `Удалено место: ${placeToDelete.name || `${placeToDelete.row || 0}-${placeToDelete.number || 0}`}`,
      )

      // Сохраняем в localStorage
      this.saveToStorage()
    }

    return deleted
  }

  // Методы для работы с ковшами
  getBuckets(): Bucket[] {
    return this.buckets
  }

  getBucket(id: string): Bucket | undefined {
    return this.buckets.find((bucket) => bucket.id === id)
  }

  addBucket(bucket: Omit<Bucket, "id">): Bucket {
    const newBucket: Bucket = {
      id: uuidv4(),
      ...bucket,
    }
    this.buckets.push(newBucket)

    // Добавляем запись в историю
    this.addToHistory("add", "bucket", newBucket.id, `Добавлен ковш: ${bucket.name}`)

    // Сохраняем в localStorage
    this.saveToStorage()
    return newBucket
  }

  updateBucket(id: string, bucket: Partial<Bucket>): Bucket | undefined {
    const index = this.buckets.findIndex((b) => b.id === id)
    if (index !== -1) {
      this.buckets[index] = { ...this.buckets[index], ...bucket }

      // Добавляем запись в историю
      this.addToHistory("update", "bucket", id, `Обновлен ковш: ${bucket.name || this.buckets[index].name}`)

      // Сохраняем в localStorage
      this.saveToStorage()
      return this.buckets[index]
    }
    return undefined
  }

  deleteBucket(id: string): boolean {
    const initialLength = this.buckets.length
    const bucketToDelete = this.getBucket(id)
    this.buckets = this.buckets.filter((bucket) => bucket.id !== id)
    const deleted = this.buckets.length !== initialLength

    if (deleted && bucketToDelete) {
      // Добавляем запись в историю
      this.addToHistory("delete", "bucket", id, `Удален ковш: ${bucketToDelete.name}`)

      // Сохраняем в localStorage
      this.saveToStorage()
    }

    return deleted
  }

  // Методы для работы с материалами
  getMaterials(): Material[] {
    return this.materials
  }

  getMaterial(id: string): Material | undefined {
    return this.materials.find((material) => material.id === id)
  }

  addMaterial(material: Omit<Material, "id">): Material {
    const newMaterial: Material = {
      id: uuidv4(),
      ...material,
    }
    this.materials.push(newMaterial)

    // Добавляем запись в историю
    this.addToHistory("add", "material", newMaterial.id, `Добавлен материал: ${material.name}`)

    // Сохраняем в localStorage
    this.saveToStorage()
    return newMaterial
  }

  updateMaterial(id: string, material: Partial<Material>): Material | undefined {
    const index = this.materials.findIndex((m) => m.id === id)
    if (index !== -1) {
      this.materials[index] = { ...this.materials[index], ...material }

      // Добавляем запись в историю
      this.addToHistory("update", "material", id, `Обновлен материал: ${material.name || this.materials[index].name}`)

      // Сохраняем в localStorage
      this.saveToStorage()
      return this.materials[index]
    }
    return undefined
  }

  deleteMaterial(id: string): boolean {
    const initialLength = this.materials.length
    const materialToDelete = this.getMaterial(id)
    this.materials = this.materials.filter((material) => material.id !== id)
    const deleted = this.materials.length !== initialLength

    if (deleted && materialToDelete) {
      // Добавляем запись в историю
      this.addToHistory("delete", "material", id, `Удален материал: ${materialToDelete.name}`)

      // Сохраняем в localStorage
      this.saveToStorage()
    }

    return deleted
  }

  // Методы для работы с шлаковым полем
  getSlagFieldStates(): SlagFieldState[] {
    return this.slagFieldStates
  }

  getEnrichedSlagFieldStates() {
    return this.slagFieldStates.map((state) => {
      const place = this.getPlace(state.placeId)
      const bucket = state.bucketId ? this.getBucket(state.bucketId) : undefined
      const material = state.materialId ? this.getMaterial(state.materialId) : undefined

      return {
        ...state,
        place,
        bucket,
        material,
      }
    })
  }

  placeBucket(data: {
    placeId: string
    bucketId: string
    materialId: string
    startDate: Date
    weight: number
  }): SlagFieldState {
    const { placeId, bucketId, materialId, startDate, weight } = data

    // Проверяем, что место существует
    const place = this.getPlace(placeId)
    if (!place) {
      throw new Error("Место не найдено")
    }

    // Проверяем, что ковш существует
    const bucket = this.getBucket(bucketId)
    if (!bucket) {
      throw new Error("Ковш не найден")
    }

    // Проверяем, что материал существует
    const material = this.getMaterial(materialId)
    if (!material) {
      throw new Error("Материал не найден")
    }

    // Создаем новое состояние
    const newState: SlagFieldState = {
      id: uuidv4(),
      placeId,
      bucketId,
      materialId,
      startDate,
      weight,
      status: "active",
    }

    // Добавляем состояние
    this.slagFieldStates.push(newState)

    // Добавляем запись в историю
    this.addToHistory(
        "placeBucket",
        "slagField",
        newState.id,
        `Ковш ${bucket.name} размещен на месте ${place.name || `${place.row || 0}-${place.number || 0}`}`,
    )

    // Сохраняем в localStorage
    this.saveToStorage()
    return newState
  }

  emptyBucket(data: { placeId: string; endDate: Date }): SlagFieldState | undefined {
    const { placeId, endDate } = data

    // Ищем активное состояние (endDate === null)
    const stateIndex = this.slagFieldStates.findIndex(
        (state) => state.placeId === placeId && state.endDate === null
    )

    if (stateIndex === -1) {
      throw new Error("Активное состояние не найдено")
    }

    // Обновляем состояние
    const updatedState = {
      ...this.slagFieldStates[stateIndex],
      endDate,
      state: "BucketEmptied", // Устанавливаем новое состояние
    }

    this.slagFieldStates[stateIndex] = updatedState

    // Запись в историю
    const place = this.getPlace(placeId)
    const bucket = this.getBucket(updatedState.bucketId)

    const material = this.getMaterial(updatedState.materialId)

    if (place && bucket && material) {
      // Создаем запись в истории с типом emptyBucket
      const historyRecord: HistoryRecord = {
        id: uuidv4(),
        timestamp: new Date(),
        action: "emptyBucket",
        entityType: "slagField",
        entityId: updatedState.id,
        placeId: placeId,
        placeRow: typeof place.row === "string" ? Number.parseInt(place.row) : place.row || 0,
        placeNumber: place.number || 0,
        bucketId: bucket.id,
        bucketName: bucket.name || bucket.description || "",
        materialId: material.id,
        materialName: material.name,
        weight: updatedState.weight,
        operationTime: new Date(),
        emptyTime: endDate,
        placementTime: new Date(updatedState.startDate),
        details: `Ковш ${bucket.name} опустошен на месте ${place.row}-${place.number}`,
      }

      this.userHistory.push(historyRecord)
    }
    this.saveToStorage()
    return updatedState
  }

  removeBucket(placeId: string): boolean {
    // Находим активное состояние для места
    const stateIndex = this.slagFieldStates.findIndex((state) => state.placeId === placeId && state.status === "active")

    if (stateIndex === -1) {
      return false
    }

    // Удаляем состояние
    const removedState = this.slagFieldStates.splice(stateIndex, 1)[0]

    // Добавляем запись в историю
    if (removedState) {
      const place = this.getPlace(placeId)
      const bucket = this.getBucket(removedState.bucketId)
      const material = this.getMaterial(removedState.materialId)

      if (place && bucket && material) {
        this.addToHistory(
            "removeBucket",
            "slagField",
            removedState.id,
            `Ковш ${bucket.name} удален с места ${place.name || `${place.row || 0}-${place.number || 0}`}`,
        )
      }
    }

    // Сохраняем в localStorage
    this.saveToStorage()
    return true
  }

  invalidateState(data: { placeId: string; description: string }): boolean {
    const { placeId, description } = data

    // Находим активное состояние для места
    const stateIndex = this.slagFieldStates.findIndex((state) => state.placeId === placeId && state.status === "active")

    if (stateIndex === -1) {
      return false
    }

    // Обновляем состояние
    const updatedState = {
      ...this.slagFieldStates[stateIndex],
      status: "invalid",
      description,
    }

    this.slagFieldStates[stateIndex] = updatedState

    // Добавляем запись в историю
    const place = this.getPlace(placeId)
    const bucket = this.getBucket(updatedState.bucketId)
    const material = this.getMaterial(updatedState.materialId)

    if (place && bucket && material) {
      this.addToHistory(
          "invalidateState",
          "slagField",
          updatedState.id,
          `Состояние на месте ${place.name || `${place.row || 0}-${place.number || 0}`} объявлено недействительным`,
      )
    }

    // Сохраняем в localStorage
    this.saveToStorage()
    return true
  }

  // Методы для работы с настройками материалов
  getMaterialSettings(): MaterialSetting[] {
    return this.materialSettings
  }

  getMaterialSetting(id: string): MaterialSetting | undefined {
    return this.materialSettings.find((setting) => setting.id === id)
  }

  addMaterialSetting(setting: Omit<MaterialSetting, "id">): MaterialSetting {
    const newSetting: MaterialSetting = {
      id: uuidv4(),
      ...setting,
    }
    this.materialSettings.push(newSetting)

    // Добавляем запись в историю
    this.addToHistory("add", "materialSetting", newSetting.id, `Добавлена настройка: ${setting.name}`)

    // Сохраняем в localStorage
    this.saveToStorage()
    return newSetting
  }

  updateMaterialSetting(id: string, setting: Partial<MaterialSetting>): MaterialSetting | undefined {
    const index = this.materialSettings.findIndex((s) => s.id === id)
    if (index !== -1) {
      this.materialSettings[index] = { ...this.materialSettings[index], ...setting }

      // Добавляем запись в историю
      this.addToHistory(
          "update",
          "materialSetting",
          id,
          `Обновлена настройка: ${setting.name || this.materialSettings[index].name}`,
      )

      // Сохраняем в localStorage
      this.saveToStorage()
      return this.materialSettings[index]
    }
    return undefined
  }

  deleteMaterialSetting(id: string): boolean {
    const initialLength = this.materialSettings.length
    const settingToDelete = this.getMaterialSetting(id)
    this.materialSettings = this.materialSettings.filter((setting) => setting.id !== id)
    const deleted = this.materialSettings.length !== initialLength

    if (deleted && settingToDelete) {
      // Добавляем запись в историю
      this.addToHistory("delete", "materialSetting", id, `Удалена настройка: ${settingToDelete.name}`)

      // Сохраняем в localStorage
      this.saveToStorage()
    }

    return deleted
  }

  // Инициализация данных
  /*private initializePlaces() {
    this.places = [
      {
        id: "1",
        row: 1,
        number: 1,
        name: "Место 101",
        description: "Описание места 1",
        coordinates: { x: 100, y: 100 },
        status: "available",
        isEnable: true,
      },
      {
        id: "2",
        row: 1,
        number: 2,
        name: "Место 102",
        description: "Описание места 2",
        coordinates: { x: 200, y: 100 },
        status: "available",
        isEnable: true,
      },
      {
        id: "3",
        row: 1,
        number: 3,
        name: "Место 103",
        description: "Описание места 3",
        coordinates: { x: 300, y: 100 },
        status: "available",
        isEnable: true,
      },
      {
        id: "4",
        row: 2,
        number: 1,
        name: "Место 201",
        description: "Описание места 4",
        coordinates: { x: 100, y: 200 },
        status: "available",
        isEnable: true,
      },
      {
        id: "5",
        row: 2,
        number: 2,
        name: "Место 202",
        description: "Описание места 5",
        coordinates: { x: 200, y: 200 },
        status: "available",
        isEnable: true,
      },
      {
        id: "6",
        row: 2,
        number: 3,
        name: "Место 203",
        description: "Описание места 6",
        coordinates: { x: 300, y: 200 },
        status: "available",
        isEnable: true,
      },
      {
        id: "7",
        row: 3,
        number: 1,
        name: "Место 301",
        description: "Описание места 7",
        coordinates: { x: 100, y: 300 },
        status: "available",
        isEnable: true,
      },
      {
        id: "8",
        row: 3,
        number: 2,
        name: "Место 302",
        description: "Описание места 8",
        coordinates: { x: 200, y: 300 },
        status: "available",
        isEnable: true,
      },
      {
        id: "9",
        row: 3,
        number: 3,
        name: "Место 303",
        description: "Описание места 9",
        coordinates: { x: 300, y: 300 },
        status: "available",
        isEnable: true,
      },
    ]
  }

  private initializeBuckets() {
    this.buckets = [
      {
        id: "1",
        name: "Ковш 1",
        description: "Описание ковша 1",
        capacity: 10,
        status: "available",
        isDelete: false,
      },
      {
        id: "2",
        name: "Ковш 2",
        description: "Описание ковша 2",
        capacity: 15,
        status: "available",
        isDelete: false,
      },
      {
        id: "3",
        name: "Ковш 3",
        description: "Описание ковша 3",
        capacity: 20,
        status: "available",
        isDelete: false,
      },
    ]
  }*/

  private initializeMaterials() {
    this.materials = [
      { id: "165b725b-352f-4453-a73e-f08089b333a8", name: "Шлак мартеновский", isDelete: false },
      { id: "2267c5cd-b1a6-43d6-bbd7-317f2e172553", name: "Шлак стальной", isDelete: false },
      { id: "a2c17001-1a28-4e00-8ce0-ffd31a4510b4", name: "Шлак доменный", isDelete: false },
    ]
  }

  private initializeMaterialSettings() {
    this.materialSettings = [
      {
        id: "s1",
        materialId: "2267c5cd-b1a6-43d6-bbd7-317f2e172553", // Шлак стальной
        duration: 2880, // 48 часов в минутах
        visualStateCode: "Красный",
        minHours: 0,
        maxHours: 12,
      },
      {
        id: "s2",
        materialId: "2267c5cd-b1a6-43d6-bbd7-317f2e172553", // Шлак стальной
        duration: 2880, // 48 часов в минутах
        visualStateCode: "Желтый",
        minHours: 12,
        maxHours: 24,
      },
      {
        id: "s3",
        materialId: "2267c5cd-b1a6-43d6-bbd7-317f2e172553", // Шлак стальной
        duration: 2880, // 48 часов в минутах
        visualStateCode: "Синий",
        minHours: 24,
        maxHours: 36,
      },
      {
        id: "s4",
        materialId: "2267c5cd-b1a6-43d6-bbd7-317f2e172553", // Шлак стальной
        duration: 2880, // 48 часов в минутах
        visualStateCode: "Зеленый",
        minHours: 36,
        maxHours: 48,
      },
      {
        id: "s5",
        materialId: "a2c17001-1a28-4e00-8ce0-ffd31a4510b4", // Шлак доменный
        duration: 2160, // 36 часов в минутах
        visualStateCode: "Синий",
        minHours: 0,
        maxHours: 12,
      },
      {
        id: "s6",
        materialId: "a2c17001-1a28-4e00-8ce0-ffd31a4510b4", // Шлак доменный
        duration: 2160, // 36 часов в минутах
        visualStateCode: "Желтый",
        minHours: 12,
        maxHours: 24,
      },
      {
        id: "s7",
        materialId: "a2c17001-1a28-4e00-8ce0-ffd31a4510b4", // Шлак доменный
        duration: 2160, // 36 часов в минутах
        visualStateCode: "Зеленый",
        minHours: 24,
        maxHours: 36,
      },
      {
        id: "s8",
        materialId: "165b725b-352f-4453-a73e-f08089b333a8", // Шлак мартеновский
        duration: 2160, // 36 часов в минутах
        visualStateCode: "Красный",
        minHours: 0,
        maxHours: 12,
      },
      {
        id: "s9",
        materialId: "165b725b-352f-4453-a73e-f08089b333a8", // Шлак мартеновский
        duration: 2160, // 36 часов в минутах
        visualStateCode: "Желтый",
        minHours: 12,
        maxHours: 24,
      },
      {
        id: "s10",
        materialId: "165b725b-352f-4453-a73e-f08089b333a8", // Шлак мартеновский
        duration: 2160, // 36 часов в минутах
        visualStateCode: "Зеленый",
        minHours: 24,
        maxHours: 36,
      },
    ]
  }

  // Метод для загрузки данных из localStorage
  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    try {
      // Загрузка мест
      const placesJson = localStorage.getItem(STORAGE_KEYS.PLACES)
      if (placesJson) {
        this.places = JSON.parse(placesJson)
      }

      // Загрузка ковшей
      const bucketsJson = localStorage.getItem(STORAGE_KEYS.BUCKETS)
      if (bucketsJson) {
        this.buckets = JSON.parse(bucketsJson)
      }

      // Загрузка материалов
      const materialsJson = localStorage.getItem(STORAGE_KEYS.MATERIALS)
      if (materialsJson) {
        this.materials = JSON.parse(materialsJson)
      }

      // Загрузка настроек материалов
      const materialSettingsJson = localStorage.getItem(STORAGE_KEYS.MATERIAL_SETTINGS)
      if (materialSettingsJson) {
        this.materialSettings = JSON.parse(materialSettingsJson)
      }

      // Загрузка состояний шлакового поля
      const statesJson = localStorage.getItem(STORAGE_KEYS.SLAG_FIELD_STATES)
      if (statesJson) {
        this.slagFieldStates = JSON.parse(statesJson)
      }

      // Загрузка истории действий пользователя
      const historyJson = localStorage.getItem(STORAGE_KEYS.USER_HISTORY)
      if (historyJson) {
        this.userHistory = JSON.parse(historyJson)
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных из localStorage:", error)
      // В случае ошибки используем начальные данные
      this.resetToInitialData()
    }
  }

  // Метод для сохранения данных в localStorage
  private saveToStorage(): void {
    if (typeof window === "undefined") return

    try {
      // Сохранение мест
      localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(this.places))

      // Сохранение ковшей
      localStorage.setItem(STORAGE_KEYS.BUCKETS, JSON.stringify(this.buckets))

      // Сохранение материалов
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(this.materials))

      // Сохранение настроек материалов
      localStorage.setItem(STORAGE_KEYS.MATERIAL_SETTINGS, JSON.stringify(this.materialSettings))

      // Сохранение состояний шлакового поля
      localStorage.setItem(STORAGE_KEYS.SLAG_FIELD_STATES, JSON.stringify(this.slagFieldStates))

      // Сохранение истории действий пользователя
      localStorage.setItem(STORAGE_KEYS.USER_HISTORY, JSON.stringify(this.userHistory))
    } catch (error) {
      console.error("Ошибка при сохранении данных в localStorage:", error)
    }
  }

  // Методы для работы с историей
  private addToHistory(action: string, entityType: string, entityId?: string, details?: string): HistoryRecord {
    const historyRecord: HistoryRecord = {
      id: uuidv4(),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date(),
      operationTime: new Date(),
    }

    this.userHistory.push(historyRecord)
    this.saveToStorage()
    return historyRecord
  }

  public getUserHistory(): HistoryRecord[] {
    return [...this.userHistory]
  }

  // Метод для сброса данных к начальным
  public resetToInitialData(): void {
    //this.initializePlaces()
    //this.initializeBuckets()
    this.initializeMaterials()
    this.initializeMaterialSettings()
    this.userHistory = []
    this.saveToStorage()
  }
}

// Создаем экземпляр хранилища данных
export const dataStore = new DataStore()

// Экспортируем методы для работы с настройками материалов
export const addMaterialSetting = dataStore.addMaterialSetting.bind(dataStore)
export const updateMaterialSetting = dataStore.updateMaterialSetting.bind(dataStore)

// Action to add user action
export const addUserAction = (action: string, entityType: string, entityId?: string, details?: string) => {
  dataStore.addToHistory(action, entityType, entityId, details)
}
