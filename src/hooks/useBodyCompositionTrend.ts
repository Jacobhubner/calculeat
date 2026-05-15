import { useMemo } from 'react'
import type { WeightHistory } from '@/lib/types'
import { calculateFatMass, calculateFatFreeMass } from '@/lib/calculations/bodyComposition'

export interface BodyCompositionChartDataPoint {
  date: string
  timestamp: number
  bodyFatMass: number
  // UX-driven term: "Soft Lean Mass" is displayed to users, but the formula is Fat-Free Mass (FFM = weight × (1 - bf%)).
  // TODO: Replace with a proper SMM estimate when smart scale data or a validated formula is available.
  softLeanMass: number
  displayDate: string
}

export function useBodyCompositionTrend(
  weightHistory: WeightHistory[] | undefined
): BodyCompositionChartDataPoint[] {
  return useMemo(() => {
    if (!weightHistory || weightHistory.length === 0) return []

    return [...weightHistory]
      .filter(e => e.body_fat_percentage != null && e.weight_kg != null)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(entry => {
        const entryDate = new Date(entry.recorded_at)
        const bf = entry.body_fat_percentage as number
        const w = entry.weight_kg

        return {
          date: entryDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
          timestamp: entryDate.getTime(),
          bodyFatMass: parseFloat(calculateFatMass(w, bf).toFixed(2)),
          softLeanMass: parseFloat(calculateFatFreeMass(w, bf).toFixed(2)),
          displayDate: entryDate.toLocaleDateString('sv-SE'),
        }
      })
  }, [weightHistory])
}
