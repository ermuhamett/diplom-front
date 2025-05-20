// lib/hooks/usePlaces.ts
import { useQuery } from "@tanstack/react-query"
import { PlacesApi } from "@/lib/api-service"
import type { SlagFieldPlace } from "@/lib/types"   // где описан интерфейс места

export function usePlaces() {
    return useQuery<SlagFieldPlace[], Error>({
        // 1) explicit key
        queryKey: ["places"],
        // 2) fetcher
        queryFn: () => PlacesApi.getAll(),
        // 3) never go stale or refetch on remount/focus
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    })
}
