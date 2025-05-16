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

// Обновляем начальные данные, меняя формат поля row с "Ряд X" на числовой формат
const INITIAL_DATA = {
  places: [
    { id: "1", row: 1, number: 1, isEnable: true },
    { id: "2", row: 1, number: 2, isEnable: true },
    { id: "3", row: 1, number: 3, isEnable: true },
    { id: "4", row: 1, number: 4, isEnable: false },
    { id: "5", row: 1, number: 5, isEnable: true },

    { id: "21", row: 2, number: 1, isEnable: true },
    { id: "22", row: 2, number: 2, isEnable: false },
    { id: "23", row: 2, number: 3, isEnable: true },
    { id: "24", row: 2, number: 4, isEnable: true },
    { id: "25", row: 2, number: 5, isEnable: true },
  ],
  buckets: [
    { id: "b1", name: "Ковш 114", isDelete: false },
    { id: "b2", name: "Ковш 115", isDelete: false },
    { id: "b3", name: "Ковш 116", isDelete: false },
    { id: "b4", name: "Ковш 117", isDelete: false },
  ],
  materials: [
    { id: "m1", name: "Шлак стальной", isDelete: false },
    { id: "m2", name: "Шлак доменный", isDelete: false },
    { id: "m3", name: "Шлак мартеновский", isDelete: false },
  ],
  materialSettings: [
    {
      id: "s1",
      materialId: "m1",
      duration: 2880, // 48 часов в минутах
      visualStateCode: "Красный",
      minHours: 0,
      maxHours: 12,
    },
    {
      id: "s2",
      materialId: "m1",
      duration: 2880, // 48 часов в минутах
      visualStateCode: "Желтый",
      minHours: 12,
      maxHours: 24,
    },
    {
      id: "s3",
      materialId: "m1",
      duration: 2880, // 48 часов в минутах
      visualStateCode: "Синий",
      minHours: 24,
      maxHours: 36,
    },
    {
      id: "s4",
      materialId: "m1",
      duration: 2880, // 48 часов в минутах
      visualStateCode: "Зеленый",
      minHours: 36,
      maxHours: 48,
    },
    {
      id: "s5",
      materialId: "m2",
      duration: 2160, // 36 часов в минутах
      visualStateCode: "Синий",
      minHours: 0,
      maxHours: 12,
    },
    {
      id: "s6",
      materialId: "m2",
      duration: 2160, // 36 часов в минутах
      visualStateCode: "Желтый",
      minHours: 12,
      maxHours: 24,
    },
    {
      id: "s7",
      materialId: "m2",
      duration: 2160, // 36 часов в минутах
      visualStateCode: "Зеленый",
      minHours: 24,
      maxHours: 36,
    },
  ],
  slagFieldStates: [
    {
      id: "1",
      placeId: "1", // Ряд 1, номер 1
      state: "BucketPlaced",
      bucketId: "b1",
      materialId: "m1",
      startDate: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 часов назад (Красный)
      endDate: null,
      weight: 5250,
    },
    {
      id: "2",
      placeId: "3", // Ряд 1, номер 3
      state: "BucketPlaced",
      bucketId: "b2",
      materialId: "m1",
      startDate: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 часов назад (Желтый)
      endDate: null,
      weight: 4800,
    },
    {
      id: "3",
      placeId: "5", // Ряд 1, номер 5
      state: "BucketPlaced",
      bucketId: "b3",
      materialId: "m1",
      startDate: new Date(Date.now() - 3600000 * 30).toISOString(), // 30 часов назад (Синий)
      endDate: null,
      weight: 5100,
    },
    {
      id: "4",
      placeId: "21", // Ряд 2, номер 1
      state: "BucketPlaced",
      bucketId: "b4",
      materialId: "m1",
      startDate: new Date(Date.now() - 3600000 * 49).toISOString(), // 42 часа назад (Зеленый)
      endDate: null,
      weight: 4950,
    },
  ],
}

