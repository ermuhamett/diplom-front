export interface SlagFieldPlace {
  id: string
  row?: number | string
  number?: number
  isEnable?: boolean
  name?: string
  description?: string
  coordinates?: { x: number; y: number }
  status?: string
  isDelete?: boolean
  events?: any[]
}

export interface Bucket {
  id: string
  name?: string
  description?: string
  isDelete?: boolean
  capacity?: number
  status?: string
}

export interface Material {
  id: string
  name: string
  isDelete: boolean
  description?: string
  type?: string
}

export interface MaterialSetting {
  id: string
  materialId: string
  duration: number
  visualStateCode: string
  minHours?: number
  maxHours?: number
  name?: string
  description?: string
  minTemperature?: number
  maxTemperature?: number
  minWeight?: number
  maxWeight?: number
}

export interface SlagFieldState {
  id: string
  placeId: string
  state?: "BucketPlaced" | "BucketEmptied" | "BucketRemoved" | "Invalid"
  bucketId: string
  materialId: string
  startDate: Date
  endDate: Date | null
  weight: number
  status?: string
  description?: string
  bucketDescription?: string
  materialName?: string
  place?: SlagFieldPlace
  bucket?: Bucket
  material?: Material
  slagWeight?: number
}

// Базовая запись истории
export interface BaseHistoryRecord {
  id: string
  timestamp: Date
  action: string
  entityType: string
  entityId?: string
  details?: string
}

// Запись истории для установки ковша
export interface PlaceBucketHistoryRecord extends BaseHistoryRecord {
  action: "placeBucket"
  placeId: string
  placeRow: number
  placeNumber: number
  bucketId: string
  bucketName: string
  materialId: string
  materialName: string
  weight: number
  operationTime: Date
  placementTime: Date
}

// Запись истории для опорожнения ковша
export interface EmptyBucketHistoryRecord extends BaseHistoryRecord {
  action: "emptyBucket"
  placeId: string
  placeRow: number
  placeNumber: number
  bucketId: string
  bucketName: string
  materialId: string
  materialName: string
  operationTime: Date
  emptyTime: Date
  placementTime: Date
}

// Запись истории для удаления ковша
export interface RemoveBucketHistoryRecord extends BaseHistoryRecord {
  action: "removeBucket"
  placeId: string
  placeRow: number
  placeNumber: number
  bucketId: string
  bucketName: string
  materialId: string
  materialName: string
  operationTime: Date
  placementTime: Date
}

// Запись истории для очистки состояния
export interface InvalidateStateHistoryRecord extends BaseHistoryRecord {
  action: "invalidateState"
  placeId: string
  placeRow: number
  placeNumber: number
  bucketId: string
  bucketName: string
  materialId: string
  materialName: string
  operationTime: Date
  placementTime: Date
  reason: string
}

// Запись истории для изменения статуса места
export interface PlaceStatusHistoryRecord extends BaseHistoryRecord {
  action: "enablePlace" | "disablePlace"
  placeId: string
  placeRow: number
  placeNumber: number
  operationTime: Date
}

// Объединенный тип для всех записей истории
export type HistoryRecord =
    | BaseHistoryRecord
    | PlaceBucketHistoryRecord
    | EmptyBucketHistoryRecord
    | RemoveBucketHistoryRecord
    | InvalidateStateHistoryRecord
    | PlaceStatusHistoryRecord
