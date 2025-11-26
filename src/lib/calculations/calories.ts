/**
 * Calorie Goals Calculations
 * Beräknar kalorimål baserat på användarens mål (viktnedgång, bibehålla, viktuppgång)
 */

import type { CalorieGoal, DeficitLevel } from '../types'

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
  deficitLevel?: DeficitLevel // För viktnedgång
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
function calculateWeightLossCalories(
  tdee: number,
  bmr: number = 1200,
  deficitLevel: DeficitLevel = 'Moderate'
): CalorieRange {
  // Deficitlägen med olika veckoupptempo
  const deficits: Record<DeficitLevel, { daily: number; weekly: number }> = {
    Slow: { daily: -300, weekly: -0.3 }, // ~0.3 kg/vecka
    Moderate: { daily: -500, weekly: -0.5 }, // ~0.5 kg/vecka
    Aggressive: { daily: -750, weekly: -0.75 }, // ~0.75 kg/vecka
  }

  const deficit = deficits[deficitLevel]
  const target = Math.max(tdee + deficit.daily, bmr)

  // Skapa ett intervall ±100 kcal från target
  const min = Math.max(target - 100, bmr)
  const max = target + 100

  return {
    min: Math.round(min),
    max: Math.round(max),
    target: Math.round(target),
    weeklyChange: deficit.weekly,
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
  const { tdee, goal, bmr = 1200, deficitLevel = 'Moderate' } = params

  if (tdee <= 0) {
    throw new Error('TDEE måste vara ett positivt värde')
  }

  switch (goal) {
    case 'Weight loss':
      return calculateWeightLossCalories(tdee, bmr, deficitLevel)
    case 'Maintain weight':
      return calculateMaintenanceCalories(tdee)
    case 'Weight gain':
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
  // Optional: calorie min/max for calculating gram ranges
  caloriesMin?: number
  caloriesMax?: number
  // Optional: use custom macro percentages instead of automatic calculation
  customMacros?: {
    proteinMinPercent?: number
    proteinMaxPercent?: number
    fatMinPercent?: number
    fatMaxPercent?: number
    carbMinPercent?: number
    carbMaxPercent?: number
  }
}

/**
 * Beräkna makrofördelning baserat på kalorier och mål
 * Om customMacros anges används de procenterna istället för automatiska beräkningar
 *
 * EXAKT GOOGLE SHEETS LOGIK:
 * E24:F24 = ROUND(D21*C24/9) "g –" ROUND(D22*D24/9) "g"  (Fett)
 * E25:F25 = ROUND(D21*C25/4) "g –" ROUND(D22*D25/4) "g"  (Kolhydrater)
 * E26:F26 = ROUND(D21*C26/4) "g –" ROUND(D22*D26/4) "g"  (Protein)
 *
 * D21 = CaloriesMin, D22 = CaloriesMax
 * C24 = FatMin%, D24 = FatMax%
 * C25 = CarbMin%, D25 = CarbMax%
 * C26 = ProteinMin%, D26 = ProteinMax%
 */
export function calculateMacros(params: MacroParams): MacroSplit {
  const { calories, weight, goal, caloriesMin, caloriesMax, customMacros } = params

  // If custom macros are provided, use those percentages
  if (customMacros && caloriesMin && caloriesMax) {
    // EXACT Google Sheets formulas - NO normalization, NO averaging percent first
    // Fat: ROUND(CaloriesMin * FatMin% / 9) to ROUND(CaloriesMax * FatMax% / 9)
    const fatMinGrams = Math.round((caloriesMin * customMacros.fatMinPercent) / 100 / 9)
    const fatMaxGrams = Math.round((caloriesMax * customMacros.fatMaxPercent) / 100 / 9)

    // Carbs: ROUND(CaloriesMin * CarbMin% / 4) to ROUND(CaloriesMax * CarbMax% / 4)
    const carbMinGrams = Math.round((caloriesMin * customMacros.carbMinPercent) / 100 / 4)
    const carbMaxGrams = Math.round((caloriesMax * customMacros.carbMaxPercent) / 100 / 4)

    // Protein: ROUND(CaloriesMin * ProteinMin% / 4) to ROUND(CaloriesMax * ProteinMax% / 4)
    const proteinMinGrams = Math.round((caloriesMin * customMacros.proteinMinPercent) / 100 / 4)
    const proteinMaxGrams = Math.round((caloriesMax * customMacros.proteinMaxPercent) / 100 / 4)

    // Display average grams (for single value display)
    const fatAvgGrams = Math.round((fatMinGrams + fatMaxGrams) / 2)
    const carbAvgGrams = Math.round((carbMinGrams + carbMaxGrams) / 2)
    const proteinAvgGrams = Math.round((proteinMinGrams + proteinMaxGrams) / 2)

    // Display average percent (for single value display)
    const fatAvgPercent = Math.round((customMacros.fatMinPercent + customMacros.fatMaxPercent) / 2)
    const carbAvgPercent = Math.round(
      (customMacros.carbMinPercent + customMacros.carbMaxPercent) / 2
    )
    const proteinAvgPercent = Math.round(
      (customMacros.proteinMinPercent + customMacros.proteinMaxPercent) / 2
    )

    return {
      protein: {
        grams: proteinAvgGrams,
        calories: proteinAvgGrams * 4,
        percentage: proteinAvgPercent,
      },
      carbs: {
        grams: carbAvgGrams,
        calories: carbAvgGrams * 4,
        percentage: carbAvgPercent,
      },
      fat: {
        grams: fatAvgGrams,
        calories: fatAvgGrams * 9,
        percentage: fatAvgPercent,
      },
    }
  }

  // Fallback to automatic calculation based on goal
  // Proteinbehov: ~1.6-2.2g per kg kroppsvikt beroende på mål
  let proteinPerKg: number

  if (goal === 'Weight loss') {
    proteinPerKg = 2.0 // Högre protein vid viktnedgång för att bevara muskelmassa
  } else if (goal === 'Weight gain') {
    proteinPerKg = 1.8 // Protein för muskeluppbyggnad
  } else {
    proteinPerKg = 1.6 // Underhåll
  }

  const proteinGrams = Math.round(weight * proteinPerKg)
  const proteinCalories = proteinGrams * 4 // 4 kcal per gram protein

  // Fett: 25-30% av totala kalorier
  const fatPercentage = goal === 'Weight loss' ? 0.25 : 0.3
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
