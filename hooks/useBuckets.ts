// lib/hooks/useBuckets.ts
import { useQuery } from "@tanstack/react-query"
import { BucketsApi } from "@/lib/api-service"
import type { Bucket } from "@/lib/types"   // где описан интерфейс места

export function useBuckets() {
    return useQuery<Bucket[], Error>({
        queryKey: ["buckets"],
        queryFn: () => BucketsApi.getAll(),
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    })
}
