/**
 * Custom hook för att hämta alla profiler för inloggad användare
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { Profile } from '@/lib/types'
import { useProfileStore } from '@/stores/profileStore'
import { useEffect, useRef } from 'react'

export function useProfiles() {
  const setProfiles = useProfileStore(state => state.setProfiles)
  const lastDataRef = useRef<Profile[] | null>(null)

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

  // Update Zustand store when profiles actually change (not just re-render)
  useEffect(() => {
    if (query.data) {
      // Only update if data has actually changed (deep comparison by IDs and updated_at)
      const hasChanged =
        !lastDataRef.current ||
        lastDataRef.current.length !== query.data.length ||
        lastDataRef.current.some(
          (oldProfile, index) =>
            oldProfile.id !== query.data![index].id ||
            oldProfile.updated_at !== query.data![index].updated_at
        )

      if (hasChanged) {
        console.log('📦 useProfiles: Data actually changed, updating store')
        lastDataRef.current = query.data
        setProfiles(query.data)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  return query
}
