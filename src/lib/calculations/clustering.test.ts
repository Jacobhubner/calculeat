import { describe, it, expect } from 'vitest'
import { buildClusters } from './calibration-clustering'
import { MIN_CLUSTER_SIZE, MIN_CLUSTER_SEPARATION_DAYS } from './calibration-constants'
import { daysBetween, meanDate } from './calibration-helpers'
import type { WeightHistory } from '@/lib/types'

/**
 * buildClusters är modulens mest kvalitetskritiska funktion — den avgör
 * vilka två tidpunkter hela TDEE-beräkningen jämför — och saknade tester
 * helt. Ett fel här ger inte ett blockerat läge utan en TYST felaktig
 * siffra, vilket är den värsta sorten.
 *
 * Testerna låser särskilt de två reglerna som hör ihop: 50 %-fallbacken och
 * separationskravet. Fallbacken ensam (tröskeln flyttad från noll till
 * MIN_CLUSTER_SIZE) släpper igenom kluster som beskriver nästan samma
 * tidpunkt — mätt: 2 568 lägen med tidsbas under 7 dagar, ned till 2,5.
 * Separationskravet är vad som gör den säker, och de får därför aldrig
 * skiljas åt.
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
   * Fallbacken utlöses vid < MIN_CLUSTER_SIZE, inte vid noll.
   *
   * Villkoret var === 0 medan anroparna kräver två, vilket gjorde grinden
   * icke-monoton: EN mätning i startzonen var strikt sämre än ingen alls,
   * så att LÄGGA TILL en vägning kunde förstöra ett läge som hållit.
   */
  it('utvidgar zonen när den inte rymmer ett fullstort kluster', () => {
    // Startzonen (dag 14 → 9,33) är tom; utvidgad till halva fönstret
    // fångar den dag 11 och 10. Tidsbasen blir 10,5 dagar och klarar golvet.
    const r = buildClusters(at([11, 10, 1, 0]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.startCluster.count).toBeGreaterThanOrEqual(MIN_CLUSTER_SIZE[14])
  })

  it('blockerar när utvidgningen inte räcker till tidsbasen', () => {
    // [8,7,2,1] fyller båda klustren men centroiderna ligger 6 dagar isär.
    // Utvidgningen får inte köpa ett kluster på bekostnad av mätbarheten.
    expect(buildClusters(at([8, 7, 2, 1]), 14, new Date())).toBeNull()
  })

  it('straffar inte en ensam mätning i startzonen', () => {
    // Samma data plus en vägning dag 10. Förut fastnade klustret på 1 < 2
    // eftersom utvidgningen bara skedde vid exakt noll.
    const r = buildClusters(at([10, 8, 2, 1]), 14, new Date())
    expect(r).not.toBeNull()
    expect(r!.startCluster.count).toBeGreaterThanOrEqual(MIN_CLUSTER_SIZE[14])
  })

  it.each([[[10, 8, 2, 1]], [[13, 7, 2, 1]], [[10, 9, 5, 1, 0]]])(
    'släpper igenom %o, som har gott om tidsbas',
    offs => {
      const r = buildClusters(at(offs), 14, new Date())
      expect(r).not.toBeNull()
      expect(r!.startCluster.count).toBeGreaterThanOrEqual(2)
      expect(r!.endCluster.count).toBeGreaterThanOrEqual(2)
    }
  )
})

describe('buildClusters — separationskravet', () => {
  /**
   * Utvidgningen ensam vore farlig: två halvfönster möts i mitten och kan
   * ge kluster som beskriver nästan samma tidpunkt. Tidsbasen är nämnaren
   * i dailyCalorieBalance, så en komprimerad bas blåser upp den beräknade
   * energibalansen — 0,3 kg vägningsbrus kostar ~300 kcal/dag vid 7 dagar
   * men det dubbla vid 3,5.
   *
   * Regeln fanns i runCalibration men inte i hooken, så kortet kunde säga
   * "redo" om data som knappen sedan nekade. Nu ärver alla anropare den.
   */
  it.each([[[10, 9, 8, 7, 6]], [[7, 6, 5, 4]], [[12, 8, 7, 6, 5]]])(
    'blockerar %o, där klustren ligger för nära i tid',
    offs => {
      const r = buildClusters(at(offs), 14, new Date())
      if (r) {
        // Håller den ändå ska tidsbasen bära en mätning.
        expect(timeBase(r)).toBeGreaterThanOrEqual(MIN_CLUSTER_SEPARATION_DAYS)
      }
    }
  )

  it('ger aldrig en tidsbas under golvet, oavsett mönster', () => {
    // Uttömmande svep: 424 149 godkända klustringar, minsta tidsbas 7,00.
    let minTb = Infinity
    for (const P of [14, 21, 28] as const) {
      const need = { 14: 4, 21: 5, 28: 6 }[P]
      const rec = (from: number, acc: number[]) => {
        if (acc.length === need) {
          const r = buildClusters(at(acc), P, new Date())
          if (r && r.startCluster.count >= 2 && r.endCluster.count >= 2) {
            minTb = Math.min(minTb, timeBase(r))
          }
          return
        }
        for (let d = from; d <= P; d++) rec(d + 1, [...acc, d])
      }
      rec(0, [])
    }
    expect(minTb).toBeGreaterThanOrEqual(MIN_CLUSTER_SEPARATION_DAYS)
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