// В класс DataStore добавим новое приватное поле для истории
class DataStore {
  private places: SlagFieldPlace[] = []
  private buckets: Bucket[] = []
  private materials: Material[] = []
  private materialSettings: MaterialSetting[] = []
  private slagFieldStates: SlagFieldState[] = []
  private userHistory: HistoryRecord[] = [] // Новое поле для истории
  private static instance: DataStore | null = null

  // Приватный конструктор для паттерна Singleton
  private constructor() {
    this.loadFromStorage()
  }

  // Метод для получения экземпляра класса
  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore()
    }
    return DataStore.instance
  }

  // В метод loadFromStorage добавим загрузку истории
  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    try {
      // Загрузка мест
      const placesJson = localStorage.getItem(STORAGE_KEYS.PLACES)
      this.places = placesJson ? JSON.parse(placesJson) : INITIAL_DATA.places

      // Загрузка ковшей
      const bucketsJson = localStorage.getItem(STORAGE_KEYS.BUCKETS)
      this.buckets = bucketsJson ? JSON.parse(bucketsJson) : INITIAL_DATA.buckets

      // Загрузка материалов
      const materialsJson = localStorage.getItem(STORAGE_KEYS.MATERIALS)
      this.materials = materialsJson ? JSON.parse(materialsJson) : INITIAL_DATA.materials

      // Загрузка настроек материалов
      const materialSettingsJson = localStorage.getItem(STORAGE_KEYS.MATERIAL_SETTINGS)
      this.materialSettings = materialSettingsJson ? JSON.parse(materialSettingsJson) : INITIAL_DATA.materialSettings

      // Загрузка состояний шлакового поля
      const statesJson = localStorage.getItem(STORAGE_KEYS.SLAG_FIELD_STATES)
      const parsedStates = statesJson ? JSON.parse(statesJson) : INITIAL_DATA.slagFieldStates

      // Преобразование строковых дат в объекты Date
      this.slagFieldStates = parsedStates.map((state: any) => ({
        ...state,
        startDate: state.startDate ? new Date(state.startDate) : null,
        endDate: state.endDate ? new Date(state.endDate) : null,
      }))

      // Загрузка истории действий пользователя
      const historyJson = localStorage.getItem(STORAGE_KEYS.USER_HISTORY)
      const parsedHistory = historyJson ? JSON.parse(historyJson) : []

      // Преобразование строковых дат в объекты Date
      this.userHistory = parsedHistory.map((record: any) => {
        // Преобразуем все поля с датами в объекты Date
        const processedRecord = { ...record }

        if (record.timestamp) processedRecord.timestamp = new Date(record.timestamp)
        if (record.operationTime) processedRecord.operationTime = new Date(record.operationTime)
        if (record.placementTime) processedRecord.placementTime = new Date(record.placementTime)
        if (record.emptyTime) processedRecord.emptyTime = new Date(record.emptyTime)

        return processedRecord
      })
    } catch (error) {
      console.error("Ошибка при загрузке данных из localStorage:", error)
      // В случае ошибки используем начальные данные
      this.resetToInitialData()
    }
  }

  // В метод saveToStorage добавим сохранение истории
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

  // Генерация уникального ID
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9)
  }

  // Методы для работы с историей
  public addToHistory(action: string, entityType: string, entityId?: string, details?: string): HistoryRecord {
    const historyRecord: HistoryRecord = {
      id: this.generateId(),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date(),
      operationTime: new Date(),
    }

    // Если это операция изменения состояния места, добавим дополнительные данные
    if ((action === "enablePlace" || action === "disablePlace") && entityType === "place" && entityId) {
      const place = this.getPlace(entityId)
      if (place) {
        historyRecord.placeId = place.id
        historyRecord.placeRow = place.row
        historyRecord.placeNumber = place.number
      }
    }

    this.userHistory.push(historyRecord)
    this.saveToStorage()
    return historyRecord
  }

  // Добавим метод для получения истории
  public getUserHistory(): HistoryRecord[] {
    return [...this.userHistory]
  }

  // В метод resetToInitialData добавим сброс истории
  public resetToInitialData(): void {
    this.places = [...INITIAL_DATA.places]
    this.buckets = [...INITIAL_DATA.buckets]
    this.materials = [...INITIAL_DATA.materials]
    this.materialSettings = [...INITIAL_DATA.materialSettings]
    this.slagFieldStates = INITIAL_DATA.slagFieldStates.map((state) => ({
      ...state,
      startDate: state.startDate ? new Date(state.startDate) : null,
      endDate: state.endDate ? new Date(state.endDate) : null,
    }))
    this.userHistory = []
    this.saveToStorage()
  }

  // CRUD операции для мест
  public getPlaces(): SlagFieldPlace[] {
    return [...this.places]
  }

  public getPlace(id: string): SlagFieldPlace | undefined {
    return this.places.find((place) => place.id === id)
  }

  // Модифицируем методы CRUD для записи в историю
  // Например, для addPlace:
  public addPlace(place: Omit<SlagFieldPlace, "id">): SlagFieldPlace {
    const newPlace: SlagFieldPlace = {
      ...place,
      id: this.generateId(),
    }
    this.places.push(newPlace)

    // Добавляем запись в историю
    this.addToHistory("add", "place", newPlace.id, `Добавлено место: Ряд ${place.row}, Номер ${place.number}`)

    this.saveToStorage()
    return newPlace
  }

  // Аналогично модифицируем updatePlace
  public updatePlace(id: string, place: Partial<SlagFieldPlace>): SlagFieldPlace | null {
    const index = this.places.findIndex((p) => p.id === id)
    if (index === -1) return null

    const oldPlace = this.places[index]
    const updatedPlace = { ...oldPlace, ...place }
    this.places[index] = updatedPlace

    // Не добавляем запись в историю здесь, так как это будет делаться явно в handleWentInUse и handleOutOfUse
    // Добавляем запись только если это не изменение isEnable
    if (place.isEnable === undefined) {
      this.addToHistory("update", "place", id, `Обновлено место: Ряд ${updatedPlace.row}, Номер ${updatedPlace.number}`)
    }

    this.saveToStorage()
    return updatedPlace
  }

  // И для deletePlace
  public deletePlace(id: string): boolean {
    const place = this.getPlace(id)
    if (!place) return false

    const initialLength = this.places.length
    this.places = this.places.filter((place) => place.id !== id)
    const deleted = initialLength > this.places.length

    if (deleted) {
      // Добавляем запись в историю
      this.addToHistory("delete", "place", id, `Удалено место: Ряд ${place.row}, Номер ${place.number}`)

      this.saveToStorage()
    }

    return deleted
  }

  // CRUD операции для ковшей
  public getBuckets(): Bucket[] {
    return this.buckets.filter((bucket) => !bucket.isDelete)
  }

  public getAllBuckets(): Bucket[] {
    return [...this.buckets]
  }

  public getBucket(id: string): Bucket | undefined {
    return this.buckets.find((bucket) => bucket.id === id)
  }

  // Аналогично для операций с ковшами
  public addBucket(bucket: Omit<Bucket, "id">): Bucket {
    const newBucket: Bucket = {
      ...bucket,
      id: this.generateId(),
    }
    this.buckets.push(newBucket)

    // Добавляем запись в историю
    this.addToHistory("add", "bucket", newBucket.id, `Добавлен ковш: ${bucket.name}`)

    this.saveToStorage()
    return newBucket
  }

  public updateBucket(id: string, bucket: Partial<Bucket>): Bucket | null {
    const index = this.buckets.findIndex((b) => b.id === id)
    if (index === -1) return null

    const oldBucket = this.buckets[index]
    const updatedBucket = { ...oldBucket, ...bucket }
    this.buckets[index] = updatedBucket

    // Добавляем запись в историю
    this.addToHistory("update", "bucket", id, `Обновлен ковш: ${updatedBucket.name}`)

    this.saveToStorage()
    return updatedBucket
  }

  public deleteBucket(id: string): boolean {
    const bucket = this.buckets.find((b) => b.id === id)
    if (!bucket) return false

    bucket.isDelete = true

    // Добавляем запись в историю
    this.addToHistory("delete", "bucket", id, `Удален ковш: ${bucket.name}`)

    this.saveToStorage()
    return true
  }

  // CRUD операции для материалов
  public getMaterials(): Material[] {
    return this.materials.filter((material) => !material.isDelete)
  }

  public getAllMaterials(): Material[] {
    return [...this.materials]
  }

  public getMaterial(id: string): Material | undefined {
    return this.materials.find((material) => material.id === id)
  }

  // И для операций с материалами
  public addMaterial(material: Omit<Material, "id">): Material {
    const newMaterial: Material = {
      ...material,
      id: this.generateId(),
    }
    this.materials.push(newMaterial)

    // Добавляем запись в историю
    this.addToHistory("add", "material", newMaterial.id, `Добавлен материал: ${material.name}`)

    this.saveToStorage()
    return newMaterial
  }

  public updateMaterial(id: string, material: Partial<Material>): Material | null {
    const index = this.materials.findIndex((m) => m.id === id)
    if (index === -1) return null

    const oldMaterial = this.materials[index]
    const updatedMaterial = { ...oldMaterial, ...material }
    this.materials[index] = updatedMaterial

    // Добавляем запись в историю
    this.addToHistory("update", "material", id, `Обновлен материал: ${updatedMaterial.name}`)

    this.saveToStorage()
    return updatedMaterial
  }

  public deleteMaterial(id: string): boolean {
    const material = this.materials.find((m) => m.id === id)
    if (!material) return false

    material.isDelete = true

    // Добавляем запись в историю
    this.addToHistory("delete", "material", id, `Удален материал: ${material.name}`)

    this.saveToStorage()
    return true
  }

  // CRUD операции для настроек материалов
  public getMaterialSettings(): MaterialSetting[] {
    return [...this.materialSettings]
  }

  public getMaterialSetting(id: string): MaterialSetting | undefined {
    return this.materialSettings.find((setting) => setting.id === id)
  }

  public getMaterialSettingByMaterialId(materialId: string): MaterialSetting | undefined {
    return this.materialSettings.find((setting) => setting.materialId === materialId)
  }

  // Добавляем недостающие методы для настроек материалов
  public addMaterialSetting(setting: Omit<MaterialSetting, "id">): MaterialSetting {
    const newSetting: MaterialSetting = {
      ...setting,
      id: this.generateId(),
    }
    this.materialSettings.push(newSetting)

    // Получаем информацию о материале для записи в историю
    const material = this.getMaterial(setting.materialId)

    // Добавляем запись в историю
    this.addToHistory(
      "add",
      "materialSetting",
      newSetting.id,
      `Добавлена настройка для материала: ${material?.name || setting.materialId}`,
    )

    this.saveToStorage()
    return newSetting
  }

  public updateMaterialSetting(id: string, setting: Partial<MaterialSetting>): MaterialSetting | null {
    const index = this.materialSettings.findIndex((s) => s.id === id)
    if (index === -1) return null

    const oldSetting = this.materialSettings[index]
    const updatedSetting = { ...oldSetting, ...setting }
    this.materialSettings[index] = updatedSetting

    // Получаем информацию о материале для записи в историю
    const material = this.getMaterial(updatedSetting.materialId)

    // Добавляем запись в историю
    this.addToHistory(
      "update",
      "materialSetting",
      id,
      `Обновлена настройка для материала: ${material?.name || updatedSetting.materialId}`,
    )

    this.saveToStorage()
    return updatedSetting
  }

  public deleteMaterialSetting(id: string): boolean {
    const setting = this.materialSettings.find((s) => s.id === id)
    if (!setting) return false

    // Получаем информацию о материале для записи в историю
    const material = this.getMaterial(setting.materialId)

    const initialLength = this.materialSettings.length
    this.materialSettings = this.materialSettings.filter((setting) => setting.id !== id)
    const deleted = initialLength > this.materialSettings.length

    if (deleted) {
      // Добавляем запись в историю
      this.addToHistory(
        "delete",
        "materialSetting",
        id,
        `Удалена настройка для материала: ${material?.name || setting.materialId}`,
      )

      this.saveToStorage()
    }
    return deleted
  }

  // CRUD операции для состояний шлакового поля
  public getSlagFieldStates(): SlagFieldState[] {
    return [...this.slagFieldStates]
  }

  public getActiveSlagFieldStates(): SlagFieldState[] {
    return this.slagFieldStates.filter((state) => state.endDate === null)
  }

  public getSlagFieldState(id: string): SlagFieldState | undefined {
    return this.slagFieldStates.find((state) => state.id === id)
  }

  public getSlagFieldStateByPlaceId(placeId: string): SlagFieldState | undefined {
    return this.slagFieldStates.find((state) => state.placeId === placeId && state.endDate === null)
  }

  public addSlagFieldState(state: Omit<SlagFieldState, "id">): SlagFieldState {
    const newState: SlagFieldState = {
      ...state,
      id: this.generateId(),
    }
    this.slagFieldStates.push(newState)
    this.saveToStorage()
    return newState
  }

  public updateSlagFieldState(id: string, state: Partial<SlagFieldState>): SlagFieldState | null {
    const index = this.slagFieldStates.findIndex((s) => s.id === id)
    if (index === -1) return null

    const updatedState = { ...this.slagFieldStates[index], ...state }
    this.slagFieldStates[index] = updatedState
    this.saveToStorage()
    return updatedState
  }

  public deleteSlagFieldState(id: string): boolean {
    const initialLength = this.slagFieldStates.length
    this.slagFieldStates = this.slagFieldStates.filter((state) => state.id !== id)
    const deleted = initialLength > this.slagFieldStates.length
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  // Для операций с шлаковым полем
  public placeBucket(data: {
    placeId: string
    bucketId: string
    materialId: string
    startDate: Date
    weight: number
  }): SlagFieldState | null {
    // Проверяем, что место существует и доступно
    const place = this.getPlace(data.placeId)
    if (!place || !place.isEnable) return null

    // Проверяем, что на месте нет активного ковша
    const existingState = this.getSlagFieldStateByPlaceId(data.placeId)
    if (existingState) return null

    // Создаем новое состояние
    const newState = this.addSlagFieldState({
      placeId: data.placeId,
      state: "BucketPlaced",
      bucketId: data.bucketId,
      materialId: data.materialId,
      startDate: data.startDate,
      endDate: null,
      weight: data.weight,
    })

    // Получаем информацию о ковше и материале для записи в историю
    const bucket = this.getBucket(data.bucketId)
    const material = this.getMaterial(data.materialId)

    // Добавляем только одну детальную запись в историю
    const historyRecord: HistoryRecord = {
      id: this.generateId(),
      timestamp: new Date(),
      action: "placeBucket",
      entityType: "slagField",
      placeId: data.placeId,
      placeRow: place.row,
      placeNumber: place.number,
      bucketId: data.bucketId,
      bucketName: bucket?.name || "Неизвестный ковш",
      materialId: data.materialId,
      materialName: material?.name || "Неизвестный материал",
      weight: data.weight,
      operationTime: new Date(),
      placementTime: data.startDate,
    }

    this.userHistory.push(historyRecord)
    this.saveToStorage()

    return newState
  }

  // Обновляем метод emptyBucket, чтобы сохранять вес в истории
  public emptyBucket(data: { placeId: string; endDate: Date }): SlagFieldState | null {
    // Находим активное состояние для места
    const state = this.getSlagFieldStateByPlaceId(data.placeId)
    if (!state || state.state !== "BucketPlaced") return null

    // Обновляем состояние
    const updatedState = this.updateSlagFieldState(state.id, {
      state: "BucketEmptied",
      endDate: data.endDate,
    })

    // Получаем информацию о месте и ковше для записи в историю
    const place = this.getPlace(data.placeId)
    const bucket = this.getBucket(state.bucketId)
    const material = this.getMaterial(state.materialId)

    if (place && updatedState) {
      // Добавляем запись в историю в структурированном виде
      const historyRecord: HistoryRecord = {
        id: this.generateId(),
        timestamp: new Date(),
        action: "emptyBucket",
        entityType: "slagField",
        placeId: data.placeId,
        placeRow: place.row,
        placeNumber: place.number,
        bucketId: state.bucketId,
        bucketName: bucket?.name || "Неизвестный ковш",
        materialId: state.materialId,
        materialName: material?.name || "Неизвестный материал",
        weight: state.weight, // Сохраняем вес из состояния
        operationTime: new Date(),
        emptyTime: data.endDate,
        placementTime: state.startDate,
      }

      this.userHistory.push(historyRecord)
      this.saveToStorage()
    }

    return updatedState
  }

  // Обновляем метод removeBucket, чтобы сохранять вес в истории
  public removeBucket(placeId: string): boolean {
    // Находим активное состояние для места
    const state = this.getSlagFieldStateByPlaceId(placeId)
    if (!state || state.state !== "BucketEmptied") return false

    // Получаем информацию о месте и ковше для записи в историю
    const place = this.getPlace(placeId)
    const bucket = this.getBucket(state.bucketId)
    const material = this.getMaterial(state.materialId)

    if (place) {
      // Добавляем запись в историю в структурированном виде
      const historyRecord: HistoryRecord = {
        id: this.generateId(),
        timestamp: new Date(),
        action: "removeBucket",
        entityType: "slagField",
        placeId: placeId,
        placeRow: place.row,
        placeNumber: place.number,
        bucketId: state.bucketId,
        bucketName: bucket?.name || "Неизвестный ковш",
        materialId: state.materialId,
        materialName: material?.name || "Неизвестный материал",
        weight: state.weight, // Сохраняем вес из состояния
        operationTime: new Date(),
        placementTime: state.startDate,
        emptyTime: state.endDate,
      }

      this.userHistory.push(historyRecord)
      this.saveToStorage()
    }

    // Удаляем состояние
    return this.deleteSlagFieldState(state.id)
  }

  // Обновляем метод invalidateState, чтобы сохранять вес в истории
  public invalidateState(data: { placeId: string; description: string }): boolean {
    // Находим активное состояние для места
    const state = this.getSlagFieldStateByPlaceId(data.placeId)
    if (!state) return false

    // Получаем информацию о месте для записи в историю
    const place = this.getPlace(data.placeId)
    const bucket = this.getBucket(state.bucketId)
    const material = this.getMaterial(state.materialId)

    if (place) {
      // Добавляем запись в историю в структурированном виде
      const historyRecord: HistoryRecord = {
        id: this.generateId(),
        timestamp: new Date(),
        action: "invalidateState",
        entityType: "slagField",
        placeId: data.placeId,
        placeRow: place.row,
        placeNumber: place.number,
        bucketId: state.bucketId,
        bucketName: bucket?.name || "Неизвестный ковш",
        materialId: state.materialId,
        materialName: material?.name || "Неизвестный материал",
        weight: state.weight, // Сохраняем вес из состояния
        operationTime: new Date(),
        placementTime: state.startDate,
        reason: data.description,
      }

      this.userHistory.push(historyRecord)
      this.saveToStorage()
    }

    // Удаляем состояние
    return this.deleteSlagFieldState(state.id)
  }

  // Получение расширенных данных о состояниях с информацией о ковшах и материалах
  public getEnrichedSlagFieldStates(): (SlagFieldState & { bucketDescription?: string; materialName?: string })[] {
    return this.slagFieldStates.map((state) => {
      const bucket = this.getBucket(state.bucketId)
      const material = this.getMaterial(state.materialId)

      return {
        ...state,
        bucketDescription: bucket?.name,
        materialName: material?.name,
      }
    })
  }
}

// Экспортируем экземпляр класса
export const dataStore = DataStore.getInstance()

// Экспортируем методы для работы с настройками материалов
export const addMaterialSetting = dataStore.addMaterialSetting.bind(dataStore)
export const updateMaterialSetting = dataStore.updateMaterialSetting.bind(dataStore)

// Action to add user action
export const addUserAction = (action: string, entityType: string, entityId?: string, details?: string) => {
  dataStore.addToHistory(action, entityType, entityId, details)
}
