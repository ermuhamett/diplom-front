import axios from "axios"

// Базовый URL API
const API_BASE_URL = "https://localhost:7157/api"

/**
 * Функция для выполнения HTTP-запросов с использованием axios
 * @param endpoint - конечная точка API
 * @param method - HTTP-метод (GET, POST, PUT, DELETE)
 * @param data - данные для отправки (для POST, PUT)
 * @returns - результат запроса
 */
export async function axiosApi<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any,
): Promise<T> {
    try {
        const url = `${API_BASE_URL}${endpoint}`

        const config = {
            method,
            url,
            data,
            headers: {
                "Content-Type": "application/json",
            },
        }

        const response = await axios(config)

        // Проверяем, есть ли в ответе поле "value" (для GET запросов)
        if (response.data && response.data.value !== undefined) {
            return response.data.value as T
        }

        return response.data as T
    } catch (error) {
        console.error(`API Error (${method} ${endpoint}):`, error)
        throw error
    }
}

/**
 * Функция для обратной совместимости с fetch
 * @param endpoint - конечная точка API
 * @param method - HTTP-метод (GET, POST, PUT, DELETE)
 * @param data - данные для отправки (для POST, PUT)
 * @returns - результат запроса
 */
export async function fetchApi<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any,
): Promise<T> {
    return axiosApi<T>(endpoint, method, data)
}
