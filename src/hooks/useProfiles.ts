/**
 * Custom hook för att hämta alla profiler för inloggad användare
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { Profile } from '@/lib/types'
import { useProfileStore } from '@/stores/profileStore'
import { useEffect } from 'react'

// Steg E1: fält som är kritiska för shape-parity mellan profiles och user_profiles.
// Mismatch loggas som dev-varningar — ingen beteendeförändring för användare.
const PARITY_FIELDS: Array<keyof Profile> = [
  'tdee',
  'calories_min',
  'calories_max',
  'calorie_goal',
  'meals_config',
  'height_cm',
  'weight_kg',
  'gender',
  'birth_date',
]

// Numeriska fält där Postgres numeric-precision kan skilja sig från JS float-aritmetik.
// Tolerans ±0.1 — semantiskt identiska värden triggar inte false positives.
const NUMERIC_PARITY_FIELDS = new Set<keyof Profile>([
  'tdee',
  'calories_min',
  'calories_max',
  'weight_kg',
])

function checkParity(profilesRow: Profile, userProfilesRow: Record<string, unknown>, uid: string) {
  for (const field of PARITY_FIELDS) {
    const pVal = profilesRow[field]
    const upVal = userProfilesRow[field]

    if (NUMERIC_PARITY_FIELDS.has(field)) {
      // Tolerant numeric comparison — avoids false positives from float vs Postgres numeric precision
      const pNum = pVal != null ? Number(pVal) : null
      const upNum = upVal != null ? Number(upVal) : null
      if (pNum === null && upNum === null) continue
      if (pNum === null || upNum === null || Math.abs(pNum - upNum) > 0.1) {
        console.warn(
          `[E1 parity] user=${uid} field=${field} profiles=${JSON.stringify(pVal)} user_profiles=${JSON.stringify(upVal)}`
        )
      }
    } else {
      if (JSON.stringify(pVal) !== JSON.stringify(upVal)) {
        console.warn(
          `[E1 parity] user=${uid} field=${field} profiles=${JSON.stringify(pVal)} user_profiles=${JSON.stringify(upVal)}`
        )
      }
    }
  }
}

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

      // Primary read: profiles (source-of-truth under E1)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        throw error
      }

      // Steg E1: shadow-read user_profiles för parity-check.
      // Resultatet påverkar INTE return-värdet — profiles styr fortfarande.
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (userProfileData && data && data.length > 0) {
        const activeProfile = data.find(p => p.is_active) ?? data[0]
        checkParity(activeProfile, userProfileData as Record<string, unknown>, user.id)
      } else if (!userProfileData) {
        console.warn(`[E1 parity] user=${user.id} user_profiles row saknas`)
      }

      return (data as Profile[]) || []
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
