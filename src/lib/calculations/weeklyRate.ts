/**
 * Veckovis viktförändring — EN gemensam källa.
 *
 * BAKGRUND (2026-08-16): tre ställen räknade veckotakten på olika sätt och
 * gav olika svar för samma användare:
 *  - Målsättning: % av TDEE  -> (tdee * pct * 7) / 7700
 *  - Kostläge Cut: % av KROPPSVIKT -> weight * 0.005..0.01
 *  - calories.ts: hårdkodade tal (-500 kcal påstods ge 0,5 kg/v; rätt är 0,45)
 *
 * Kroppsviktsprocent är nu den gemensamma enheten. Det är basen litteraturen
 * själv använder — Garthe I et al., Int J Sport Nutr Exerc Metab 2011;21(2):97-104
 * (doi: 10.1123/ijsnem.21.2.97) mäter i %/vecka, inte i % av TDEE — och den är
 * lika säker oavsett kroppsstorlek: 25 % underskott betyder helt olika saker
 * för 60 kg och 120 kg, medan 0,7 %/vecka är samma påfrestning för båda.
 */

import { KCAL_PER_KG } from './calibration-constants'

/**
 * Rekommenderade veckotakter i % av kroppsvikt.
 *
 * Viktnedgång: Garthe 2011 (RCT, n=24) — 0,7 %/vecka gav ÖKAD fettfri massa,
 * 1,4 %/vecka gjorde inte det. Taket sätts därför under 1,4 %.
 * Viktuppgång: lean bulk, 0,25–0,5 %/vecka; mer ger mestadels fett.
 */
export const WEEKLY_RATE_PERCENT = {
  loss: { cautious: 0.25, moderate: 0.5, aggressive: 0.75, max: 1.0 },
  gain: { min: 0.25, max: 0.5 },
} as const

/** kg/vecka -> % av kroppsvikt/vecka */
export function kgPerWeekToPercent(kgPerWeek: number, weightKg: number): number {
  if (weightKg <= 0) return 0
  return (kgPerWeek / weightKg) * 100
}

/** % av kroppsvikt/vecka -> kg/vecka */
export function percentToKgPerWeek(percentPerWeek: number, weightKg: number): number {
  return (percentPerWeek / 100) * weightKg
}

/**
 * Dagligt kaloriunderskott/överskott -> kg/vecka.
 *
 * Detta är den enda korrekta omräkningen och den som saknades: 500 kcal/dag
 * ger 500*7/7700 = 0,45 kg/vecka, inte 0,5.
 */
export function dailyCalorieDeltaToKgPerWeek(dailyDelta: number): number {
  return (dailyDelta * 7) / KCAL_PER_KG
}

/** kg/vecka -> dagligt kaloriunderskott/överskott */
export function kgPerWeekToDailyCalorieDelta(kgPerWeek: number): number {
  return (kgPerWeek * KCAL_PER_KG) / 7
}

/**
 * Veckotakt för ett kalorimål, uttryckt både i kg och i % av kroppsvikt.
 * Används av Energimål, kostlägen och perioder så alla visar samma tal.
 */
export function weeklyRateForCalories(params: {
  tdee: number
  caloriesMin: number
  caloriesMax: number
  weightKg: number
}): { kgMin: number; kgMax: number; percentMin: number; percentMax: number } {
  const { tdee, caloriesMin, caloriesMax, weightKg } = params
  // Lägre intag = större underskott = snabbare tapp, så min-kalorier ger
  // MAX-takten. Vänd på dem så intervallet alltid läses lågt -> högt.
  const deltaAtMin = tdee - caloriesMin
  const deltaAtMax = tdee - caloriesMax
  const kgA = dailyCalorieDeltaToKgPerWeek(deltaAtMin)
  const kgB = dailyCalorieDeltaToKgPerWeek(deltaAtMax)
  const kgMin = Math.min(kgA, kgB)
  const kgMax = Math.max(kgA, kgB)
  return {
    kgMin,
    kgMax,
    percentMin: kgPerWeekToPercent(kgMin, weightKg),
    percentMax: kgPerWeekToPercent(kgMax, weightKg),
  }
}
