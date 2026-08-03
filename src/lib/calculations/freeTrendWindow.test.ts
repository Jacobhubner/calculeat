import { describe, it, expect } from 'vitest'
import {
  applyFreeWindow,
  FREE_WINDOW_DAYS,
  FREE_MIN_POINTS,
  FREE_FLOOR_CAP_DAYS,
  DAY_MS,
} from './freeTrendWindow'

/**
 * Gatingen för gratisnivåns trendgrafer (docs/PREMIUM_SPEC.md).
 *
 * Reglerna testas som BETEENDE, inte implementation: "en gratisanvändare får
 * aldrig se mer än X" ska hålla oavsett hur beskärningen är byggd internt.
 */

const NOW = Date.parse('2026-08-03T12:00:00Z')
const windowStart = NOW - FREE_WINDOW_DAYS * DAY_MS
const floorCap = NOW - FREE_FLOOR_CAP_DAYS * DAY_MS

/** Bygger en stigande serie från dagar-sedan-offsets. */
const series = (daysAgo: number[]) =>
  daysAgo.map(d => ({ timestamp: NOW - d * DAY_MS })).sort((a, b) => a.timestamp - b.timestamp)

/** Hur många dagar bakåt sträcker sig resultatet? */
const spanDays = (result: { timestamp: number }[]) =>
  result.length === 0 ? 0 : Math.round((NOW - result[0].timestamp) / DAY_MS)

const daily = (n: number) => series(Array.from({ length: n }, (_, i) => i))

describe('applyFreeWindow — huvudregel: 30 dagar', () => {
  it('visar 30 dagar för den som loggar dagligen', () => {
    const result = applyFreeWindow(daily(180), windowStart, floorCap)
    expect(spanDays(result)).toBe(FREE_WINDOW_DAYS)
  })

  it('släpper aldrig igenom punkter före fönstret när serien är tät nog', () => {
    const result = applyFreeWindow(daily(180), windowStart, floorCap)
    expect(result.every(d => d.timestamp >= windowStart)).toBe(true)
  })

  it('lämnar en serie som redan ryms i fönstret orörd', () => {
    const input = series([0, 3, 7, 14])
    expect(applyFreeWindow(input, windowStart, floorCap)).toEqual(input)
  })
})

