/**
 * Custom hook för att radera ett measurement set
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'

export function useDeleteMeasurementSet() {
  const queryClient = useQueryClient()
  const removeMeasurementSet = useMeasurementSetStore(state => state.removeMeasurementSet)

  return useMutation({
    mutationFn: async (measurementSetId: string) => {
      const { error } = await supabase.from('measurement_sets').delete().eq('id', measurementSetId)

      if (error) {
        throw error
      }

      return measurementSetId
    },
    onSuccess: measurementSetId => {
      // Remove from store (will clear active set if it was the deleted one)
      removeMeasurementSet(measurementSetId)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementSets })

      toast.success('Mätning borttagen', {
        description: 'Mätset har tagits bort',
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte ta bort mätning', {
        description: error.message,
      })
    },
  })
}
