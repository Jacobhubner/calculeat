/**
 * Custom hook för att hämta alla profiler för inloggad användare
 *
 * NOTE: This hook does NOT sync with Zustand store to avoid infinite loops.
 * Components should use activeProfile.id from Zustand and find the full profile
 * from the profiles array returned by this hook.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { Profile } from '@/lib/types'

export function useProfiles() {
  const query = useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
      console.log('🔄 useProfiles: Fetching profiles from database')
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        throw error
      }

      console.log('✅ useProfiles: Got', data?.length || 0, 'profiles')
      return (data as Profile[]) || []
    },
    enabled: true, // Always enabled when user is logged in
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })

  return query
}
