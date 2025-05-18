import { axiosApi } from "./network-utils"
import type { SlagFieldPlace, Bucket, SlagFieldState } from "./types"

// API для работы с местами
export const PlacesApi = {
    // Получение всех мест
    getAll: async (): Promise<SlagFieldPlace[]> => {
        return axiosApi<SlagFieldPlace[]>("/slagfieldplaces")
    },

    // Получение места по ID
    getById: async (id: string): Promise<SlagFieldPlace> => {
        return axiosApi<SlagFieldPlace>(`/slagfieldplaces/${id}`)
    },

    // Создание нового места
    create: async (place: Omit<SlagFieldPlace, "id">): Promise<SlagFieldPlace> => {
        // Преобразуем данные в формат, ожидаемый бэкендом
        const placeData = {
            row: place.row?.toString() || "0", // Преобразуем number в string
            number: place.number || 0,
            isEnable: place.isEnable !== undefined ? place.isEnable : true,
        }

        return axiosApi<SlagFieldPlace>("/slagfieldplaces", "POST", placeData)
    },

    // Обновление места
    update: async (id: string, place: Partial<SlagFieldPlace>): Promise<SlagFieldPlace> => {
        // Преобразуем данные в формат, ожидаемый бэкендом
        const placeData: any = {}

        if (place.row !== undefined) {
            placeData.row = place.row.toString()
        }

        if (place.number !== undefined) {
            placeData.number = place.number
        }

        if (place.isEnable !== undefined) {
            placeData.isEnable = place.isEnable
        }

        return axiosApi<SlagFieldPlace>(`/slagfieldplaces/${id}`, "PUT", placeData)
    },

    // Удаление места
    delete: async (id: string): Promise<boolean> => {
        await axiosApi(`/slagfieldplaces/${id}`, "DELETE")
        return true
    },

    // Отметить место как используемое
    wentInUse: async (id: string): Promise<boolean> => {
        await axiosApi<any>(`/slagfield/places/${id}/went-in-use`, "POST")
        return true
    },

    // Отметить место как неиспользуемое
    outOfUse: async (id: string): Promise<boolean> => {
        await axiosApi<any>(`/slagfield/places/${id}/out-of-use`, "POST")
        return true
    },
}

// API для работы с ковшами
export const BucketsApi = {
    // Получение всех ковшей
    getAll: async (): Promise<Bucket[]> => {
        return axiosApi<Bucket[]>("/buckets")
    },

    // Получение ковша по ID
    getById: async (id: string): Promise<Bucket> => {
        return axiosApi<Bucket>(`/buckets/${id}`)
    },

    // Создание нового ковша
    create: async (bucket: Omit<Bucket, "id">): Promise<Bucket> => {
        // Преобразуем данные в формат, ожидаемый бэкендом
        const bucketData = {
            description: bucket.name, // Используем name как description согласно API
            isDelete: false,
        }

        return axiosApi<Bucket>("/buckets", "POST", bucketData)
    },

    // Обновление ковша
    update: async (id: string, bucket: Partial<Bucket>): Promise<Bucket> => {
        // Преобразуем данные в формат, ожидаемый бэкендом
        const bucketData: any = {}

        if (bucket.name !== undefined) {
            bucketData.description = bucket.name // Используем name как description согласно API
        }

        if (bucket.isDelete !== undefined) {
            bucketData.isDelete = bucket.isDelete
        }

        return axiosApi<Bucket>(`/buckets/${id}`, "PUT", bucketData)
    },

    // Удаление ковша
    delete: async (id: string): Promise<boolean> => {
        await axiosApi(`/buckets/${id}`, "DELETE")
        return true
    },
}

// API для работы с шлаковым полем
export const SlagFieldApi = {
    // Получить текущее состояние шлакового поля
    getCurrentState: async (): Promise<SlagFieldState[]> => {
        return axiosApi<SlagFieldState[]>("/slagfield/state")
    },

    // Получить состояние шлакового поля на определенный момент времени
    getStateSnapshot: async (timestamp: Date): Promise<SlagFieldState[]> => {
        return axiosApi<SlagFieldState[]>(`/slagfield/state/snapshot?timestamp=${timestamp.toISOString()}`)
    },

    // Установить ковш
    placeBucket: async (
        placeId: string,
        data: {
            bucketId: string
            materialId: string
            slagWeight: number
            startDate: Date
        },
    ): Promise<boolean> => {
        await axiosApi<any>(`/slagfield/places/${placeId}/place-bucket`, "POST", data)
        return true
    },

    // Опорожнить ковш
    emptyBucket: async (
        placeId: string,
        data: {
            endDate: Date
        },
    ): Promise<boolean> => {
        await axiosApi<any>(`/slagfield/places/${placeId}/empty-bucket`, "POST", data)
        return true
    },

    // Убрать ковш
    removeBucket: async (placeId: string): Promise<boolean> => {
        await axiosApi<any>(`/slagfield/places/${placeId}/remove-bucket`, "POST")
        return true
    },

    // Очистить/Ошибка (Invalid)
    markInvalid: async (
        placeId: string,
        data: {
            description: string
        },
    ): Promise<boolean> => {
        await axiosApi<any>(`/slagfield/places/${placeId}/invalid`, "POST", data)
        return true
    },
}
