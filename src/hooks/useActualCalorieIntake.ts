import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ActualIntakeData } from '@/lib/types'

/**
 * Hook to fetch actual calorie intake from food logs for a date range
 * Used by Metabolic Calibration to get real calorie data instead of assuming target calories
 */
export function useActualCalorieIntake(
  profileId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['actual-calorie-intake', profileId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<ActualIntakeData> => {
      if (!user || !profileId) {
        return {
          averageCalories: null,
          daysWithData: 0,
          totalDays: 0,
          completenessPercent: 0,
          dailyCalories: [],
        }
      }

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('daily_logs')
        .select('log_date, total_calories, is_completed')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)
        .order('log_date', { ascending: true })

      if (error) throw error

      // Calculate total days in range
      const totalDays =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Process daily calorie data
      const dailyCalories = (data || []).map(log => ({
        date: log.log_date,
        calories: log.total_calories || 0,
        isComplete: log.is_completed || false,
      }))

      // Filter to days with meaningful calorie data (>800 kcal to avoid partial logs)
      const daysWithData = dailyCalories.filter(d => d.calories > 800).length

      // Calculate average from days with data
      const daysWithCalories = dailyCalories.filter(d => d.calories > 800)
      const averageCalories =
        daysWithCalories.length > 0
          ? daysWithCalories.reduce((sum, d) => sum + d.calories, 0) / daysWithCalories.length
          : null

      const completenessPercent = totalDays > 0 ? (daysWithData / totalDays) * 100 : 0

      return {
        averageCalories,
        daysWithData,
        totalDays,
        completenessPercent,
        dailyCalories,
      }
    },
    enabled: !!user && !!profileId,
  })
}
