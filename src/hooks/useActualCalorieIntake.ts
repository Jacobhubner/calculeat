import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ActualIntakeData } from '@/lib/types'
import { localDateString } from '@/lib/utils/localDate'

/**
 * Hook to fetch actual calorie intake from food logs for a date range
 * Used by Metabolic Calibration to get real calorie data instead of assuming target calories
 *
 * PREVIEW: filtrerar på is_preview enligt projektregeln (samma mönster som
 * useDailyLogs och useWeightHistory). Utan filtret läckte det riktiga kontots
 * loggdagar in i sandlådan — beredskapskortet visade "7/7 loggade dagar" för
 * en ny användare vars logg var tom.
 */
export function useActualCalorieIntake(
  startDate: Date,
  endDate: Date,
  /**
   * Kör frågan bara när den behövs. PhasePickerDialog monteras redan på
   * Översikt medan den är STÄNGD — utan detta hämtades matloggen för fyra
   * veckor vid varje sidladdning, för data som ingen ser.
   */
  enabled = true
) {
  const { user, isPreviewMode } = useAuth()

  return useQuery({
    queryKey: [
      'actual-calorie-intake',
      user?.id,
      isPreviewMode,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async (): Promise<ActualIntakeData> => {
      if (!user) {
        return {
          averageCalories: null,
          daysWithData: 0,
          totalDays: 0,
          completenessPercent: 0,
          dailyCalories: [],
        }
      }

      const startDateStr = localDateString(startDate)
      const endDateStr = localDateString(endDate)

      const { data, error } = await supabase
        .from('daily_logs')
        .select('log_date, total_calories, is_completed')
        .eq('user_id', user.id)
        .eq('is_preview', isPreviewMode ? true : false)
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

      // Only use completed days — incomplete days are partial and would skew the average
      const filteredDailyCalories = dailyCalories.filter(d => d.isComplete)

      // Filter to days with meaningful calorie data (>800 kcal to avoid near-zero completed days)
      const daysWithData = filteredDailyCalories.filter(d => d.calories > 800).length

      // Calculate average from days with data
      const daysWithCalories = filteredDailyCalories.filter(d => d.calories > 800)
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
        dailyCalories: filteredDailyCalories,
      }
    },
    enabled: !!user && enabled,
  })
}
