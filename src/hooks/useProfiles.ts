/**
 * Custom hook för att hämta aktiv profil för inloggad användare
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

      // E5b: primary read — user_profiles (source-of-truth, Fas 3)
      const { data: upData, error: upError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (upError) {
        throw upError
      }

      if (upData && upData.active_profile_id) {
        // Shape-mapping: id = active_profile_id (profiles UUID) so all consumers
        // that pass profileId to useUpdateProfile continue to work unchanged.
        const mapped = {
          ...upData,
          id: upData.active_profile_id,
          user_id: upData.id,
        } as Profile

        return [mapped]
      }

      // user_profiles row missing or active_profile_id null — new user during onboarding.
      return []
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
  })

  // Sync to Zustand store when data changes
  useEffect(() => {
    if (query.data && query.isSuccess) {
      setProfiles(query.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt])

  return query
}
