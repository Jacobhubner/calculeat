import { describe, it, expect } from 'vitest'
import {
  kgPerWeekToPercent,
  percentToKgPerWeek,
  dailyCalorieDeltaToKgPerWeek,
  kgPerWeekToDailyCalorieDelta,
  weeklyRateForCalories,
} from './weeklyRate'

/**
 * Låser omräkningen som tidigare gjordes olika på tre ställen.
 * Den konkreta buggen: -500 kcal/dag påstods ge 0,5 kg/vecka.
 */

describe('dailyCalorieDeltaToKgPerWeek', () => {
  it('500 kcal/dag ger 0,45 kg/vecka — INTE 0,5', () => {
    expect(dailyCalorieDeltaToKgPerWeek(500)).toBeCloseTo(0.4545, 3)
  })

  it('7700 kcal/vecka = exakt 1 kg', () => {
    expect(dailyCalorieDeltaToKgPerWeek(1100)).toBeCloseTo(1.0, 5)
  })

  it('noll ger noll', () => {
    expect(dailyCalorieDeltaToKgPerWeek(0)).toBe(0)
  })

  it('negativt delta (överskott) ger viktuppgång', () => {
    expect(dailyCalorieDeltaToKgPerWeek(-500)).toBeCloseTo(-0.4545, 3)
  })
})

describe('kgPerWeekToDailyCalorieDelta', () => {
  it('är invers till dailyCalorieDeltaToKgPerWeek', () => {
    const kcal = 613
    expect(kgPerWeekToDailyCalorieDelta(dailyCalorieDeltaToKgPerWeek(kcal))).toBeCloseTo(kcal, 6)
  })
})

describe('kgPerWeekToPercent / percentToKgPerWeek', () => {
  it('0,56 kg/v för 80 kg ger 0,7 %', () => {
    expect(kgPerWeekToPercent(0.56, 80)).toBeCloseTo(0.7, 5)
  })

  it('är varandras invers', () => {
    expect(percentToKgPerWeek(kgPerWeekToPercent(0.6, 75), 75)).toBeCloseTo(0.6, 6)
  })

  it('skyddar mot division med noll', () => {
    expect(kgPerWeekToPercent(0.5, 0)).toBe(0)
  })

  it('samma %-takt ger olika kg för olika kroppsvikt', () => {
    // Kärnan i varför kroppsvikt valdes som bas
    expect(percentToKgPerWeek(0.7, 60)).toBeCloseTo(0.42, 5)
    expect(percentToKgPerWeek(0.7, 120)).toBeCloseTo(0.84, 5)
  })
})

describe('weeklyRateForCalories', () => {
  const base = { tdee: 2500, weightKg: 80 }

  it('räknar 20 % underskott till ~0,45 kg/v', () => {
    const r = weeklyRateForCalories({ ...base, caloriesMin: 2000, caloriesMax: 2000 })
    expect(r.kgMin).toBeCloseTo(0.4545, 3)
    expect(r.percentMin).toBeCloseTo(0.568, 2)
  })

  it('vänder intervallet så min alltid är den lägre takten', () => {
    // Lägre intag = större underskott = snabbare tapp
    const r = weeklyRateForCalories({ ...base, caloriesMin: 1875, caloriesMax: 2000 })
    expect(r.kgMin).toBeLessThan(r.kgMax)
    expect(r.kgMax).toBeCloseTo(dailyCalorieDeltaToKgPerWeek(625), 5)
  })

  it('ger negativ takt vid överskott (viktuppgång)', () => {
    const r = weeklyRateForCalories({ ...base, caloriesMin: 2750, caloriesMax: 2750 })
    expect(r.kgMin).toBeLessThan(0)
  })

  it('ger noll vid underhåll', () => {
    const r = weeklyRateForCalories({ ...base, caloriesMin: 2500, caloriesMax: 2500 })
    expect(r.kgMin).toBeCloseTo(0, 6)
    expect(r.percentMin).toBeCloseTo(0, 6)
  })
})
