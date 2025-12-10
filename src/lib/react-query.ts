/**
 * React Query konfiguration
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minut (minskat från 5 för säkerhet)
      gcTime: 10 * 60 * 1000, // 10 minuter (minskat från 30 för säkerhet)
      retry: 2,
      refetchOnWindowFocus: true, // Uppdatera data när fönster får fokus
      refetchOnMount: 'always', // Alltid hämta ny data vid mount
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
  profiles: ['profiles'] as const,
  profileById: (id: string) => ['profiles', id] as const,
  measurementSets: ['measurement-sets'] as const,
  measurementSetById: (id: string) => ['measurement-sets', id] as const,
}
