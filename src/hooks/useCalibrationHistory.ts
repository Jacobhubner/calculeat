import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CalibrationHistory } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Hook to fetch calibration history for a profile
 */
export function useCalibrationHistory(profileId: string | undefined) {
  return useQuery({
    queryKey: ['calibration-history', profileId],
    queryFn: async () => {
      if (!profileId) return []
      const { data, error } = await supabase
        .from('calibration_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('calibrated_at', { ascending: false })
      if (error) throw error
      return data as CalibrationHistory[]
    },
    enabled: !!profileId,
  })
}

/**
 * Hook to get the last calibration for a profile
 */
export function useLastCalibration(profileId: string | undefined) {
  return useQuery({
    queryKey: ['last-calibration', profileId],
    queryFn: async () => {
      if (!profileId) return null
      const { data, error } = await supabase
        .from('calibration_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('calibrated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CalibrationHistory | null
    },
    enabled: !!profileId,
  })
}

/**
 * Hook to create a new calibration history entry
 */
export function useCreateCalibrationHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<CalibrationHistory, 'id' | 'created_at' | 'calibrated_at'>) => {
      const { data: result, error } = await supabase
        .from('calibration_history')
        .insert([data])
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calibration-history', variables.profile_id] })
      queryClient.invalidateQueries({ queryKey: ['last-calibration', variables.profile_id] })
    },
    onError: () => {
      toast.error('Kunde inte spara kalibreringshistorik')
    },
  })
}

/**
 * Hook to delete a calibration history entry
 */
export function useDeleteCalibrationHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const { error } = await supabase.from('calibration_history').delete().eq('id', id)
      if (error) throw error
      return profileId
    },
    onSuccess: profileId => {
      queryClient.invalidateQueries({ queryKey: ['calibration-history', profileId] })
      queryClient.invalidateQueries({ queryKey: ['last-calibration', profileId] })
      toast.success('Kalibreringspost borttagen')
    },
    onError: () => {
      toast.error('Kunde inte ta bort kalibreringspost')
    },
  })
}
