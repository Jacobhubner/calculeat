/**
 * Custom hook för att hämta alla measurement sets för inloggad användare
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { MeasurementSet } from '@/lib/types'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import { useEffect } from 'react'

export function useMeasurementSets() {
  const setMeasurementSets = useMeasurementSetStore(state => state.setMeasurementSets)

  const query = useQuery({
    queryKey: queryKeys.measurementSets,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      const { data, error } = await supabase
        .from('measurement_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('set_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data as MeasurementSet[]) || []
    },
    enabled: true, // Always enabled when user is logged in
  })

  // Update Zustand store when measurement sets are fetched
  useEffect(() => {
    if (query.data) {
      setMeasurementSets(query.data)
    }
  }, [query.data, setMeasurementSets])

  return query
}
