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
type CreateMeasurementSetInput = Omit<MeasurementSet, 'id' | 'user_id' | 'created_at'>

export function useCreateMeasurementSet() {
  const queryClient = useQueryClient()
  const addMeasurementSet = useMeasurementSetStore(state => state.addMeasurementSet)
  const getMeasurementSetByDate = useMeasurementSetStore(state => state.getMeasurementSetByDate)

  return useMutation({
    mutationFn: async (data: CreateMeasurementSetInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      // Check if a measurement set for this date already exists
      const existingSet = getMeasurementSetByDate(data.set_date)
      if (existingSet) {
        throw new Error('Ett mätset för detta datum finns redan')
      }

      const { data: newSet, error } = await supabase
        .from('measurement_sets')
        .insert({
          user_id: user.id,
          ...data,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return newSet as MeasurementSet
    },
    onSuccess: newSet => {
      // Add to store (will auto-select it)
      addMeasurementSet(newSet)

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
