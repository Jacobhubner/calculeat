/**
 * Custom hook för att ändra ordning på profiler med upp/ned-knappar
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import type { UserProfile } from '@/lib/types'

export function useReorderProfiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      direction,
      allProfiles,
    }: {
      profileId: string
      direction: 'up' | 'down'
      allProfiles: UserProfile[]
    }) => {
      // Sortera profiler efter display_order
      const sortedProfiles = [...allProfiles].sort(
        (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
      )

      // Hitta aktuell profil
      const currentIndex = sortedProfiles.findIndex(p => p.id === profileId)
      if (currentIndex === -1) throw new Error('Profil hittades inte')

      // Kontrollera gränser
      if (direction === 'up' && currentIndex === 0) {
        throw new Error('Profilen är redan först')
      }
      if (direction === 'down' && currentIndex === sortedProfiles.length - 1) {
        throw new Error('Profilen är redan sist')
      }

      // Hitta profilen att byta plats med
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const currentProfile = sortedProfiles[currentIndex]
      const targetProfile = sortedProfiles[targetIndex]

      // Byt display_order mellan profilerna
      const currentOrder = currentProfile.display_order ?? currentIndex
      const targetOrder = targetProfile.display_order ?? targetIndex

      // Uppdatera båda profilerna i databasen
      const { error: error1 } = await supabase
        .from('profiles')
        .update({ display_order: targetOrder })
        .eq('id', currentProfile.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from('profiles')
        .update({ display_order: currentOrder })
        .eq('id', targetProfile.id)

      if (error2) throw error2

      return { currentProfile, targetProfile }
    },
    onSuccess: () => {
      // Invalidera queries för att uppdatera listan
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
    },
    onError: (error: Error) => {
      // Visa endast faktiska fel, inte "redan först/sist"
      if (!error.message.includes('redan')) {
        toast.error('Kunde inte ändra ordning', {
          description: error.message,
        })
      }
    },
  })
}
