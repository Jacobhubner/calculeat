/**
 * Custom hook för att hämta alla profiler för inloggad användare
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { Profile } from '@/lib/types'
import { useProfileStore } from '@/stores/profileStore'
import { useEffect } from 'react'

export function useProfiles() {
  const setProfiles = useProfileStore(state => state.setProfiles)

  const query = useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
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

      return (data as Profile[]) || []
    },
    enabled: true, // Always enabled when user is logged in
  })

  // Update Zustand store when profiles are fetched
  // Only depend on query.data to avoid infinite loops
  useEffect(() => {
    if (query.data) {
      console.log('📦 useProfiles updating store with', query.data.length, 'profiles')
      setProfiles(query.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  return query
}
