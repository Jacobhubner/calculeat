import { describe, it, expect } from 'vitest'
import {
  calculateTimeline,
  calculateGoal,
  calculateDailyCalorieAdjustment,
} from '@/lib/calculations/goalCalculations'
import { estimatePrepDuration } from '@/lib/calculations/contestPrep'

/**
 * Målsättning och perioder svarar på SAMMA fråga — hur lång tid tar det att
 * nå målet — på två ytor. Innan 2026-08-19 gav de olika svar: Målsättning
 * räknade linjärt och underskattade systematiskt, upp till fyra veckor på en
 * lång nedgång. Testerna nedan låser att de nu följs åt.
 */
describe('calculateTimeline — exponentiell vid viktnedgång', () => {
  /** Samma nivå som "Normalt": mitten av 20–25 % underskott. */
  const veckoKalorier = (tdee: number) => {
    const kgMid = (tdee * 0.225 * 7) / 7700
    return calculateDailyCalorieAdjustment(-kgMid) * 7
  }
  const taktProcent = (tdee: number, weightKg: number) =>
    ((tdee * 0.225 * 7) / 7700 / weightKg) * 100

  it('ger samma veckotal som perioder, för hela viktspannet', () => {
    // Inklusive kraftigt överviktiga fall — det är där den gamla linjära
    // modellen felade mest (upp till fyra veckor för kort).
    const fall = [
      { w: 91.1, bf: 9, mal: 7, tdee: 3190 },
      { w: 100, bf: 25, mal: 12, tdee: 2800 },
      { w: 120, bf: 35, mal: 15, tdee: 3200 },
      { w: 150, bf: 45, mal: 20, tdee: 3600 },
    ]

    for (const f of fall) {
      const g = calculateGoal(f.w, f.bf, f.mal)
      const t = calculateTimeline(g.weightToChange, veckoKalorier(f.tdee), f.w)
      const p = estimatePrepDuration({
        currentWeightKg: f.w,
        currentBodyFatPct: f.bf,
        targetBodyFatPct: f.mal,
        weeklyRatePercent: taktProcent(f.tdee, f.w),
      })

      expect(t).not.toBeNull()
      expect(p).not.toBeNull()
      // Samma modell ⇒ samma tal. Tolerans för avrundning till en decimal.
      expect(Math.abs(t!.weeksRequired - p!.weeks)).toBeLessThan(0.15)
    }
  })

  it('tar LÄNGRE tid än den gamla linjära modellen', () => {
    // Riktningen är poängen: den linjära lovade snabbare resultat än möjligt.
    const g = calculateGoal(120, 35, 15)
    const kcal = veckoKalorier(3200)
    const linjar = calculateTimeline(g.weightToChange, kcal)
    const exp = calculateTimeline(g.weightToChange, kcal, 120)
    expect(exp!.weeksRequired).toBeGreaterThan(linjar!.weeksRequired)
  })

  it('behåller linjär modell för viktuppgång', () => {
    // estimatePrepDuration klarar inte uppgång alls, och en bulk följer inte
    // samma avtagande kurva — där ökar TDEE i stället.
    const t = calculateTimeline(5, calculateDailyCalorieAdjustment(0.25) * 7, 80)
    expect(t!.weeksRequired).toBe(20)
  })

  it('faller tillbaka på linjär när startvikt saknas', () => {
    const kcal = calculateDailyCalorieAdjustment(-0.5) * 7
    expect(calculateTimeline(-10, kcal)!.weeksRequired).toBe(20)
  })

  it('visar decimaler i stället för att kollapsa spannet', () => {
    // "3–3 veckor" var det gamla utfallet av Math.round: ett intervall utan
    // bredd, som signalerade precision som inte fanns.
    const g = calculateGoal(91.1, 9, 7)
    const snabb = calculateTimeline(
      g.weightToChange,
      calculateDailyCalorieAdjustment(-((3190 * 0.25 * 7) / 7700)) * 7,
      91.1
    )
    const langsam = calculateTimeline(
      g.weightToChange,
      calculateDailyCalorieAdjustment(-((3190 * 0.2 * 7) / 7700)) * 7,
      91.1
    )
    expect(snabb!.weeksRequired).not.toBe(langsam!.weeksRequired)
    expect(Number.isInteger(snabb!.weeksRequired * 10)).toBe(true)
  })

  it('ger null i stället för NaN vid orimliga indata', () => {
    const kcal = calculateDailyCalorieAdjustment(-0.5) * 7
    // Målvikt under noll
    expect(calculateTimeline(-200, kcal, 100)).toBeNull()
    // Takt som vore hela kroppsvikten på en vecka
    expect(calculateTimeline(-10, calculateDailyCalorieAdjustment(-100) * 7, 50)).toBeNull()
    // Noll förändring
    expect(calculateTimeline(-10, 0, 100)).toBeNull()
  })

  it('ger rimliga veckotal för viktuppgång', () => {
    // Uppgång är spegelvänd: TDEE STIGER med vikten, så ett procentuellt
    // överskott ger FLER kalorier och uppgången går marginellt fortare.
    // Den linjära modellen är därför rätt val här — verifierat mot en
    // simulering vecka för vecka (70 -> 85 kg vid 15 % överskott):
    //   sanning 40 v, linjär 42 v (+2), exponentiell 38 v (-2)
    // Att tvinga på exponentialmodellen skulle luta åt fel håll.
    const kgPerVecka = (2648 * 0.15 * 7) / 7700
    const t = calculateTimeline(15, calculateDailyCalorieAdjustment(kgPerVecka) * 7, 70)
    expect(t).not.toBeNull()
    // Linjärt: 15 kg / 0,36 kg per vecka
    expect(Math.round(t!.weeksRequired)).toBe(42)
  })
})
