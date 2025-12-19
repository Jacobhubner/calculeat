import { useMemo } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { useProfiles } from './useProfiles'
import type { Profile } from '@/lib/types'

/**
 * Hook för att hämta aktiv profil med kombinerad data från Zustand och React Query
 * Eliminerar race conditions genom att synkronisera båda datakällorna
 *
 * @returns Objekt med aktiv profil, loading-state och ready-state
 *
 * @example
 * const { profile, isLoading, isReady } = useActiveProfile()
 *
 * if (!isReady) {
 *   return <LoadingSpinner />
 * }
 *
 * // Nu kan vi säkert använda profile
 * console.log(profile.weight_kg)
 */
export function useActiveProfile() {
  const activeId = useProfileStore(state => state.activeProfile?.id)
  const { data: allProfiles, isLoading } = useProfiles()

  const activeProfile = useMemo(
    () => allProfiles?.find(p => p.id === activeId) ?? null,
    [activeId, allProfiles]
  )

  return {
    /** Den aktiva profilen med all data, eller null om ingen profil är aktiv */
    profile: activeProfile,
    /** Sant om profiler fortfarande laddas från Supabase */
    isLoading,
    /** Sant när laddning är klar OCH en aktiv profil finns */
    isReady: !isLoading && activeProfile !== null,
    /** Sant om ingen profil är vald (men laddning är klar) */
    noProfileSelected: !isLoading && activeId === null,
  }
}

/**
 * Hook för att hämta specifika fält från aktiv profil
 * Kombinerar useActiveProfile med field selection
 *
 * @param fields - Array av fältnamn från Profile interface
 * @returns Objekt med valda fält, eller null om ingen aktiv profil
 *
 * @example
 * const profileData = useActiveProfileData(['weight_kg', 'height_cm', 'gender'])
 *
 * if (!profileData) {
 *   return <MissingDataCard />
 * }
 *
 * // profileData har typen { weight_kg?: number, height_cm?: number, gender?: Gender }
 */
export function useActiveProfileData<T extends keyof Profile>(
  fields: T[]
): Pick<Profile, T> | null {
  const { profile, isReady } = useActiveProfile()

  return useMemo(() => {
    if (!isReady || !profile) return null

    // Skapa objekt med endast valda fält
    const result = {} as Pick<Profile, T>
    fields.forEach(field => {
      result[field] = profile[field]
    })

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isReady, ...fields])
}
