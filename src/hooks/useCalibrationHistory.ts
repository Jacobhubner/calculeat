import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CalibrationHistory } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Hook to fetch calibration history for a user.
 * Reads via user_id (Fas 2 dual-identifier migration) — profile_id still written on insert.
 */
export function useCalibrationHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['calibration-history', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('calibration_history')
        .select('*')
        .eq('user_id', userId)
        .order('calibrated_at', { ascending: false })
      if (error) throw error
      return data as CalibrationHistory[]
    },
    enabled: !!userId,
  })
}

/**
 * Hook to get the last calibration for a user.
 * Reads via user_id (Fas 2 dual-identifier migration) — profile_id still written on insert.
 */
export function useLastCalibration(userId: string | undefined) {
  return useQuery({
    queryKey: ['last-calibration', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('calibration_history')
        .select('*')
        .eq('user_id', userId)
        .order('calibrated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CalibrationHistory | null
    },
    enabled: !!userId,
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
      queryClient.invalidateQueries({ queryKey: ['calibration-history', variables.user_id] })
      queryClient.invalidateQueries({ queryKey: ['last-calibration', variables.user_id] })
    },
    onError: () => {
      toast.error('Kunde inte spara kalibreringshistorik')
    },
  })
}

/**
 * Hook to revert the most recent calibration.
 * Restores previous_tdee to the profile and marks the entry as reverted.
 */
export function useRevertCalibration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      calibrationId,
      userId,
      previousTdee,
      previousCaloriesMin,
      previousCaloriesMax,
    }: {
      calibrationId: string
      userId: string
      previousTdee: number
      previousCaloriesMin?: number
      previousCaloriesMax?: number
    }) => {
      // Single atomic RPC — marks is_reverted and restores TDEE in one transaction
      const { error } = await supabase.rpc('revert_calibration_v2', {
        p_calibration_id: calibrationId,
        p_previous_tdee: previousTdee,
        p_previous_calories_min: previousCaloriesMin ?? null,
        p_previous_calories_max: previousCaloriesMax ?? null,
      })

      if (error) throw error

      return { userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['calibration-history', userId] })
      queryClient.invalidateQueries({ queryKey: ['last-calibration', userId] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Kalibrering ångrad — TDEE återställt')
    },
    onError: () => {
      toast.error('Kunde inte ångra kalibrering')
    },
  })
}

/**
 * Hook to delete a calibration history entry
 */
export function useDeleteCalibrationHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('calibration_history').delete().eq('id', id)
      if (error) throw error
      return userId
    },
    onSuccess: userId => {
      queryClient.invalidateQueries({ queryKey: ['calibration-history', userId] })
      queryClient.invalidateQueries({ queryKey: ['last-calibration', userId] })
      toast.success('Kalibreringspost borttagen')
    },
    onError: () => {
      toast.error('Kunde inte ta bort kalibreringspost')
    },
  })
}
