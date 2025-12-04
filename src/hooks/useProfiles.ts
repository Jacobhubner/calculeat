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

  // Sync to Zustand store when data changes
  // Use dataUpdatedAt to detect actual data changes, not reference changes
  useEffect(() => {
    if (query.data && query.isSuccess) {
      console.log('📦 useProfiles: Syncing', query.data.length, 'profiles to Zustand store')
      setProfiles(query.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt]) // dataUpdatedAt only changes when data actually updates

  return query
}
