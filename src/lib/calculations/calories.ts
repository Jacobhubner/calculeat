/**
 * Calorie Goals Calculations
 * Beräknar kalorimål baserat på användarens mål (viktnedgång, bibehålla, viktuppgång)
 */

import type { CalorieGoal } from '../types'

/**
 * Kaloriöverskott/underskott för olika mål
 * 7700 kcal ≈ 1 kg kroppsvikt
 */
export const CALORIE_ADJUSTMENTS = {
  // Viktnedgång
  lose_weight_slow: -300, // ~0.3 kg/vecka
  lose_weight_moderate: -500, // ~0.5 kg/vecka
  lose_weight_fast: -750, // ~0.75 kg/vecka

  // Bibehålla
  maintain_weight: 0,

  // Viktuppgång
  gain_weight_slow: 200, // ~0.2 kg/vecka
  gain_weight_moderate: 350, // ~0.35 kg/vecka
  gain_weight_fast: 500, // ~0.5 kg/vecka
} as const

/**
 * Minimum kalorier per dag (säkerhetsgräns)
 * Bör inte gå under BMR för länge
 */
export const MIN_CALORIES = {
  male: 1500,
  female: 1200,
  other: 1350,
} as const

/**
 * Beräkna kalorimål baserat på mål och TDEE
 */
export interface CalorieGoalParams {
  tdee: number
  goal: CalorieGoal
  bmr?: number // För att sätta minimum
}

export interface CalorieRange {
  min: number
  max: number
  target: number
  weeklyChange: number // förväntad viktförändring kg/vecka
}

/**
 * Beräkna kalorier för viktnedgång
 */
function calculateWeightLossCalories(tdee: number, bmr: number = 1200): CalorieRange {
  // Moderata underskott: -500 kcal/dag = ~0.5 kg/vecka
  const target = Math.max(tdee - 500, bmr)
  const min = Math.max(tdee - 750, bmr) // Max -750 för säkerhets skull
  const max = tdee - 300 // Minst -300 för att se resultat

  return {
    min: Math.round(min),
    max: Math.round(max),
    target: Math.round(target),
    weeklyChange: -0.5,
  }
}

/**
 * Beräkna kalorier för att bibehålla vikt
 */
function calculateMaintenanceCalories(tdee: number): CalorieRange {
  // ±5% marginal för variation
  const margin = tdee * 0.05

  return {
    min: Math.round(tdee - margin),
    max: Math.round(tdee + margin),
    target: Math.round(tdee),
    weeklyChange: 0,
  }
}

/**
 * Beräkna kalorier för viktuppgång
 */
function calculateWeightGainCalories(tdee: number): CalorieRange {
  // Moderata överskott: +300-500 kcal/dag = ~0.3-0.5 kg/vecka
  const target = tdee + 400
  const min = tdee + 250
  const max = tdee + 550

  return {
    min: Math.round(min),
    max: Math.round(max),
    target: Math.round(target),
    weeklyChange: 0.4,
  }
}

/**
 * Huvudfunktion för kalorimål
 */
export function calculateCalorieGoal(params: CalorieGoalParams): CalorieRange {
  const { tdee, goal, bmr = 1200 } = params

  if (tdee <= 0) {
    throw new Error('TDEE måste vara ett positivt värde')
  }

  switch (goal) {
    case 'lose_weight':
      return calculateWeightLossCalories(tdee, bmr)
    case 'maintain_weight':
      return calculateMaintenanceCalories(tdee)
    case 'gain_weight':
      return calculateWeightGainCalories(tdee)
    default:
      throw new Error(`Okänt kalorimål: ${goal}`)
  }
}

/**
 * Makrofördelning (protein, kolhydrater, fett)
 */
export interface MacroSplit {
  protein: { grams: number; calories: number; percentage: number }
  carbs: { grams: number; calories: number; percentage: number }
  fat: { grams: number; calories: number; percentage: number }
}

export interface MacroParams {
  calories: number
  weight: number // kg - används för proteinberäkning
  goal: CalorieGoal
}

/**
 * Beräkna makrofördelning baserat på kalorier och mål
 */
export function calculateMacros(params: MacroParams): MacroSplit {
  const { calories, weight, goal } = params

  // Proteinbehov: ~1.6-2.2g per kg kroppsvikt beroende på mål
  let proteinPerKg: number

  if (goal === 'lose_weight') {
    proteinPerKg = 2.0 // Högre protein vid viktnedgång för att bevara muskelmassa
  } else if (goal === 'gain_weight') {
    proteinPerKg = 1.8 // Protein för muskeluppbyggnad
  } else {
    proteinPerKg = 1.6 // Underhåll
  }

  const proteinGrams = Math.round(weight * proteinPerKg)
  const proteinCalories = proteinGrams * 4 // 4 kcal per gram protein

  // Fett: 25-30% av totala kalorier
  const fatPercentage = goal === 'lose_weight' ? 0.25 : 0.3
  const fatCalories = Math.round(calories * fatPercentage)
  const fatGrams = Math.round(fatCalories / 9) // 9 kcal per gram fett

  // Kolhydrater: Resten
  const carbCalories = calories - proteinCalories - fatCalories
  const carbGrams = Math.round(carbCalories / 4) // 4 kcal per gram kolhydrat

  return {
    protein: {
      grams: proteinGrams,
      calories: proteinCalories,
      percentage: Math.round((proteinCalories / calories) * 100),
    },
    carbs: {
      grams: Math.max(carbGrams, 0),
      calories: Math.max(carbCalories, 0),
      percentage: Math.round((Math.max(carbCalories, 0) / calories) * 100),
    },
    fat: {
      grams: fatGrams,
      calories: fatCalories,
      percentage: Math.round((fatCalories / calories) * 100),
    },
  }
}

/**
 * Beräkna tid att nå viktmål
 */
export function calculateTimeToGoal(
  currentWeight: number,
  targetWeight: number,
  weeklyChange: number
): { weeks: number; months: number } {
  const weightDifference = Math.abs(targetWeight - currentWeight)

  if (weeklyChange === 0) {
    return { weeks: 0, months: 0 }
  }

  const weeks = Math.ceil(weightDifference / Math.abs(weeklyChange))
  const months = Math.round((weeks / 4.33) * 10) / 10 // 4.33 veckor per månad

  return { weeks, months }
}