describe('applyFreeWindow — punktgolvet', () => {
  it('räddar månadsvägaren som annars fått en ensam punkt', () => {
    const result = applyFreeWindow(series([0, 31, 62, 93, 124, 155]), windowStart, floorCap)
    expect(result).toHaveLength(FREE_MIN_POINTS)
    expect(spanDays(result)).toBe(62)
  })

  it('ger en läsbar kurva även när inget alls finns inom 30 dagar', () => {
    const result = applyFreeWindow(series([45, 52, 60, 75, 90]), windowStart, floorCap)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('aktiveras aldrig när tidsfönstret redan räcker', () => {
    const input = daily(180)
    const result = applyFreeWindow(input, windowStart, floorCap)
    expect(spanDays(result)).toBe(FREE_WINDOW_DAYS)
    expect(result.length).toBeGreaterThan(FREE_MIN_POINTS)
  })

  it('ger aldrig FÄRRE punkter än tidsfönstret redan gav', () => {
    // Två punkter inom fönstret, men de tre senaste sträcker sig förbi taket:
    // golvet får då inte krympa resultatet till noll.
    const input = series([1, 2, 400])
    const result = applyFreeWindow(input, windowStart, floorCap)
    const byTimeOnly = input.filter(d => d.timestamp >= windowStart)
    expect(result.length).toBeGreaterThanOrEqual(byTimeOnly.length)
  })
})

describe('applyFreeWindow — taket', () => {
  it('vägrar öppna flera år för den som loggat tre gånger', () => {
    const result = applyFreeWindow(series([30, 400, 800]), windowStart, floorCap)
    expect(spanDays(result)).toBeLessThanOrEqual(FREE_FLOOR_CAP_DAYS)
  })

  it('håller taket oavsett hur glest det loggats', () => {
    const cases = [
      [0, 31, 62, 93, 124, 155],
      [5, 47, 89, 131, 173],
      [10, 66, 122, 178],
      [30, 400, 800],
      [400, 1100],
      [2, 900, 905],
    ]
    for (const offsets of cases) {
      const result = applyFreeWindow(series(offsets), windowStart, floorCap)
      expect(spanDays(result)).toBeLessThanOrEqual(FREE_FLOOR_CAP_DAYS)
    }
  })
})

describe('applyFreeWindow — regression: golvet mot hela serien', () => {
  /**
   * Buggen: intervallfiltret kördes före golvet, så ett smalt valt intervall
   * (14d) tömde urvalet innan golvet hann agera. Månadsvägaren fick då 1 punkt
   * på 14d men 3 på 30d — alltså olika resultat beroende på knappval.
   */
  it('ger samma resultat oavsett valt intervall för en gles loggare', () => {
    const full = series([0, 31, 62, 93, 124, 155])
    const ranges = [14, 30, 90, Infinity]

    const results = ranges.map(days => {
      const byRange =
        days === Infinity ? full : full.filter(d => d.timestamp >= NOW - days * DAY_MS)
      return applyFreeWindow(byRange, windowStart, floorCap, full)
    })

    for (const r of results) {
      expect(r).toHaveLength(FREE_MIN_POINTS)
      expect(spanDays(r)).toBe(spanDays(results[0]))
    }
  })

  it('utan fullSeries krymper ett smalt intervall resultatet (visar varför argumentet finns)', () => {
    const full = series([0, 31, 62, 93, 124, 155])
    const narrow = full.filter(d => d.timestamp >= NOW - 14 * DAY_MS)
    const withoutFull = applyFreeWindow(narrow, windowStart, floorCap)
    const withFull = applyFreeWindow(narrow, windowStart, floorCap, full)
    expect(withoutFull.length).toBeLessThan(withFull.length)
  })
})

describe('applyFreeWindow — gränsfall', () => {
  it('hanterar tom serie', () => {
    expect(applyFreeWindow([], windowStart, floorCap)).toEqual([])
  })

  it('hanterar en enda mätning', () => {
    const input = series([0])
    expect(applyFreeWindow(input, windowStart, floorCap)).toEqual(input)
  })

  it('muterar inte indata', () => {
    const input = series([0, 31, 62, 93])
    const snapshot = [...input]
    applyFreeWindow(input, windowStart, floorCap)
    expect(input).toEqual(snapshot)
  })

  it('behåller kronologisk ordning', () => {
    const result = applyFreeWindow(series([0, 31, 62, 93, 124]), windowStart, floorCap)
    const timestamps = result.map(d => d.timestamp)
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b))
  })
})

describe('gating-invariant: gratis får aldrig mer än premium', () => {
  /**
   * Den viktigaste regeln, uttryckt som en invariant över många profiler:
   * oavsett loggningsfrekvens och valt intervall får resultatet aldrig
   * överstiga taket, och aldrig innehålla punkter äldre än så.
   */
  const profiles: Record<string, number[]> = {
    daglig: Array.from({ length: 180 }, (_, i) => i),
    var3edag: Array.from({ length: 60 }, (_, i) => i * 3),
    veckovis: Array.from({ length: 26 }, (_, i) => i * 7),
    varannanVecka: Array.from({ length: 13 }, (_, i) => i * 14),
    månadsvis: [0, 31, 62, 93, 124, 155],
    var6eVecka: [5, 47, 89, 131, 173],
    bfVar8eVecka: [10, 66, 122, 178],
    slutadeLogga: [45, 52, 60, 75, 90],
    årIsär: [30, 400, 800],
    återvändare: [2, 900, 905],
    tvåGamla: [400, 1100],
    enda: [0],
    ingen: [],
  }

  it.each(Object.entries(profiles))('%s: aldrig äldre än taket', (_name, offsets) => {
    const full = series(offsets)
    for (const days of [14, 30, 90, Infinity]) {
      const byRange =
        days === Infinity ? full : full.filter(d => d.timestamp >= NOW - days * DAY_MS)
      const result = applyFreeWindow(byRange, windowStart, floorCap, full)
      expect(result.every(d => d.timestamp >= floorCap)).toBe(true)
      expect(spanDays(result)).toBeLessThanOrEqual(FREE_FLOOR_CAP_DAYS)
    }
  })
})
