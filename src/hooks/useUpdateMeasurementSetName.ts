/**
 * Custom hook för att uppdatera namn på ett measurement set
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'

export function useUpdateMeasurementSetName() {
  const queryClient = useQueryClient()
  const updateMeasurementSet = useMeasurementSetStore(state => state.updateMeasurementSet)

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string | null }) => {
      const { data, error } = await supabase
        .from('measurement_sets')
        .update({ name })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: updatedSet => {
      // Update Zustand store
      updateMeasurementSet(updatedSet.id, { name: updatedSet.name })

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementSets })

      toast.success('Namn uppdaterat', {
        description: updatedSet.name || 'Återställt till standardnamn',
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte uppdatera namn', {
        description: error.message,
      })
    },
  })
}
