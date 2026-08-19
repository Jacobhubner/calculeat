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
