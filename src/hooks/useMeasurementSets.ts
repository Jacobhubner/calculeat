/**
 * Custom hook för att hämta alla measurement sets för inloggad användare
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { MeasurementSet } from '@/lib/types'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useMeasurementSets() {
  const setMeasurementSets = useMeasurementSetStore(state => state.setMeasurementSets)
  const [isSynced, setIsSynced] = useState(false)
  const { isPreviewMode } = useAuth()

  const query = useQuery({
    queryKey: queryKeys.measurementSets,
    queryFn: async () => {
      if (isPreviewMode) return [] as MeasurementSet[]

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
        console.error('📏 useMeasurementSets: Error fetching', error)
        throw error
      }

      return (data as MeasurementSet[]) || []
    },
    enabled: true, // Always enabled when user is logged in
  })

  // Update Zustand store when measurement sets are fetched
  // Use data directly to ensure we always sync when data is available
  useEffect(() => {
    if (query.data && query.isSuccess) {
      setMeasurementSets(query.data)
      // Mark as synced AFTER store is updated

      setIsSynced(true)
    }
  }, [query.data, query.isSuccess, setMeasurementSets])

  // Reset isSynced when query starts loading again

  useEffect(() => {
    if (query.isLoading) {
      setIsSynced(false)
    }
  }, [query.isLoading])

  // Return isLoading as true until BOTH query is done AND store is synced
  return {
    ...query,
    isLoading: query.isLoading || !isSynced,
  }
}
