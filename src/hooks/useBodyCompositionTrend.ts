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

    // Parsa datum och beräkna massorna EN gång per post. Tidigare kördes
    // calculateFatMass/calculateFatFreeMass om för varje element i varje
    // fönster, alltså O(n²) anrop utöver O(n²) datumparsningar.
    const filtered: { ts: number; fatMass: number; leanMass: number }[] = []
    for (const entry of weightHistory) {
      if (entry.body_fat_percentage == null || entry.weight_kg == null) continue
      filtered.push({
        ts: new Date(entry.recorded_at).getTime(),
        fatMass: calculateFatMass(entry.weight_kg, entry.body_fat_percentage),
        leanMass: calculateFatFreeMass(entry.weight_kg, entry.body_fat_percentage),
      })
    }
    if (filtered.length === 0) return []
    filtered.sort((a, b) => a.ts - b.ts)

    const shortFormatter = new Intl.DateTimeFormat('sv-SE', { month: 'short', day: 'numeric' })
    const fullFormatter = new Intl.DateTimeFormat('sv-SE')

    /** Kalenderbaserad gräns (setDate) — DST-säker, se useWeightTrend. */
    const getCutoff = (ts: number) => {
      const cutoff = new Date(ts)
      cutoff.setDate(cutoff.getDate() - 7)
      return cutoff.getTime()
    }

    const round2 = (value: number) => parseFloat(value.toFixed(2))

    const result: BodyCompositionChartDataPoint[] = new Array(filtered.length)
    let windowStart = 0
    let fatSum = 0
    let leanSum = 0

    for (let i = 0; i < filtered.length; i++) {
      const { ts, fatMass, leanMass } = filtered[i]
      fatSum += fatMass
      leanSum += leanMass

      const cutoff = getCutoff(ts)
      while (filtered[windowStart].ts < cutoff) {
        fatSum -= filtered[windowStart].fatMass
        leanSum -= filtered[windowStart].leanMass
        windowStart++
      }

      const count = i - windowStart + 1
      const entryDate = new Date(ts)
      result[i] = {
        date: shortFormatter.format(entryDate),
        timestamp: ts,
        bodyFatMass: round2(fatMass),
        bodyFatMassRolling: count >= 2 ? round2(fatSum / count) : null,
        softLeanMass: round2(leanMass),
        softLeanMassRolling: count >= 2 ? round2(leanSum / count) : null,
        displayDate: fullFormatter.format(entryDate),
      }
    }

    return result
  }, [weightHistory])
}
