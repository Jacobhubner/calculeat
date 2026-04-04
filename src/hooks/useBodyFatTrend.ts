import { useMemo } from 'react'
import type { WeightHistory, BodyFatChartDataPoint } from '@/lib/types'

/**
 * Computes body fat chart data from weight history entries that have body_fat_percentage.
 * Independent of the profile-level body_fat_percentage field.
 */
export function useBodyFatTrend(
  weightHistory: WeightHistory[] | undefined
): BodyFatChartDataPoint[] {
  return useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) return []

    const withBF = [...weightHistory]
      .filter(e => e.body_fat_percentage != null)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

    if (withBF.length === 0) return []

    return withBF.map((entry, index) => {
      const entryDate = new Date(entry.recorded_at)

      // 7-day rolling average over body-fat entries only (date-based window)
      const cutoffDate = new Date(entry.recorded_at)
      cutoffDate.setDate(cutoffDate.getDate() - 7)
      const window = withBF
        .slice(0, index + 1)
        .filter(e => new Date(e.recorded_at) >= cutoffDate)
        .map(e => e.body_fat_percentage as number)

      const rollingAverage =
        window.length >= 2 ? window.reduce((s, v) => s + v, 0) / window.length : null

      return {
        date: entryDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        bodyFat: entry.body_fat_percentage as number,
        rollingAverage,
        displayDate: entryDate.toLocaleDateString('sv-SE'),
      }
    })
  }, [weightHistory])
}
