/**
 * Custom hook för att uppdatera ett befintligt measurement set
 */

import { useQueryClient } from '@tanstack/react-query'
import { usePreviewMutation } from '@/hooks/usePreviewMutation'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import type { MeasurementSet } from '@/lib/types'

type UpdateMeasurementSetInput = Partial<Omit<MeasurementSet, 'id' | 'user_id' | 'created_at'>>

export function useUpdateMeasurementSet() {
  const queryClient = useQueryClient()
  const updateMeasurementSetInStore = useMeasurementSetStore(state => state.updateMeasurementSet)

  return usePreviewMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMeasurementSetInput }) => {
      const { data: updated, error } = await supabase
        .from('measurement_sets')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return updated as MeasurementSet
    },
    onSuccess: updated => {
      // Update in store
      updateMeasurementSetInStore(updated.id, updated)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementSets })

      // Format date for display
      const displayDate = new Date(updated.set_date).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      toast.success('Mätningar uppdaterade', {
        description: `Sparad som ${displayDate}`,
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte uppdatera mätningar', {
        description: error.message,
      })
    },
  })
}
