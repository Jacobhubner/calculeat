/**
 * Custom hook för att ändra ordning på measurement sets med upp/ned-knappar
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import type { MeasurementSet } from '@/lib/types'

export function useReorderMeasurementSets() {
  const queryClient = useQueryClient()
  const updateMeasurementSet = useMeasurementSetStore(state => state.updateMeasurementSet)

  return useMutation({
    mutationFn: async ({
      setId,
      direction,
      allSets,
    }: {
      setId: string
      direction: 'up' | 'down'
      allSets: MeasurementSet[]
    }) => {
      // Sortera sets efter display_order
      const sortedSets = [...allSets].sort(
        (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
      )

      // Hitta aktuellt set
      const currentIndex = sortedSets.findIndex(s => s.id === setId)
      if (currentIndex === -1) throw new Error('Mätset hittades inte')

      // Kontrollera gränser
      if (direction === 'up' && currentIndex === 0) {
        throw new Error('Mätset är redan först')
      }
      if (direction === 'down' && currentIndex === sortedSets.length - 1) {
        throw new Error('Mätset är redan sist')
      }

      // Hitta setet att byta plats med
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const currentSet = sortedSets[currentIndex]
      const targetSet = sortedSets[targetIndex]

      // Byt display_order mellan seten
      const currentOrder = currentSet.display_order ?? currentIndex
      const targetOrder = targetSet.display_order ?? targetIndex

      // Uppdatera båda seten i databasen
      const { error: error1 } = await supabase
        .from('measurement_sets')
        .update({ display_order: targetOrder })
        .eq('id', currentSet.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from('measurement_sets')
        .update({ display_order: currentOrder })
        .eq('id', targetSet.id)

      if (error2) throw error2

      return { currentSet, targetSet }
    },
    onSuccess: ({ currentSet, targetSet }) => {
      // Uppdatera Zustand store
      updateMeasurementSet(currentSet.id, { display_order: targetSet.display_order })
      updateMeasurementSet(targetSet.id, { display_order: currentSet.display_order })

      // Invalidera queries för att uppdatera listan
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementSets })
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
