/**
 * React Query konfiguration
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuter
      gcTime: 30 * 60 * 1000, // 30 minuter (tidigare cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

/**
 * Query keys för konsekvent cache management
 */
export const queryKeys = {
  userProfile: ['user-profile'] as const,
  userProfileById: (id: string) => ['user-profile', id] as const,
}
