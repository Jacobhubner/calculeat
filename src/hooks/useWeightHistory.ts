import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WeightHistory } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Hook to fetch weight history for a profile
 */
export function useWeightHistory(profileId: string | undefined) {
  return useQuery({
    queryKey: ['weight-history', profileId],
    queryFn: async () => {
      if (!profileId) return []
      const { data, error } = await supabase
        .from('weight_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('recorded_at', { ascending: false })
      if (error) throw error
      return data as WeightHistory[]
    },
    enabled: !!profileId,
  })
}

/**
 * Hook to create a new weight history entry
 */
export function useCreateWeightHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { profile_id: string; weight_kg: number; notes?: string }) => {
      const { data: result, error } = await supabase
        .from('weight_history')
        .insert([data])
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weight-history', variables.profile_id] })
      toast.success('Vikt sparad')
    },
    onError: () => {
      toast.error('Kunde inte spara vikt')
    },
  })
}

/**
 * Hook to delete a weight history entry
 */
export function useDeleteWeightHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weight_history')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['weight-history'] })
      toast.success('Viktpost borttagen')
    },
    onError: () => {
      toast.error('Kunde inte ta bort viktpost')
    },
  })
}
