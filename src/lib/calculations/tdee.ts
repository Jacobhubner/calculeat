/**
 * TDEE (Total Daily Energy Expenditure) Calculations
 * Beräknar totalt dagligt energibehov baserat på aktivitetsnivå
 */

import type { ActivityLevel } from '../types'

/**
 * PAL (Physical Activity Level) multiplikatorer
 * Används för att konvertera BMR till TDEE
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Stillasittande (kontor, lite/ingen träning)
  light: 1.375, // Lätt aktiv (lätt träning 1-3 dagar/vecka)
  moderate: 1.55, // Måttligt aktiv (måttlig träning 3-5 dagar/vecka)
  active: 1.725, // Mycket aktiv (hård träning 6-7 dagar/vecka)
  very_active: 1.9, // Extra aktiv (mycket hård träning, fysiskt jobb)
}

/**
 * Beskrivningar för varje aktivitetsnivå
 */
export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Stillasittande - lite eller ingen träning',
  light: 'Lätt aktiv - lätt träning/sport 1-3 dagar per vecka',
  moderate: 'Måttligt aktiv - måttlig träning/sport 3-5 dagar per vecka',
  active: 'Mycket aktiv - hård träning/sport 6-7 dagar per vecka',
  very_active: 'Extra aktiv - mycket hård träning/sport & fysiskt arbete',
}

/**
 * Beräkna TDEE från BMR och aktivitetsnivå
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (bmr <= 0) {
    throw new Error('BMR måste vara ett positivt värde')
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]

  if (!multiplier) {
    throw new Error(`Okänd aktivitetsnivå: ${activityLevel}`)
  }

  return Math.round(bmr * multiplier)
}

/**
 * Hämta multiplikator för aktivitetsnivå
 */
export function getActivityMultiplier(activityLevel: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[activityLevel]
}

/**
 * Hämta beskrivning för aktivitetsnivå
 */
export function getActivityDescription(activityLevel: ActivityLevel): string {
  return ACTIVITY_DESCRIPTIONS[activityLevel]
}
