/**
 * Custom hook för att skapa ett nytt measurement set
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import type { MeasurementSet } from '@/lib/types'

// Input type - omit database-generated fields
type CreateMeasurementSetInput = Omit<MeasurementSet, 'id' | 'user_id' | 'created_at'> & {
  tempId?: string // För att identifiera vilket temp-kort som ska tas bort
}

export function useCreateMeasurementSet() {
  const queryClient = useQueryClient()
  const addMeasurementSet = useMeasurementSetStore(state => state.addMeasurementSet)

  return useMutation({
    mutationFn: async (data: CreateMeasurementSetInput) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tempId, ...measurementData } = data // Extrahera tempId (används i onSuccess)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      const { data: newSet, error } = await supabase
        .from('measurement_sets')
        .insert({
          user_id: user.id,
          ...measurementData, // Använd measurementData utan tempId
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return newSet as MeasurementSet
    },
    onSuccess: (newSet, variables) => {
      // Add to store (will auto-select it)
      addMeasurementSet(newSet)

      // Ta bort temp-kort OM detta var en konvertering från temp
      if (variables.tempId?.startsWith('temp-')) {
        const removeUnsavedMeasurementSet =
          useMeasurementSetStore.getState().removeUnsavedMeasurementSet
        removeUnsavedMeasurementSet(variables.tempId)
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementSets })

      // Format date for display
      const displayDate = new Date(newSet.set_date).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      toast.success('Mätningar sparade', {
        description: `Mätset för ${displayDate} har sparats`,
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte spara mätningar', {
        description: error.message,
      })
    },
  })
}
