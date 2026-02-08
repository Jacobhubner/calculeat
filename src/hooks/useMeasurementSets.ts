/**
 * Custom hook för att hämta alla measurement sets för inloggad användare
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { MeasurementSet } from '@/lib/types'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import { useEffect, useState } from 'react'

export function useMeasurementSets() {
  const setMeasurementSets = useMeasurementSetStore(state => state.setMeasurementSets)
  const [isSynced, setIsSynced] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.measurementSets,
    queryFn: async () => {
      console.log('📏 useMeasurementSets: Fetching from database')
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log('📏 useMeasurementSets: No user logged in')
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

      console.log('📏 useMeasurementSets: Got', data?.length || 0, 'sets')
      return (data as MeasurementSet[]) || []
    },
    enabled: true, // Always enabled when user is logged in
  })

  // Update Zustand store when measurement sets are fetched
  // Use data directly to ensure we always sync when data is available
  useEffect(() => {
    console.log('📏 useMeasurementSets effect:', {
      hasData: !!query.data,
      isSuccess: query.isSuccess,
      isLoading: query.isLoading,
      dataLength: query.data?.length,
    })
    if (query.data && query.isSuccess) {
      console.log('📏 useMeasurementSets: Syncing to store')
      setMeasurementSets(query.data)
      // Mark as synced AFTER store is updated
      setIsSynced(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
