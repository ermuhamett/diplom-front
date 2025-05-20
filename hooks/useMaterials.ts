// lib/hooks/useMaterials.ts
import { useQuery } from "@tanstack/react-query"
import { dataStore } from "@/lib/data-store"
import type { MaterialSetting } from "@/lib/types"

export function useMaterials() {
    return useQuery({
        queryKey: ["materials"],
        queryFn: (): Promise<MaterialSetting[]> => {
            // приведение типов, если dataStore.getMaterials возвращает
            // чуть другой интерфейс, чем MaterialSetting
            return Promise.resolve(dataStore.getMaterials() as MaterialSetting[])
        },
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    })
}
