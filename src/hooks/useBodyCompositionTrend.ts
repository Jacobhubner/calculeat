import { useMemo } from 'react'
import type { WeightHistory } from '@/lib/types'
import { calculateFatMass, calculateFatFreeMass } from '@/lib/calculations/bodyComposition'

export interface BodyCompositionChartDataPoint {
  date: string
  timestamp: number
  bodyFatMass: number
  bodyFatMassRolling: number | null
  // UX-driven term: "Soft Lean Mass" is displayed to users, but the formula is Fat-Free Mass (FFM = weight × (1 - bf%)).
  // TODO: Replace with a proper SMM estimate when smart scale data or a validated formula is available.
  softLeanMass: number
  softLeanMassRolling: number | null
  displayDate: string
}

export function useBodyCompositionTrend(
  weightHistory: WeightHistory[] | undefined
): BodyCompositionChartDataPoint[] {
  return useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) return []

    const filtered = [...weightHistory]
      .filter(e => e.body_fat_percentage != null && e.weight_kg != null)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

    if (filtered.length === 0) return []

    return filtered.map((entry, index) => {
      const entryDate = new Date(entry.recorded_at)
      const bf = entry.body_fat_percentage as number
      const w = entry.weight_kg
      const bfm = parseFloat(calculateFatMass(w, bf).toFixed(2))
      const slm = parseFloat(calculateFatFreeMass(w, bf).toFixed(2))

      // 7-day rolling average (date-based window, same pattern as useBodyFatTrend)
      const cutoffDate = new Date(entry.recorded_at)
      cutoffDate.setDate(cutoffDate.getDate() - 7)
      const window = filtered.slice(0, index + 1).filter(e => new Date(e.recorded_at) >= cutoffDate)

      const bfmRolling =
        window.length >= 2
          ? parseFloat(
              (
                window.reduce(
                  (s, e) => s + calculateFatMass(e.weight_kg, e.body_fat_percentage as number),
                  0
                ) / window.length
              ).toFixed(2)
            )
          : null

      const slmRolling =
        window.length >= 2
          ? parseFloat(
              (
                window.reduce(
                  (s, e) => s + calculateFatFreeMass(e.weight_kg, e.body_fat_percentage as number),
                  0
                ) / window.length
              ).toFixed(2)
            )
          : null

      return {
        date: entryDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        timestamp: entryDate.getTime(),
        bodyFatMass: bfm,
        bodyFatMassRolling: bfmRolling,
        softLeanMass: slm,
        softLeanMassRolling: slmRolling,
        displayDate: entryDate.toLocaleDateString('sv-SE'),
      }
    })
  }, [weightHistory])
}
