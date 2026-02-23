/**
 * Custom hook för att hämta användarprofil med React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { UserProfile } from '@/lib/types'

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.userProfileById(userId) : queryKeys.userProfile,
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) {
        // Hämta current user's profile
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return null
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          throw error
        }

        return data
      }

      // Hämta specifik användare
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      return data
    },
    enabled: true, // Alltid aktiverad, userId är optional
  })
}

export function useUpdateUsername() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newUsername: string) => {
      const { data, error } = await supabase.rpc('update_username', {
        p_new_username: newUsername,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile })
    },
  })
}
