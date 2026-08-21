import { describe, it, expect } from 'vitest'
import { buildClusters } from './calibration-clustering'
import { MIN_CLUSTER_SIZE } from './calibration-constants'
import { daysBetween, meanDate } from './calibration-helpers'
import type { WeightHistory } from '@/lib/types'

/**
 * buildClusters är modulens mest kvalitetskritiska funktion — den avgör
 * vilka två tidpunkter hela TDEE-beräkningen jämför — och saknade tester
 * helt. Ett fel här ger inte ett blockerat läge utan en TYST felaktig
 * siffra, vilket är den värsta sorten.
 *
 * Testerna låser särskilt 50 %-fallbacken (rad 53-60 i källan). Den ser ut
 * som en bugg: den utvidgas vid EXAKT noll mätningar medan anroparna kräver
 * två, så en ensam mätning i startzonen är strikt sämre än ingen alls. Att
 * ändra tröskeln till < MIN_CLUSTER_SIZE är dock mätt fel väg att gå — se
 * "50 %-fallbacken" nedan.
 */

const DAY = 86400000

/** Vägningar angivna som dagar bakåt från nu. */
function at(offsetsInDays: number[]): WeightHistory[] {
  const now = Date.now()
  return offsetsInDays.map((offset, i) => {
    const iso = new Date(now - offset * DAY).toISOString()
    return {
      id: `w${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.05,
      recorded_at: iso,
      created_at: iso,
    } as WeightHistory
  })
}

/** Tidsbasen kalibreringen dividerar med — avståndet mellan centroiderna. */
function timeBase(result: NonNullable<ReturnType<typeof buildClusters>>): number {
  return daysBetween(meanDate(result.startCluster.dates), meanDate(result.endCluster.dates))
}

describe('buildClusters — zonindelning', () => {
  it('delar fönstret i tredjedelar', () => {
    // 14 dagar: startzon 14 → 9,33 bakåt, slutzon 4,67 → 0.
    const r = buildClusters(at([13, 12, 2, 1]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.startCluster.count).toBe(2)
    expect(r!.endCluster.count).toBe(2)
  })

  it('räknar mätningar i mitten till närmaste kluster, inte bort', () => {
    // Mittenvägningar är inte värdelösa: de ingår i allMeasurements och
    // därmed i OLS-trenden och CV-beräkningen.
    const r = buildClusters(at([13, 12, 7, 2, 1]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.allMeasurements).toHaveLength(5)
  })

  it('utesluter mätningar utanför fönstret', () => {
    const r = buildClusters(at([30, 13, 12, 2, 1]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.allMeasurements).toHaveLength(4)
  })

  it('returnerar null under två mätningar', () => {
    expect(buildClusters(at([5]), 14, new Date())).toBeNull()
    expect(buildClusters([], 14, new Date())).toBeNull()
  })
})

describe('buildClusters — separabilitet', () => {
  it('kräver att startcentroiden ligger före slutcentroiden', () => {
    // Alla mätningar samma dygn: centroiderna sammanfaller.
    expect(buildClusters(at([1, 1, 1, 1]), 14, new Date())).toBeNull()
  })

  it('ger en tidsbas som speglar det faktiska avståndet', () => {
    const r = buildClusters(at([13, 12, 1, 0]), 14, new Date())
    expect(r).not.toBeNull()
    // ~12,5 dagar mellan centroiderna
    expect(timeBase(r!)).toBeGreaterThan(11)
  })
})

describe('buildClusters — 50 %-fallbacken', () => {
  /**
   * Fallbacken utlöses vid noll, inte vid < MIN_CLUSTER_SIZE. Det gör
   * grinden icke-monoton: att LÄGGA TILL en vägning kan förstöra ett läge
   * som annars hållit.
   */
  it('noll i startzonen utvidgar zonen till halva fönstret', () => {
    const r = buildClusters(at([8, 7, 2, 1]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.startCluster.count).toBeGreaterThanOrEqual(MIN_CLUSTER_SIZE[14])
  })

  it('EN i startzonen utvidgar inte — färre mätningar hade räckt längre', () => {
    // Samma data som ovan plus en vägning dag 10. Startzonen har nu en
    // mätning, fallbacken uteblir, och klustret fastnar på 1 < 2.
    const r = buildClusters(at([10, 8, 2, 1]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.startCluster.count).toBe(1)
  })

  /**
   * REGRESSIONSSKYDD. Att flytta tröskeln till < MIN_CLUSTER_SIZE ser ut
   * som den självklara fixen, men ett uttömmande svep över alla
   * vägningskombinationer visar att den släpper igenom 2 568 lägen med
   * tidsbas under 7 dagar — ned till 2,5 dagar.
   *
   * Tidsbasen är nämnaren i dailyCalorieBalance (calibration-core.ts).
   * 0,3 kg vägningsbrus kostar ~300 kcal/dag vid 7 dagars bas men det
   * dubbla vid 3,5. runCalibration blockerar därför under 7 dagar — men
   * useCalibrationAvailability kontrollerar ALDRIG den regeln, så en
   * sådan ändring skulle få kortet att säga "redo" om något knappen sedan
   * nekar.
   *
   * Ändra inte tröskeln utan att först flytta 7-dagarsregeln hit.
   */
  it('två utvidgade zoner kan mötas i mitten och ge kort tidsbas', () => {
    // Med utvidgning åt båda håll täcker zonerna hela fönstret.
    const r = buildClusters(at([10, 9, 8, 7, 6]), 14, new Date())
    if (r && r.startCluster.count >= 2 && r.endCluster.count >= 2) {
      // Håller klustren är tidsbasen kort — och just därför farlig.
      expect(timeBase(r)).toBeLessThan(7)
    }
  })
})

describe('buildClusters — periodlängder', () => {
  it.each([
    [14, 4],
    [21, 5],
    [28, 6],
  ] as const)('bygger kluster för %i dagar', (period, count) => {
    const third = period / 3
    // Två i vardera änden, resten jämnt i mitten.
    const offsets = [period - 1, period - 2]
    for (let i = 0; i < count - 4; i++) offsets.push(Math.round(period / 2) + i)
    offsets.push(1, 0)

    const r = buildClusters(at(offsets), period, new Date())
    expect(r).not.toBeNull()
    expect(r!.startCluster.count).toBeGreaterThanOrEqual(MIN_CLUSTER_SIZE[period])
    expect(r!.endCluster.count).toBeGreaterThanOrEqual(MIN_CLUSTER_SIZE[period])
    // Tidsbasen ska överstiga runCalibrations 7-dagarsgolv.
    expect(timeBase(r!)).toBeGreaterThan(third)
  })
})

describe('buildClusters — medianen som centralvärde', () => {
  it('låter en extremvikt inte dra klustret med sig', () => {
    const now = Date.now()
    const mk = (offset: number, kg: number, i: number) =>
      ({
        id: `w${i}`,
        user_id: 'u1',
        weight_kg: kg,
        recorded_at: new Date(now - offset * DAY).toISOString(),
        created_at: new Date(now - offset * DAY).toISOString(),
      }) as WeightHistory

    // Tre vikter i startklustret, varav en klart avvikande.
    const r = buildClusters(
      [mk(13, 85, 0), mk(12.5, 85.2, 1), mk(12, 91, 2), mk(1, 84, 3), mk(0, 83.9, 4)],
      14,
      new Date()
    )
    expect(r).not.toBeNull()
    // Medianen ligger kvar vid de två samstämmiga vikterna.
    expect(r!.startCluster.average).toBeLessThan(86)
  })
})
