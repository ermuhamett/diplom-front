"use client"

import React, {useState, useEffect} from "react"
import {format} from "date-fns"
import {ru} from "date-fns/locale"
import {DashboardLayout} from "@/components/dashboard-layout"
import {Card, CardContent} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {
    Package as PlaceBucketIcon,
    RefreshCw as EmptyBucketIcon,
    Trash2 as RemoveBucketIcon,
    XCircle as InvalidIcon,
    CheckCircle as WentInUseIcon,
    XOctagon as WentOutOfUseIcon
} from "lucide-react"
import {SlagFieldApi, PlacesApi, BucketsApi} from "@/lib/api-service"
import {dataStore} from "@/lib/data-store"

interface SnapshotEvent {
    eventId: string
    placeId: string
    eventType: string
    timestamp: string
    bucketId?: string
    materialId?: string
    slagWeight?: number
    clientStartDate?: string
    bucketEmptiedTime?: string
    description?: string
}

export default function HistoryPage() {
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(false)
    const [events, setEvents] = useState<SnapshotEvent[]>([])
    const [places, setPlaces] = useState<Record<string, { row: string; number: number }>>({})
    const [buckets, setBuckets] = useState<Record<string, string>>({})
    const [materials, setMaterials] = useState<Record<string, string>>({})

    // Карточка «деталь»
    const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <div className="bg-gray-50 px-3 py-1.5 rounded-md">{children}</div>
        </div>
    );

    // Load place / bucket / material metadata once
    useEffect(() => {
        PlacesApi.getAll().then(pls => {
            const map: any = {}
            pls.forEach(p => map[p.id] = {row: p.row, number: p.number})
            setPlaces(map)
        })
        BucketsApi.getAll().then(bs => {
            const map: any = {}
            bs.forEach(b => map[b.id] = b.name)
            setBuckets(map)
        })
        const mats = dataStore.getMaterials()
        setMaterials(Object.fromEntries(mats.map(m => [m.id, m.name])))
    }, [])

    // Fetch snapshot events from backend
    const loadHistory = async () => {
        setLoading(true)
        try {
            const date = new Date(`${selectedDate}T00:00:00Z`)
            const raw = await SlagFieldApi.getStateSnapshot(date)
            // parse dates
            const evts = raw.map((e: SnapshotEvent) => ({
                ...e,
                timestamp: e.timestamp,
                clientStartDate: e.clientStartDate || undefined,
                bucketEmptiedTime: e.bucketEmptiedTime || undefined
            }))
            // sort newest first
            evts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            setEvents(evts)
        } finally {
            setLoading(false)
        }
    }

    const fmtDT = (s?: string) => s ? format(new Date(s), 'dd.MM.yyyy HH:mm', {locale: ru}) : ''

    const eventInfo = {
        PlaceBucket: {
            title: 'Установка ковша',
            badge: 'Установка',
            color: 'default',
            icon: <PlaceBucketIcon className="h-6 w-6 text-green-600"/>
        },
        EmptyBucket: {
            title: 'Опустошение ковша',
            badge: 'Опустошение',
            color: 'default',
            icon: <EmptyBucketIcon className="h-6 w-6 text-blue-600"/>
        },
        RemoveBucket: {
            title: 'Удаление ковша',
            badge: 'Удаление',
            color: 'destructive',
            icon: <RemoveBucketIcon className="h-6 w-6 text-red-600"/>
        },
        Invalid: {
            title: 'Очистка/Ошибка',
            badge: 'Очистка',
            color: 'warning',
            icon: <InvalidIcon className="h-6 w-6 text-orange-600"/>
        },
        WentInUse: {
            title: 'Активация места',
            badge: 'Активировано',
            color: 'success',
            icon: <WentInUseIcon className="h-6 w-6 text-green-600"/>
        },
        WentOutOfUse: {
            title: 'Деактивация места',
            badge: 'Деактивировано',
            color: 'destructive',
            icon: <WentOutOfUseIcon className="h-6 w-6 text-red-600"/>
        },
        OutOfUse: {
            title: 'Деактивация места',
            badge: 'Деактивировано',
            color: 'destructive',
            icon: <WentOutOfUseIcon className="h-6 w-6 text-red-600"/>
        },
    } as const

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">История операций</h1>
                <div className="flex items-center gap-2">
                    <Input type="date" value={selectedDate}
                           onChange={e => setSelectedDate(e.target.value)}/>
                    <Button onClick={loadHistory} disabled={loading || !selectedDate}>
                        {loading ? 'Загрузка...' : 'Загрузить историю'}
                    </Button>
                </div>
            </div>

            {events.map(evt => {
                const place = places[evt.placeId]
                const placeName = place
                    ? `${place.row}${place.number.toString().padStart(2, "0")}`
                    : evt.placeId

                // общий шапочный бейдж/заголовок
                const isPlaceEvt = evt.eventType === "WentInUse" || evt.eventType === "WentOutOfUse"

                return (
                    <Card key={evt.eventId}>
                        <CardContent className="flex gap-4">
                            <div className="flex items-start pt-1">
                                {eventInfo[evt.eventType]?.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-medium">
                                        {isPlaceEvt
                                            ? "Смена состояния места"
                                            : eventInfo[evt.eventType]?.title}
                                    </h3>
                                    <Badge variant={ eventInfo[evt.eventType]?.color as any }>
                                        {isPlaceEvt
                                            ? (evt.eventType === "WentInUse" ? "Активация" : "Деактивация")
                                            : eventInfo[evt.eventType]?.badge}
                                    </Badge>
                                </div>

                                {isPlaceEvt ? (
                                    // две колонки для смены состояния
                                    <>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <Detail label="Место">{placeName}</Detail>
                                            <Detail label="Новое состояние">
                                                {evt.eventType === "WentInUse" ? "Используется" : "Не используется"}
                                            </Detail>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {fmtDT(evt.timestamp)}
                                        </p>
                                    </>
                                ) : (
                                    // старый рендер для событий с ковшами
                                    <>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {fmtDT(evt.timestamp)}
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Detail label="Место">{placeName}</Detail>
                                            {evt.eventType === "PlaceBucket" && (
                                                <>
                                                    <Detail label="Ковш">{buckets[evt.bucketId!]}</Detail>
                                                    <Detail label="Материал">
                                                        {materials[evt.materialId!]}</Detail>
                                                </>
                                            )}
                                            {evt.eventType === "PlaceBucket" && evt.slagWeight != null && (
                                                <Detail label="Вес">
                                                    {(evt.slagWeight / 1000).toFixed(2)} кг
                                                </Detail>
                                            )}
                                            {evt.eventType === "PlaceBucket" && evt.clientStartDate && (
                                                <Detail label="Время установки">
                                                    {fmtDT(evt.clientStartDate)}</Detail>
                                            )}
                                            {evt.eventType === "EmptyBucket" && evt.bucketEmptiedTime && (
                                                <Detail label="Время опустошения">
                                                    {fmtDT(evt.bucketEmptiedTime)}</Detail>
                                            )}
                                            {evt.eventType === "Invalid" && evt.description && (
                                                <Detail label="Причина">{evt.description}</Detail>
                                            )}
                                        </div>
                                    </>
                                )}

                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </DashboardLayout>
    )
}
