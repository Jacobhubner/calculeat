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
        // Shape-mapping: same strategy as E4c (refreshProfile).
        //   .id      = profiles UUID  → all .find(p => p.id === activeId) calls match unchanged
        //   .user_id = auth UID       → correct identity
        // Return as single-element array — all consumers unchanged.
        const mapped = {
          ...upData,
          id: upData.active_profile_id,
          user_id: upData.id,
        } as Profile

        return [mapped]
      }

      // E5b fallback: user_profiles row missing or active_profile_id null.
      // Covers new users during onboarding and data incidents — always logged.
      console.warn(
        '[E5b fallback] user_profiles missing or active_profile_id null for uid:',
        user.id,
        '— falling back to profiles table'
      )

      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (pError) {
        throw pError
      }

      return (pData as Profile[]) || []
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
