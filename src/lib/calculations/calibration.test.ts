import { describe, it, expect } from 'vitest'
import { runCalibration, type CalibrationInput } from './calibration-core'
import { MIN_LOG_DAYS_FOR_CALIBRATION } from './calibration-constants'
import type { WeightHistory } from '@/lib/types'

/**
 * Låser två fel som fanns i produktion 2026-08-16:
 *
 *  1. Kalibrering kördes utan ETT ENDA loggat dygn. getCalorieEstimate föll
 *     då tillbaka på targetCalories, dvs. TDEE kalibrerades mot vad
 *     användaren TÄNKTE äta i stället för vad hen åt — cirkulärt, men
 *     presenterat som en mätning.
 *
 *  2. Vid noll loggdagar blev priorWeight = 0, vilket märkte resultatet som
 *     'food_log' och sparade used_food_log: true. Appen påstod alltså att
 *     siffran kom från matloggen när ingen mat loggats.
 */

const NOW = new Date('2026-08-16T08:00:00Z')

/** Vikthistorik med jämn nedgång — tillräckligt tät för att passera klustren. */
function weightSeries(days: number, startKg: number, dailyDeltaKg: number): WeightHistory[] {
  const out: WeightHistory[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(NOW.getTime() - (days - i) * 24 * 60 * 60 * 1000)
    out.push({
      id: `w${i}`,
      user_id: 'u1',
      weight_kg: startKg + dailyDeltaKg * i,
      recorded_at: d.toISOString(),
      created_at: d.toISOString(),
    })
  }
  return out
}

function baseInput(overrides: Partial<CalibrationInput> = {}): CalibrationInput {
  return {
    weightHistory: weightSeries(28, 85, -0.02), // ~0,56 kg/vecka ned
    periodDays: 28,
    currentTDEE: 2500,
    targetCalories: 2000,
    actualCaloriesAvg: 2050,
    foodLogCompleteness: 90,
    daysWithLogData: 25,
    isFirstCalibration: true,
    now: NOW,
    ...overrides,
  }
}

describe('runCalibration — krav på matloggdata', () => {
  it('blockerar när inga dagar loggats', () => {
    const r = runCalibration(baseInput({ actualCaloriesAvg: null, daysWithLogData: 0 }))
    expect(typeof r).toBe('string')
    expect(r).toContain('loggade dagar')
  })

  it('blockerar strax under tröskeln', () => {
    const r = runCalibration(baseInput({ daysWithLogData: MIN_LOG_DAYS_FOR_CALIBRATION - 1 }))
    expect(typeof r).toBe('string')
  })

  it('släpper igenom precis på tröskeln', () => {
    const r = runCalibration(baseInput({ daysWithLogData: MIN_LOG_DAYS_FOR_CALIBRATION }))
    expect(typeof r).toBe('object')
  })

  it('felmeddelandet säger hur många dagar som saknas', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 3 }))
    expect(r).toContain('3')
    expect(r).toContain(String(MIN_LOG_DAYS_FOR_CALIBRATION))
  })
})

describe('runCalibration — loggningen måste täcka mätperioden', () => {
  /** Datum N dagar tillbaka, som YYYY-MM-DD */
  const dayISO = (daysAgo: number) =>
    new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  it('blockerar när loggdagarna ligger samlade i periodens ena halva', () => {
    // 7 loggdagar, men alla i den äldre halvan: intaget beskriver en annan
    // tid än den viktförändring som mätts över hela perioden.
    const r = runCalibration(
      baseInput({
        daysWithLogData: 7,
        loggedDates: [21, 22, 23, 24, 25, 26, 27].map(dayISO),
      })
    )
    expect(typeof r).toBe('string')
    expect(r).toContain('täcker')
  })

  it('tillåter när loggningen är spridd över perioden', () => {
    const spread = Array.from({ length: 20 }, (_, i) => dayISO(i))
    const r = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: spread }))
    expect(typeof r).toBe('object')
  })

  it('hoppar över kontrollen när datum saknas (bakåtkompatibelt)', () => {
    const r = runCalibration(baseInput({ loggedDates: undefined }))
    expect(typeof r).toBe('object')
  })

  it('felmeddelandet säger hur många dagar som behövs', () => {
    const r = runCalibration(
      baseInput({ daysWithLogData: 7, loggedDates: [24, 25, 26, 27, 28, 29, 30].map(dayISO) })
    )
    expect(typeof r).toBe('string')
    expect(r).toMatch(/\d+ av \d+ dagar/)
  })
})

describe('runCalibration — veckodagsbias begränsar justeringen', () => {
  /** Loggade datum inom perioden, valfritt bara vardagar */
  const datesIn = (count: number, weekdaysOnly: boolean) => {
    const out: string[] = []
    for (let i = 0; out.length < count && i < 60; i++) {
      const d = new Date(NOW.getTime() - i * 86400000)
      const day = d.getDay()
      if (weekdaysOnly && (day === 0 || day === 6)) continue
      out.push(d.toISOString().slice(0, 10))
    }
    return out
  }

  it('varnar när bara vardagar loggats', () => {
    // 20 vardagar behövs för att klara täckningskravet (28-dagarsperiod) och
    // därmed nå bias-kontrollen — 14 vardagar spänner bara 48 % av perioden.
    const r = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, true) }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') {
      expect(r.warnings.some(w => w.type === 'weekday_bias')).toBe(true)
    }
  })

  it('varnar inte när urvalet är representativt', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, false) }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') {
      expect(r.warnings.some(w => w.type === 'weekday_bias')).toBe(false)
    }
  })

  it('snedvridet urval flyttar TDEE mindre än representativt', () => {
    // Samma antal loggdagar och samma intag — enda skillnaden är VILKA dagar
    const biased = runCalibration(
      baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, true) })
    )
    const fair = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, false) }))
    if (typeof biased === 'object' && typeof fair === 'object') {
      const biasedMove = Math.abs(biased.clampedTDEE - 2500)
      const fairMove = Math.abs(fair.clampedTDEE - 2500)
      expect(biasedMove).toBeLessThanOrEqual(fairMove)
    }
  })
})

describe('runCalibration — calorieSource märks ärligt', () => {
  it('märks food_log när loggen är i princip komplett', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 28, foodLogCompleteness: 100 }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') expect(r.calorieSource).toBe('food_log')
  })

  it('märks blended när loggen är delvis ifylld', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 14, foodLogCompleteness: 50 }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') expect(r.calorieSource).toBe('blended')
  })

  it('märker ALDRIG food_log utan loggat intag', () => {
    // Kärnan i fel 2: priorWeight = 0 gav tidigare 'food_log' här.
    // Blockeringen fångar fallet nu, men om tröskeln någon gång sänks får
    // etiketten inte ljuga.
    const r = runCalibration(
      baseInput({
        actualCaloriesAvg: null,
        daysWithLogData: 0,
        foodLogCompleteness: 0,
      })
    )
    if (typeof r === 'object') {
      expect(r.calorieSource).toBe('target_calories')
    } else {
      expect(r).toContain('loggade dagar')
    }
  })
})
