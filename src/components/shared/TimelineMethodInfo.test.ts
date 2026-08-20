import { estimatePrepDuration, estimateDurationToWeight } from '@/lib/calculations/contestPrep'
import { describe, it, expect } from 'vitest'
import {
  calculateGoal,
  calculateTimeline,
  calculateDailyCalorieAdjustment,
} from '@/lib/calculations/goalCalculations'

/**
 * Tabellen i TimelineMethodInfo påstår konkreta veckotal för tre fall. Går de
 * isär från vad koden faktiskt räknar ut visar appen en förklaring som den
 * själv motsäger — värre än ingen förklaring alls.
 *
 * Siffrorna bygger på TDEE ur Mifflin-St Jeor för en man på 180 cm, 35 år,
 * PAL 1,6. "Sanning" är en simulering vecka för vecka med TDEE omräknat varje
 * vecka, alltså det som faktiskt händer när målet är en andel av förbrukningen.
 */
describe('TimelineMethodInfo — tabellen', () => {
  const tdeeAt = (w: number) => (10 * w + 6.25 * 180 - 5 * 35 + 5) * 1.6

  /** Exakt de rader som står i modalen. */
  const rader = [
    { w: 80, bf: 20, mal: 8, sanning: 22, linjar: 20, calculeat: 22 },
    { w: 100, bf: 25, mal: 12, sanning: 27, linjar: 26, calculeat: 28 },
    { w: 120, bf: 35, mal: 15, sanning: 49, linjar: 45, calculeat: 51 },
  ]

  it('visar samma tal som beräkningarna ger', () => {
    for (const r of rader) {
      const g = calculateGoal(r.w, r.bf, r.mal)
      const kgPerVecka = (tdeeAt(r.w) * 0.2 * 7) / 7700
      const veckoKalorier = calculateDailyCalorieAdjustment(-kgPerVecka) * 7

      const linjar = calculateTimeline(g.weightToChange, veckoKalorier)
      const exponentiell = calculateTimeline(g.weightToChange, veckoKalorier, r.w)

      expect(Math.round(linjar!.weeksRequired)).toBe(r.linjar)
      expect(Math.round(exponentiell!.weeksRequired)).toBe(r.calculeat)
    }
  })

  it('har en "sanning" som stämmer med en simulering vecka för vecka', () => {
    for (const r of rader) {
      const wT = calculateGoal(r.w, r.bf, r.mal).targetWeight
      let w = r.w
      let veckor = 0
      while (w > wT && veckor < 400) {
        w -= (tdeeAt(w) * 0.2 * 7) / 7700
        veckor++
      }
      expect(veckor).toBe(r.sanning)
    }
  })

  it('visar att den linjära modellen alltid underskattar', () => {
    // Riktningen är hela poängen med tabellen: den linjära lovar snabbare
    // resultat än möjligt, aldrig långsammare.
    for (const r of rader) {
      expect(r.linjar).toBeLessThan(r.sanning)
      expect(r.calculeat).toBeGreaterThanOrEqual(r.sanning)
    }
  })
})

/**
 * Modalen VISAR ekvationerna för premiumanvändare. Skulle de glida isär från
 * koden vore det värre än att inte visa dem alls — en formel som inte
 * stämmer är ett falskt löfte om insyn.
 *
 * Testerna räknar därför för hand med exakt de formler som står i EQUATIONS
 * och jämför mot vad funktionerna returnerar.
 */
describe('ekvationerna i modalen stämmer med koden', () => {
  it('kärnekvationen', () => {
    const w = 95,
      r = 0.006,
      mal = 87
    // Modalens formel: v = ln(målvikt/startvikt) / ln(1 − r)
    const manuell = Math.log(mal / w) / Math.log(1 - r)
    const kod = estimateDurationToWeight({
      currentWeightKg: w,
      targetWeightKg: mal,
      weeklyRatePercent: r * 100,
    })!
    expect(Math.abs(manuell - kod.weeks)).toBeLessThan(0.1)
  })

  it('målvikt ur fettprocent', () => {
    const w = 95,
      bf = 28,
      mal = 20
    // Modalens formel
    const lean = w * (1 - bf / 100)
    const malvikt = lean / (1 - mal / 100)
    const kod = estimatePrepDuration({
      currentWeightKg: w,
      currentBodyFatPct: bf,
      targetBodyFatPct: mal,
      weeklyRatePercent: 0.6,
    })!
    expect(Math.abs(malvikt - kod.projectedWeightKg)).toBeLessThan(0.1)
  })

  it('spannets övre gräns', () => {
    const w = 95,
      bf = 28,
      mal = 20,
      rate = 0.6
    const t = mal / 100,
      f = 0.15
    const fettmassa = w * (bf / 100)
    // Modalens formel
    const forlust = (t * w - fettmassa) / (t - 1 + f)
    const slutvikt = w - forlust
    const manuell = Math.log(slutvikt / w) / Math.log(1 - rate / 100)
    const kod = estimatePrepDuration({
      currentWeightKg: w,
      currentBodyFatPct: bf,
      targetBodyFatPct: mal,
      weeklyRatePercent: rate,
    })!
    expect(Math.abs(manuell - kod.weeksRealistic)).toBeLessThan(0.1)
  })
})
