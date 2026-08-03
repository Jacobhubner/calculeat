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

    // Parsa varje datum EN gång och sortera på det cachade värdet. Tidigare
    // parsades recorded_at om i comparatorn (O(n log n) Date-objekt) och sedan
    // en gång till per punkt i rullande snitt.
    const sortedHistory = weightHistory
      .map(entry => ({ entry, ts: new Date(entry.recorded_at).getTime() }))
      .sort((a, b) => a.ts - b.ts)

    // Use oldest weight as initial weight and newest as current weight
    const initialWeight = sortedHistory[0].entry.weight_kg
    const latestWeight = currentWeight ?? sortedHistory[sortedHistory.length - 1].entry.weight_kg

    /**
     * Rullande 7-dagarssnitt via glidande fönster: `start` flyttas framåt och
     * summan justeras inkrementellt, så varje punkt besöks en gång (O(n)).
     * Den gamla varianten gjorde slice+filter över hela prefixet per punkt,
     * vilket blev O(n²) med en ny Date per jämförelse.
     */
    const ROLLING_DAYS = 7

    /**
     * Kalenderbaserad gräns (setDate), inte ts - 7*864e5. Skillnaden märks vid
     * sommartidsskiften där ett dygn är 23 eller 25 timmar — en fast
     * millisekundsubtraktion flyttar då fönstret och ändrar snittet.
     */
    const getRollingCutoff = (ts: number) => {
      const cutoff = new Date(ts)
      cutoff.setDate(cutoff.getDate() - ROLLING_DAYS)
      return cutoff.getTime()
    }

    // Intl-formatterare är dyra att skapa — återanvänd i stället för att
    // anropa toLocaleDateString (som bygger en ny formatterare) per punkt.
    const shortFormatter = new Intl.DateTimeFormat('sv-SE', { month: 'short', day: 'numeric' })
    const fullFormatter = new Intl.DateTimeFormat('sv-SE')

    const chartDataWithTrend: WeightChartDataPoint[] = new Array(sortedHistory.length)
    let windowStart = 0
    let windowSum = 0

    for (let i = 0; i < sortedHistory.length; i++) {
      const { entry, ts } = sortedHistory[i]
      windowSum += entry.weight_kg

      // Krymp fönstret tills det bara rymmer punkter inom ROLLING_MS bakåt.
      // Gränsen är INKLUSIV (>= cutoff behålls), vilket matchar den tidigare
      // filter-varianten — annars tappas exakt en punkt på täta serier.
      const cutoff = getRollingCutoff(ts)
      while (sortedHistory[windowStart].ts < cutoff) {
        windowSum -= sortedHistory[windowStart].entry.weight_kg
        windowStart++
      }

      const count = i - windowStart + 1
      // Behåll de gamla villkoren: minst 7 punkter totalt före snittet visas,
      // och minst 2 punkter inom fönstret.
      const rollingAverage = i < ROLLING_DAYS - 1 || count < 2 ? null : windowSum / count

      const entryDate = new Date(ts)
      chartDataWithTrend[i] = {
        date: shortFormatter.format(entryDate),
        timestamp: ts,
        weight: entry.weight_kg,
        rollingAverage,
        displayDate: fullFormatter.format(entryDate),
        isPending: false,
        isCalibrationEvent: false,
      }
    }

    // Calculate 7-day and 14-day averages from recent data.
    // Serien är sorterad, så snittfönstren hittas med ETT svep bakifrån i
    // stället för två fulla filter-pass med Date-parsning per post.
    const nowMs = new Date().getTime()
    const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000
    const fourteenDaysAgoMs = nowMs - 14 * 24 * 60 * 60 * 1000

    let sevenSum = 0
    let sevenCount = 0
    let fourteenSum = 0
    let fourteenCount = 0
    let fourteenStartIndex = sortedHistory.length

    for (let i = sortedHistory.length - 1; i >= 0; i--) {
      const { entry, ts } = sortedHistory[i]
      if (ts < fourteenDaysAgoMs) break
      fourteenSum += entry.weight_kg
      fourteenCount++
      fourteenStartIndex = i
      if (ts >= sevenDaysAgoMs) {
        sevenSum += entry.weight_kg
        sevenCount++
      }
    }

    const sevenDayAverage = sevenCount >= 2 ? sevenSum / sevenCount : null
    const fourteenDayAverage = fourteenCount >= 2 ? fourteenSum / fourteenCount : null

    // Calculate weekly change rate
    let weeklyChangeKg: number | null = null
    let weeklyChangePercent: number | null = null

    if (sortedHistory.length >= 2) {
      const oldestRecentWeight = sortedHistory[fourteenStartIndex]
      const newestWeight = sortedHistory[sortedHistory.length - 1]

      if (oldestRecentWeight && newestWeight) {
        const daysDiff = (newestWeight.ts - oldestRecentWeight.ts) / (1000 * 60 * 60 * 24)

        if (daysDiff >= 7) {
          const weightDiff = newestWeight.entry.weight_kg - oldestRecentWeight.entry.weight_kg
          weeklyChangeKg = (weightDiff / daysDiff) * 7
          weeklyChangePercent = (weeklyChangeKg / oldestRecentWeight.entry.weight_kg) * 100
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
