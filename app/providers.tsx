"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Держим данные в кеше 5 минут
            staleTime: 1000 * 60 * 5,
            // Будем хранить старые данные до завершения нового запроса
            keepPreviousData: true,
            // Отключаем автоматический перезапрос при фокусе окна
            refetchOnWindowFocus: false,
        },
    },
})

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
