// lib/hooks/useHistory.ts
import { useQuery } from "@tanstack/react-query"
import { SlagFieldApi } from "@/lib/api-service"
import type { RawHistoryEvent } from "@/lib/types"

export function useHistory(date?: string) {
    return useQuery<RawHistoryEvent[], Error>({
        queryKey: ["history", date],
        queryFn: async () => {
            if (!date) return []
            const dt = new Date(date)
            dt.setHours(0, 0, 0, 0)
            const raw = await SlagFieldApi.getStateSnapshot(dt)
            return raw
                .map(e => ({
                    ...e,
                    timestamp: new Date(e.timestamp),
                    clientStartDate: e.clientStartDate   ? new Date(e.clientStartDate)   : undefined,
                    bucketEmptiedTime:e.bucketEmptiedTime? new Date(e.bucketEmptiedTime): undefined,
                }))
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        },
        enabled: !!date,
        staleTime: 5 * 60 * 1000,       // например 5 минут
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    })
}
