"use client"

import React, {useState} from "react";
import {format} from "date-fns";
import {ru} from "date-fns/locale";
import {useQuery} from "@tanstack/react-query";
import {DashboardLayout} from "@/components/dashboard-layout";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
    Package as PlaceBucketIcon,
    RefreshCw as EmptyBucketIcon,
    Trash2 as RemoveBucketIcon,
    XCircle as InvalidIcon,
    CheckCircle as WentInUseIcon,
    XOctagon as WentOutOfUseIcon,
} from "lucide-react";
import {SlagFieldApi} from "@/lib/api-service";
import {usePlaces} from "@/hooks/usePlaces";
import {useBuckets} from "@/hooks/useBuckets";
import {useMaterials} from "@/hooks/useMaterials";

interface HistoryEvent {
    eventId: string;
    placeId: string;
    eventType: string;
    timestamp: string;
    bucketId?: string;
    materialId?: string;
    slagWeight?: number;
    clientStartDate?: string;
    bucketEmptiedTime?: string;
    description?: string;
}

export default function HistoryPage() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState<string>(today);

    // metadata hooks
    const {data: places = [], isLoading: plLoading} = usePlaces();
    const {data: buckets = [], isLoading: bLoading} = useBuckets();
    const {data: materials = [], isLoading: mLoading} = useMaterials();

    // map id to display
    const placeMap = Object.fromEntries(
        places.map(p => [p.id, {row: p.row, number: p.number}])
    );
    const bucketMap = Object.fromEntries(
        buckets.map(b => [b.id, b.name])
    );
    const materialMap = Object.fromEntries(
        materials.map(m => [m.id, m.name])
    );

    // history query (manual)
    const {
        data: events = [],
        isFetching,
        refetch,
    } = useQuery<HistoryEvent[], Error>({
        queryKey: ["history", selectedDate],
        queryFn: () => {
            const dt = new Date(`${selectedDate}T23:59:59Z`);
            return SlagFieldApi.getStateSnapshot(dt);
        },
        enabled: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    })

    // helper: из timestamp (ISO) получить дату в формате 'yyyy-MM-dd'
    //const isoDate = (ts: string) => ts.slice(0, 10);

    // отфильтровать только по выбранному дню
    //const todaysEvents = events.filter(evt => isoDate(evt.timestamp) === selectedDate);


    // Only keep those events whose timestamp date matches selectedDate
    const dailyEvents = React.useMemo(() => {
        return events.filter(evt => {
            // evt.timestamp is an ISO string like "2025-05-19T09:58:57.394142Z"
            // compare the YYYY-MM-DD prefix:
            return evt.timestamp.slice(0, 10) === selectedDate;
        });
    }, [events, selectedDate]);

    // UI helpers
    const fmtDT = (s?: string) =>
        s ? format(new Date(s), "dd.MM.yyyy HH:mm", {locale: ru}) : "";

    const Detail = ({label, children}: { label: string; children: React.ReactNode }) => (
        <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <div className="bg-gray-50 px-3 py-1.5 rounded-md overflow-hidden">{children}</div>
        </div>
    );

    const eventInfo: Record<string, {
        title: string;
        badge: string;
        variant: "default" | "destructive" | "warning" | "success";
        icon: React.ReactNode;
    }> = {
        PlaceBucket: {
            title: 'Установка ковша',
            badge: 'Установка',
            variant: 'default',
            icon: <PlaceBucketIcon className="h-6 w-6 text-green-600"/>,
        },
        EmptyBucket: {
            title: 'Опустошение ковша',
            badge: 'Опустошение',
            variant: 'default',
            icon: <EmptyBucketIcon className="h-6 w-6 text-blue-600"/>,
        },
        RemoveBucket: {
            title: 'Удаление ковша',
            badge: 'Удаление',
            variant: 'destructive',
            icon: <RemoveBucketIcon className="h-6 w-6 text-red-600"/>,
        },
        Invalid: {
            title: 'Очистка/Ошибка',
            badge: 'Очистка',
            variant: 'warning',
            icon: <InvalidIcon className="h-6 w-6 text-orange-600"/>,
        },
        WentInUse: {
            title: 'Активация места',
            badge: 'Активировано',
            variant: 'success',
            icon: <WentInUseIcon className="h-6 w-6 text-green-600"/>,
        },
        WentOutOfUse: {
            title: 'Деактивация места',
            badge: 'Деактивировано',
            variant: 'destructive',
            icon: <WentOutOfUseIcon className="h-6 w-6 text-red-600"/>,
        },
        OutOfUse: {
            title: 'Деактивация места',
            badge: 'Деактивировано',
            variant: 'destructive',
            icon: <WentOutOfUseIcon className="h-6 w-6 text-red-600"/>,
        },
    };

    const isLoading = plLoading || bLoading || mLoading;

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">История операций</h1>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                    <Button
                        onClick={() => refetch()}
                        disabled={isFetching || !selectedDate || isLoading}
                    >
                        {isFetching ? 'Загрузка...' : 'Загрузить историю'}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {dailyEvents.length === 0 && !isFetching && (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            {isFetching
                                ? "Загрузка…"
                                : selectedDate
                                    ? "За этот день событий нет"
                                    : "Выберите дату и нажмите «Загрузить историю»"
                            }
                        </CardContent>
                    </Card>
                )}
                {dailyEvents.map(evt => {
                    const place = placeMap[evt.placeId];
                    const placeName = place
                        ? `${place.row}${place.number.toString().padStart(2, '0')}`
                        : evt.placeId;
                    const info = eventInfo[evt.eventType] || {
                        title: evt.eventType,
                        badge: evt.eventType,
                        variant: 'default' as any,
                        icon: null,
                    };
                    const isPlaceEvt = evt.eventType === 'WentInUse' || evt.eventType === 'WentOutOfUse' || evt.eventType === 'OutOfUse';

                    return (
                        <Card key={evt.eventId}>
                            <CardContent className="flex gap-4">
                                <div className="flex items-start pt-1">{info.icon}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-medium">
                                            {isPlaceEvt ? 'Смена состояния места' : info.title}
                                        </h3>
                                        <Badge variant={info.variant}>
                                            {isPlaceEvt
                                                ? (evt.eventType === 'WentInUse' ? 'Активация' : 'Деактивация')
                                                : info.badge}
                                        </Badge>
                                    </div>
                                    {isPlaceEvt ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4 mb-2">
                                                <Detail label="Место">{placeName}</Detail>
                                                <Detail label="Новое состояние">
                                                    {evt.eventType === 'WentInUse' ? 'Используется' : 'Не используется'}
                                                </Detail>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {fmtDT(evt.timestamp)}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {fmtDT(evt.timestamp)}
                                            </p>
                                            <div className="grid grid-cols-3 gap-4">
                                                <Detail label="Место">{placeName}</Detail>
                                                {evt.eventType === 'PlaceBucket' && (
                                                    <>
                                                        <Detail
                                                            label="Ковш">{bucketMap[evt.bucketId!]}</Detail>
                                                        <Detail
                                                            label="Материал">{materialMap[evt.materialId!]}</Detail>
                                                    </>
                                                )}
                                                {evt.eventType === 'PlaceBucket' && evt.slagWeight != null && (
                                                    <Detail
                                                        label="Вес">{(evt.slagWeight / 1000).toFixed(2)} т</Detail>
                                                )}
                                                {evt.eventType === 'PlaceBucket' && evt.clientStartDate && (
                                                    <Detail
                                                        label="Время установки">{fmtDT(evt.clientStartDate)}</Detail>
                                                )}
                                                {evt.eventType === 'EmptyBucket' && evt.bucketEmptiedTime && (
                                                    <Detail
                                                        label="Время опустошения">{fmtDT(evt.bucketEmptiedTime)}</Detail>
                                                )}
                                                {evt.eventType === 'Invalid' && evt.description && (
                                                    <Detail label="Причина">{evt.description}</Detail>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
                }
            </div>
        </DashboardLayout>
    )
        ;
}
