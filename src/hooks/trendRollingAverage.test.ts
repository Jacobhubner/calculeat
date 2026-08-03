import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWeightTrend } from './useWeightTrend'
import { useBodyFatTrend } from './useBodyFatTrend'
import { useBodyCompositionTrend } from './useBodyCompositionTrend'
import type { WeightHistory } from '@/lib/types'

/**
 * Trendhookarnas rullande 7-dagarssnitt.
 *
 * Hookarna skrevs om från O(n²) (slice+filter per punkt) till glidande fönster.
 * Testerna låser det observerbara beteendet — särskilt fönstrets gräns, som är
 * KALENDERBASERAD (setDate(-7)). En fast millisekundsubtraktion ger fel snitt
 * vid sommartidsskiften; det var en verklig bugg under omskrivningen.
 */

const DAY = 24 * 60 * 60 * 1000

const entry = (iso: string, weight: number, bf?: number): WeightHistory =>
  ({
    id: iso,
    recorded_at: iso,
    weight_kg: weight,
    body_fat_percentage: bf ?? null,
  }) as WeightHistory

/** Referensimplementation: naivt snitt över kalenderfönstret. */
function naiveRollingAverage(entries: WeightHistory[], index: number, days = 7): number | null {
  if (index < days - 1) return null
  const cutoff = new Date(entries[index].recorded_at)
  cutoff.setDate(cutoff.getDate() - days)
  const relevant = entries
    .slice(0, index + 1)
    .filter(e => new Date(e.recorded_at) >= cutoff)
    .map(e => e.weight_kg)
  if (relevant.length < 2) return null
  return relevant.reduce((s, w) => s + w, 0) / relevant.length
}

const dailyFrom = (startIso: string, n: number, weightAt: (i: number) => number) =>
  Array.from({ length: n }, (_, i) =>
    entry(new Date(Date.parse(startIso) + i * DAY).toISOString(), weightAt(i), 15 + (i % 5) * 0.4)
  )

describe('useWeightTrend — rullande snitt', () => {
  it('matchar en naiv referensimplementation punkt för punkt', () => {
    const history = dailyFrom('2025-06-01T09:00:00Z', 60, i => 80 + Math.sin(i / 5) * 2)
    const { result } = renderHook(() => useWeightTrend(history))

    result.current.chartDataWithTrend.forEach((point, i) => {
      const expected = naiveRollingAverage(history, i)
      if (expected === null) {
        expect(point.rollingAverage).toBeNull()
      } else {
        expect(point.rollingAverage).toBeCloseTo(expected, 9)
      }
    })
  })

  it('ger inget snitt för de första sex punkterna', () => {
    const history = dailyFrom('2025-06-01T09:00:00Z', 10, () => 80)
    const { result } = renderHook(() => useWeightTrend(history))
    const averages = result.current.chartDataWithTrend.map(p => p.rollingAverage)
    expect(averages.slice(0, 6).every(a => a === null)).toBe(true)
    expect(averages[6]).not.toBeNull()
  })

  it('använder kalenderbaserat fönster över sommartidsskiftet', () => {
    // Skiftet 2026-03-29 i europeisk tid: ett dygn är 23 timmar.
    const history = dailyFrom('2026-03-20T12:00:00Z', 20, i => 80 + i * 0.1)
    const { result } = renderHook(() => useWeightTrend(history))
    result.current.chartDataWithTrend.forEach((point, i) => {
      const expected = naiveRollingAverage(history, i)
      if (expected === null) expect(point.rollingAverage).toBeNull()
      else expect(point.rollingAverage).toBeCloseTo(expected, 9)
    })
  })

  it('sorterar osorterad indata', () => {
    const history = [
      entry('2025-06-10T09:00:00Z', 82),
      entry('2025-06-01T09:00:00Z', 80),
      entry('2025-06-05T09:00:00Z', 81),
    ]
    const { result } = renderHook(() => useWeightTrend(history))
    const stamps = result.current.chartDataWithTrend.map(p => p.timestamp)
    expect(stamps).toEqual([...stamps].sort((a, b) => a - b))
  })

  it('hanterar tom historik', () => {
    const { result } = renderHook(() => useWeightTrend([]))
    expect(result.current.chartDataWithTrend).toEqual([])
    expect(result.current.totalChangeKg).toBe(0)
  })

  it('räknar totalChangeKg från äldsta till senaste', () => {
    const history = [entry('2025-06-01T09:00:00Z', 80), entry('2025-06-20T09:00:00Z', 77.5)]
    const { result } = renderHook(() => useWeightTrend(history))
    expect(result.current.totalChangeKg).toBeCloseTo(-2.5, 9)
  })
})

describe('useBodyFatTrend', () => {
  it('tar bara med poster som har kroppsfett', () => {
    const history = [
      entry('2025-06-01T09:00:00Z', 80, 18),
      entry('2025-06-02T09:00:00Z', 80),
      entry('2025-06-03T09:00:00Z', 80, 17.5),
    ]
    const { result } = renderHook(() => useBodyFatTrend(history))
    expect(result.current).toHaveLength(2)
    expect(result.current.map(p => p.bodyFat)).toEqual([18, 17.5])
  })

  it('kräver minst två punkter i fönstret för ett snitt', () => {
    const { result } = renderHook(() => useBodyFatTrend([entry('2025-06-01T09:00:00Z', 80, 18)]))
    expect(result.current[0].rollingAverage).toBeNull()
  })

  it('ger tom lista när ingen post har kroppsfett', () => {
    const { result } = renderHook(() => useBodyFatTrend([entry('2025-06-01T09:00:00Z', 80)]))
    expect(result.current).toEqual([])
  })
})

describe('useBodyCompositionTrend', () => {
  it('beräknar fettmassa och fettfri massa per punkt', () => {
    const { result } = renderHook(() =>
      useBodyCompositionTrend([entry('2025-06-01T09:00:00Z', 100, 20)])
    )
    expect(result.current[0].bodyFatMass).toBeCloseTo(20, 2)
    expect(result.current[0].softLeanMass).toBeCloseTo(80, 2)
  })

  it('avrundar snitten på OAVRUNDADE massor', () => {
    // Snittet ska räknas på råa värden och avrundas sist — inte summera
    // redan avrundade punkter, vilket skulle ackumulera avrundningsfel.
    const history = [
      entry('2025-06-01T09:00:00Z', 100, 20.005),
      entry('2025-06-02T09:00:00Z', 100, 20.015),
    ]
    const { result } = renderHook(() => useBodyCompositionTrend(history))
    const rolling = result.current[1].bodyFatMassRolling
    expect(rolling).toBeCloseTo(Number(((20.005 + 20.015) / 2).toFixed(2)), 9)
  })

  it('kräver både vikt och kroppsfett', () => {
    const history = [entry('2025-06-01T09:00:00Z', 100, 20), entry('2025-06-02T09:00:00Z', 100)]
    const { result } = renderHook(() => useBodyCompositionTrend(history))
    expect(result.current).toHaveLength(1)
  })
})
