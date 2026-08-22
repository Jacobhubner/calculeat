import { describe, it, expect } from 'vitest'
import {
  checkPeriodEligibility,
  findBestPeriod,
  projectRawTDEE,
  checkProjectedTDEE,
} from './calibration-eligibility'
import { runCalibration } from './calibration-core'
import { calibrationNow } from './calibration-clock'
import { MIN_DATA_POINTS } from './calibration-constants'
import type { WeightHistory } from '@/lib/types'

/**
 * checkPeriodEligibility ersatte tre utskrivna kopior av samma kedja —
 * räkna vägningar, bygg kluster, validera. Varje kopia hade sin egen
 * uppsättning kontroller, och varje gång en regel lades till i motorn
 * glömdes minst en av dem.
 *
 * Testerna låser det som gör kopiorna onödiga: att svaret här är detsamma
 * som motorns.
 */

const DAY = 86400000

function kurva(offsets: number[], lutningPerDag = 0, brus = 0): WeightHistory[] {
  const now = calibrationNow().getTime()
  const span = Math.max(...offsets)
  return offsets.map((o, i) => {
    const iso = new Date(now - o * DAY).toISOString()
    return {
      id: `e${i}`,
      user_id: 'u1',
      weight_kg: 85 + lutningPerDag * (span - o) + brus * Math.sin(i * 2.1),
      recorded_at: iso,
      created_at: iso,
    } as WeightHistory
  })
}

describe('checkPeriodEligibility — antalskravet', () => {
  it('stoppar innan klustring när vägningarna är för få', () => {
    const r = checkPeriodEligibility(kurva([13, 1]), 14, calibrationNow())
    expect(r.eligible).toBe(false)
    expect(r.clusters).toBeNull()
    expect(r.reason).toContain(`minst ${MIN_DATA_POINTS[14]}`)
  })

  it('rapporterar vägningarna i fönstret även när svaret är nej', () => {
    // Anroparen visar antalet i UI:t; det ska finnas oavsett utfall.
    const r = checkPeriodEligibility(kurva([13, 1]), 14, calibrationNow())
    expect(r.weightsInPeriod).toHaveLength(2)
  })

  it('räknar bara vägningar inom perioden', () => {
    const r = checkPeriodEligibility(kurva([40, 13, 12, 1, 0]), 14, calibrationNow())
    expect(r.weightsInPeriod).toHaveLength(4)
  })
})

describe('checkPeriodEligibility — samma svar som motorn', () => {
  /**
   * Det här är hela poängen med modulen. Går perioden att välja ska
   * runCalibration också kunna köra den — TDEE-golvet och -taket undantaget,
   * eftersom de kräver att hela pipelinen körts.
   */
  it('godkänner aldrig en period motorn nekar', () => {
    const now = calibrationNow()
    let godkanda = 0
    let nekade = 0

    for (const offsets of [
      [13, 12, 1, 0],
      [13, 12, 8, 4, 1, 0],
      [20, 19, 10, 1, 0],
      [27, 26, 14, 13, 1, 0],
      [27, 20, 13, 6, 1, 0],
    ]) {
      for (const lutning of [0, -0.05, -0.2, -0.4]) {
        for (const brus of [0, 0.5, 2.5]) {
          const hist = kurva(offsets, lutning, brus)
          for (const period of [14, 21, 28] as const) {
            if (!checkPeriodEligibility(hist, period, now).eligible) continue
            godkanda++
            const r = runCalibration({
              weightHistory: hist,
              periodDays: period,
              currentTDEE: 2500,
              targetCalories: 2100,
              actualCaloriesAvg: 2100,
              foodLogCompleteness: 100,
              daysWithLogData: 20,
              isFirstCalibration: true,
              now,
            })
            if (
              typeof r === 'string' &&
              !r.includes('rekommenderad') &&
              !r.includes('orealistiskt')
            ) {
              nekade++
            }
          }
        }
      }
    }

    expect(godkanda).toBeGreaterThan(0)
    expect(nekade).toBe(0)
  })

  it('ger motorns eget besked när perioden inte håller', () => {
    // För snabb viktförändring: ska nämna den fysiologiska gränsen, inte
    // falla tillbaka på ett antalsmeddelande.
    const r = checkPeriodEligibility(kurva([13, 12, 1, 0], -0.4), 14, calibrationNow())
    expect(r.eligible).toBe(false)
    expect(r.reason).toContain('fysiologisk')
  })
})

