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

    // Parsa varje datum EN gång och sortera på det cachade värdet.
    const withBF: { ts: number; bodyFat: number }[] = []
    for (const entry of weightHistory) {
      if (entry.body_fat_percentage == null) continue
      withBF.push({
        ts: new Date(entry.recorded_at).getTime(),
        bodyFat: entry.body_fat_percentage,
      })
    }
    if (withBF.length === 0) return []
    withBF.sort((a, b) => a.ts - b.ts)

    // Återanvänd formatterare i stället för toLocaleDateString per punkt.
    const shortFormatter = new Intl.DateTimeFormat('sv-SE', { month: 'short', day: 'numeric' })
    const fullFormatter = new Intl.DateTimeFormat('sv-SE')

    /**
     * Kalenderbaserad gräns (setDate), inte ts - 7*864e5 — skillnaden märks
     * vid sommartidsskiften där ett dygn är 23 eller 25 timmar.
     */
    const getCutoff = (ts: number) => {
      const cutoff = new Date(ts)
      cutoff.setDate(cutoff.getDate() - 7)
      return cutoff.getTime()
    }

    // Glidande fönster: summan justeras inkrementellt (O(n) i stället för
    // slice+filter över hela prefixet per punkt).
    const result: BodyFatChartDataPoint[] = new Array(withBF.length)
    let windowStart = 0
    let windowSum = 0

    for (let i = 0; i < withBF.length; i++) {
      const { ts, bodyFat } = withBF[i]
      windowSum += bodyFat

      const cutoff = getCutoff(ts)
      while (withBF[windowStart].ts < cutoff) {
        windowSum -= withBF[windowStart].bodyFat
        windowStart++
      }

      const count = i - windowStart + 1
      const entryDate = new Date(ts)
      result[i] = {
        date: shortFormatter.format(entryDate),
        timestamp: ts,
        bodyFat,
        rollingAverage: count >= 2 ? windowSum / count : null,
        displayDate: fullFormatter.format(entryDate),
      }
    }

    return result
  }, [weightHistory])
}
