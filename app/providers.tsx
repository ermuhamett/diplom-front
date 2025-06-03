'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // не рефетчить 5 минут
      cacheTime: 1000 * 60 * 10, // держать кэш 10 минут
      refetchOnMount: false, // не рефетчить при каждом монтировании
      refetchOnWindowFocus: false, // не рефетчить при возврате фокуса
      refetchOnReconnect: false,
      keepPreviousData: true, // сохранять старые данные при новых запросах
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