describe('findBestPeriod', () => {
  it('väljer den längsta period som håller', () => {
    // Underlag som täcker hela 28 dagar med bra spridning.
    const r = findBestPeriod(kurva([27, 26, 20, 14, 8, 1, 0], -0.02), calibrationNow())
    expect(r).not.toBeNull()
    expect(r!.period).toBe(28)
  })

  it('faller tillbaka till en kortare period när den långa inte håller', () => {
    // Bara vägningar inom de senaste 14 dagarna.
    const r = findBestPeriod(kurva([13, 12, 1, 0], -0.02), calibrationNow())
    expect(r).not.toBeNull()
    expect(r!.period).toBe(14)
  })

  it('returnerar null när ingen period håller', () => {
    expect(findBestPeriod(kurva([1, 0]), calibrationNow())).toBeNull()
  })

  it('lämnar tillbaka klustren så anroparen slipper bygga om dem', () => {
    const r = findBestPeriod(kurva([13, 12, 1, 0], -0.02), calibrationNow())
    expect(r!.result.clusters).not.toBeNull()
    expect(r!.result.clusters!.startCluster.count).toBeGreaterThanOrEqual(2)
  })
})

describe('projectRawTDEE — samma siffra som motorn', () => {
  /**
   * Golvet och taket avvisade underlag EFTER knapptrycket, och jag antog
   * länge att det var oundvikligt eftersom rawTDEE "kommer ur hela
   * pipelinen". Det stämde inte: rawTDEE är averageCalories minus daglig
   * energibalans, och båda går att räkna ur samma kluster och loggdata som
   * grinden redan har. Klämmorna påverkar clampedTDEE, inte rawTDEE.
   *
   * Testet låser att projektionen är samma beräkning, inte en uppskattning.
   * Skulle den glida isär vore den värre än ingen kontroll alls — den
   * skulle neka underlag motorn hade accepterat.
   */
  it('ger identisk rawTDEE', () => {
    const now = calibrationNow()
    let jamforda = 0
    let maxDiff = 0

    for (const offsets of [
      [13, 12, 8, 4, 1, 0],
      [20, 19, 10, 5, 1, 0],
      [27, 26, 14, 13, 1, 0],
    ]) {
      for (const lutning of [0, -0.03, -0.08, 0.05]) {
        for (const intag of [1600, 2100, 2600]) {
          const hist = kurva(offsets, lutning)
          const period = (offsets[0] <= 14 ? 14 : offsets[0] <= 21 ? 21 : 28) as 14 | 21 | 28
          const e = checkPeriodEligibility(hist, period, now)
          if (!e.clusters) continue

          const projected = projectRawTDEE(e.clusters, period, intag, 2100, 20)
          if (projected === null) continue

          const r = runCalibration({
            weightHistory: hist,
            periodDays: period,
            currentTDEE: 2500,
            targetCalories: 2100,
            actualCaloriesAvg: intag,
            foodLogCompleteness: 100,
            daysWithLogData: 20,
            isFirstCalibration: true,
            now,
          })
          if (typeof r === 'string') continue

          jamforda++
          maxDiff = Math.max(maxDiff, Math.abs(projected - r.rawTDEE))
        }
      }
    }

    expect(jamforda).toBeGreaterThan(0)
    // Samma beräkning, inte en approximation.
    expect(maxDiff).toBeLessThan(0.01)
  })

  it('returnerar null utan loggat intag', () => {
    const e = checkPeriodEligibility(kurva([13, 12, 1, 0], -0.02), 14, calibrationNow())
    expect(projectRawTDEE(e.clusters!, 14, null, 2100, 20)).toBeNull()
    expect(projectRawTDEE(e.clusters!, 14, 2100, 2100, 0)).toBeNull()
  })
})

describe('checkProjectedTDEE', () => {
  it('känner igen ett orimligt lågt värde', () => {
    expect(checkProjectedTDEE(900)).toContain('minimigräns')
  })

  it('känner igen ett orimligt högt värde', () => {
    expect(checkProjectedTDEE(6000)).toContain('orealistiskt')
  })

  it('släpper igenom rimliga värden och saknad projektion', () => {
    expect(checkProjectedTDEE(2400)).toBeNull()
    expect(checkProjectedTDEE(null)).toBeNull()
  })
})
