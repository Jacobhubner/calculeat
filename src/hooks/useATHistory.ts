/**
 * useATHistory - Hook för att hämta Adaptive Thermogenesis historik
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ATHistoryEntry } from '@/lib/types'

export function useATHistory(profileId: string | undefined) {
  return useQuery({
    queryKey: ['at-history', profileId],
    queryFn: async () => {
      if (!profileId) return []

      const { data, error } = await supabase
        .from('adaptive_thermogenesis_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('calculation_date', { ascending: true })

      if (error) throw error
      return (data as ATHistoryEntry[]) || []
    },
    enabled: !!profileId,
  })
}
