import { useEffect, useRef, useState } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { useUpdateProfile } from '@/hooks/useUpdateProfile'
import { deviceTimeZone, zonesDiffer } from '@/lib/utils/localDate'

/**
 * Håller profiles.timezone i takt med enheten.
 *
 * Två fall, med avsiktligt olika beteende:
 *
 *   1. Ingen tidszon sparad ännu — sätts tyst till enhetens. Användaren har
 *      inget att ta ställning till: värdet är exakt det appen redan använder.
 *
 *   2. Sparad tidszon skiljer sig från enhetens — då FRÅGAR vi i stället för
 *      att byta. Ett tyst byte mitt under en resa flyttar dygnsgränsen och kan
 *      avsluta en dag användaren står mitt i. Valet är deras.
 *
 * Jämförelsen går via zonesDiffer, som ser till faktisk lokal tid: en resa
 * Stockholm–Oslo byter zonnamn men inte klockslag och ska inte ge någon fråga.
 */
export function useTimeZoneSync() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const updateProfile = useUpdateProfile()

  const [pendingZone, setPendingZone] = useState<string | null>(null)
  // Hindrar att samma avvikelse frågas om igen efter "Behåll" under sessionen.
  const declinedRef = useRef<string | null>(null)
  const seedingRef = useRef(false)

  const profileId = activeProfile?.id
  const savedZone = activeProfile?.timezone

  useEffect(() => {
    if (!profileId) return
    const device = deviceTimeZone()
    if (!device) return

    if (!savedZone) {
      // Fall 1: första gången — spara tyst.
      if (seedingRef.current) return
      seedingRef.current = true
      void updateProfile
        .mutateAsync({ profileId, data: { timezone: device }, silent: true })
        .catch(() => {
          // Misslyckas det är appen ändå korrekt: utan sparad zon används
          // enhetens. Nytt försök sker vid nästa montering.
          seedingRef.current = false
        })
      return
    }

    // Fall 2: avvikelse — fråga, byt inte.
    if (declinedRef.current === device) return
    setPendingZone(zonesDiffer(savedZone, device) ? device : null)
  }, [profileId, savedZone, updateProfile])

  const acceptZone = async () => {
    if (!profileId || !pendingZone) return
    await updateProfile.mutateAsync({
      profileId,
      data: { timezone: pendingZone },
      silent: true,
    })
    setPendingZone(null)
  }

  const keepZone = () => {
    declinedRef.current = pendingZone
    setPendingZone(null)
  }

  return {
    /** Enhetens zon när den avviker från den sparade, annars null. */
    pendingZone,
    savedZone,
    acceptZone,
    keepZone,
    isSaving: updateProfile.isPending,
  }
}
