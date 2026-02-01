import { useMemo } from 'react'
import type { WeightHistory, WeightTrendData, WeightChartDataPoint } from '@/lib/types'

/**
 * Calculate weight trend statistics and chart data with rolling averages
 * Now uses the oldest weight in history as the starting weight instead of profile.initial_weight_kg
 */
export function useWeightTrend(
  weightHistory: WeightHistory[] | undefined,
  targetWeight?: number | null,
  currentWeight?: number | null
): WeightTrendData {
  return useMemo(() => {
    const emptyResult: WeightTrendData = {
      sevenDayAverage: null,
      fourteenDayAverage: null,
      weeklyChangeKg: null,
      weeklyChangePercent: null,
      projectedGoalDate: null,
      weeksToGoal: null,
      progressPercent: null,
      totalChangeKg: 0,
      chartDataWithTrend: [],
    }

    if (!weightHistory || weightHistory.length === 0) {
      return emptyResult
    }

    // Sort by date ascending for calculations
    const sortedHistory = [...weightHistory].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    // Use oldest weight as initial weight and newest as current weight
    const initialWeight = sortedHistory[0].weight_kg
    const latestWeight = currentWeight ?? sortedHistory[sortedHistory.length - 1].weight_kg

    // Calculate rolling averages
    const calculateRollingAverage = (
      data: WeightHistory[],
      index: number,
      days: number
    ): number | null => {
      if (index < days - 1) return null

      const cutoffDate = new Date(data[index].recorded_at)
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const relevantWeights = data
        .slice(0, index + 1)
        .filter(w => new Date(w.recorded_at) >= cutoffDate)
        .map(w => w.weight_kg)

      if (relevantWeights.length < 2) return null

      return relevantWeights.reduce((sum, w) => sum + w, 0) / relevantWeights.length
    }

    // Build chart data with rolling averages
    const chartDataWithTrend: WeightChartDataPoint[] = []

    // Add all weight history entries
    sortedHistory.forEach((entry, index) => {
      const entryDate = new Date(entry.recorded_at)
      chartDataWithTrend.push({
        date: entryDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        weight: entry.weight_kg,
        rollingAverage: calculateRollingAverage(sortedHistory, index, 7),
        displayDate: entryDate.toLocaleDateString('sv-SE'),
        isPending: false,
        isCalibrationEvent: false,
      })
    })

    // Calculate 7-day and 14-day averages from recent data
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentSevenDays = sortedHistory.filter(w => new Date(w.recorded_at) >= sevenDaysAgo)
    const recentFourteenDays = sortedHistory.filter(w => new Date(w.recorded_at) >= fourteenDaysAgo)

    const sevenDayAverage =
      recentSevenDays.length >= 2
        ? recentSevenDays.reduce((sum, w) => sum + w.weight_kg, 0) / recentSevenDays.length
        : null

    const fourteenDayAverage =
      recentFourteenDays.length >= 2
        ? recentFourteenDays.reduce((sum, w) => sum + w.weight_kg, 0) / recentFourteenDays.length
        : null

    // Calculate weekly change rate
    let weeklyChangeKg: number | null = null
    let weeklyChangePercent: number | null = null

    if (sortedHistory.length >= 2) {
      const oldestRecentWeight = recentFourteenDays[0]
      const newestWeight = sortedHistory[sortedHistory.length - 1]

      if (oldestRecentWeight && newestWeight) {
        const daysDiff =
          (new Date(newestWeight.recorded_at).getTime() -
            new Date(oldestRecentWeight.recorded_at).getTime()) /
          (1000 * 60 * 60 * 24)

        if (daysDiff >= 7) {
          const weightDiff = newestWeight.weight_kg - oldestRecentWeight.weight_kg
          weeklyChangeKg = (weightDiff / daysDiff) * 7
          weeklyChangePercent = (weeklyChangeKg / oldestRecentWeight.weight_kg) * 100
        }
      }
    }

    // Calculate progress toward goal
    let progressPercent: number | null = null
    let projectedGoalDate: Date | null = null
    let weeksToGoal: number | null = null

    if (targetWeight && initialWeight && targetWeight !== initialWeight) {
      const totalToLose = initialWeight - targetWeight
      const currentLost = initialWeight - latestWeight
      progressPercent = Math.max(0, Math.min(100, (currentLost / totalToLose) * 100))

      // Project goal date based on weekly change
      if (weeklyChangeKg !== null && weeklyChangeKg !== 0) {
        const remainingToLose = latestWeight - targetWeight
        // Only project if we're moving in the right direction
        const isLosingAndNeedToLose = remainingToLose > 0 && weeklyChangeKg < 0
        const isGainingAndNeedToGain = remainingToLose < 0 && weeklyChangeKg > 0

        if (isLosingAndNeedToLose || isGainingAndNeedToGain) {
          weeksToGoal = Math.abs(remainingToLose / weeklyChangeKg)
          projectedGoalDate = new Date()
          projectedGoalDate.setDate(projectedGoalDate.getDate() + weeksToGoal * 7)
        }
      }
    }

    // Total change from initial weight
    const totalChangeKg = latestWeight - initialWeight

    return {
      sevenDayAverage,
      fourteenDayAverage,
      weeklyChangeKg,
      weeklyChangePercent,
      projectedGoalDate,
      weeksToGoal,
      progressPercent,
      totalChangeKg,
      chartDataWithTrend,
    }
  }, [weightHistory, targetWeight, currentWeight])
}
