import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { WeightHistory } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Hook to fetch weight history for the current user
 * Weight history is now shared across all profile cards
 */
export function useWeightHistory() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['weight-history', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
      if (error) throw error
      return data as WeightHistory[]
    },
    enabled: !!user,
  })
}

/**
 * Hook to create a new weight history entry
 * Automatically uses the current user's ID
 */
export function useCreateWeightHistory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { weight_kg: number; notes?: string }) => {
      if (!user) throw new Error('User not authenticated')

      const { data: result, error } = await supabase
        .from('weight_history')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history', user?.id] })
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
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weight_history').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history', user?.id] })
      toast.success('Viktpost borttagen')
    },
    onError: () => {
      toast.error('Kunde inte ta bort viktpost')
    },
  })
}
