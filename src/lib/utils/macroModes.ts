/**
 * Predefined Macro Modes
 * NNR, Off-Season, On-Season modes from Apps Script
 */

import type { CalorieGoal, DeficitLevel } from '@/lib/types'

export interface MacroMode {
  calorieGoal: CalorieGoal
  deficitLevel?: DeficitLevel
  fatMinPercent: number
  fatMaxPercent: number
  carbMinPercent: number
  carbMaxPercent: number
  proteinMinPercent: number
  proteinMaxPercent: number
  // Calorie range multipliers (applied to TDEE to get CalorieMin/Max)
  calorieMinMultiplier: number
  calorieMaxMultiplier: number
}

/**
 * NNR Mode (Nordic Nutrition Recommendations)
 * Maintains weight with balanced macros
 */
export function nnrMode(_avgCalories: number): MacroMode {
  // NNR: Fixed percentages
  return {
    calorieGoal: 'Maintain weight',
    fatMinPercent: 25,
    fatMaxPercent: 40,
    proteinMinPercent: 10,
    proteinMaxPercent: 20,
    carbMinPercent: 45,
    carbMaxPercent: 60,
    calorieMinMultiplier: 0.97, // TDEE * 0.97 (±3%)
    calorieMaxMultiplier: 1.03, // TDEE * 1.03 (±3%)
  }
}

/**
 * Off-Season Mode (Bodybuilding bulk)
 * Weight gain with high protein
 */
export function offSeasonMode(weight: number, caloriesMin: number, caloriesMax: number): MacroMode {
  // FAT: 0.5-1.5 g per kg body weight
  const fatMinGrams = weight * 0.5
  const fatMaxGrams = weight * 1.5

  // PROTEIN: 1.6-2.2 g per kg body weight
  const proteinMinGrams = weight * 1.6
  const proteinMaxGrams = weight * 2.2

  // Convert grams to kcal
  const fatMinKcal = fatMinGrams * 9
  const fatMaxKcal = fatMaxGrams * 9
  const proteinMinKcal = proteinMinGrams * 4
  const proteinMaxKcal = proteinMaxGrams * 4

  // Convert to percentages (NO ROUNDING - keep exact decimals for precision)
  const fatMinPercent = (fatMinKcal / caloriesMin) * 100
  const fatMaxPercent = (fatMaxKcal / caloriesMax) * 100
  const proteinMinPercent = (proteinMinKcal / caloriesMin) * 100
  const proteinMaxPercent = (proteinMaxKcal / caloriesMax) * 100

  // CARBS: Calculate as remainder to ensure total = 100%
  // This ensures fat% + protein% + carb% = 100% exactly
  const carbMinPercent = 100 - (fatMaxPercent + proteinMaxPercent)
  const carbMaxPercent = 100 - (fatMinPercent + proteinMinPercent)

  return {
    calorieGoal: 'Weight gain',
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    calorieMinMultiplier: 1.1, // TDEE * 1.1
    calorieMaxMultiplier: 1.2, // TDEE * 1.2
  }
}

/**
 * On-Season Mode (Bodybuilding cut)
 * Weight loss with very high protein to preserve muscle
 */
export function onSeasonMode(
  fatFreeMass: number,
  caloriesMin: number,
  caloriesMax: number
): MacroMode {
  // FAT: Always percentage of calories (fixed 15-30%)
  // Fat-min = 15% of caloriesMin
  // Fat-max = 30% of caloriesMax
  const fatMinKcal = caloriesMin * 0.15
  const fatMaxKcal = caloriesMax * 0.3

  // PROTEIN: Based on FFM (grams)
  const proteinMinGrams = fatFreeMass * 2.3
  const proteinMaxGrams = fatFreeMass * 3.1

  // Convert protein grams to kcal
  const proteinMinKcal = proteinMinGrams * 4
  const proteinMaxKcal = proteinMaxGrams * 4

  // Convert to percentages (NO ROUNDING - keep exact decimals for precision)
  const fatMinPercent = (fatMinKcal / caloriesMin) * 100
  const fatMaxPercent = (fatMaxKcal / caloriesMax) * 100
  const proteinMinPercent = (proteinMinKcal / caloriesMin) * 100
  const proteinMaxPercent = (proteinMaxKcal / caloriesMax) * 100

  // CARBS: Calculate as remainder to ensure total = 100%
  // This ensures fat% + protein% + carb% = 100% exactly
  const carbMinPercent = 100 - (fatMaxPercent + proteinMaxPercent)
  const carbMaxPercent = 100 - (fatMinPercent + proteinMinPercent)

  return {
    calorieGoal: 'Weight loss',
    deficitLevel: '20-25%', // On-season: 20-25% deficit (TDEE * 0.75-0.8)
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    calorieMinMultiplier: 0.75, // TDEE * 0.75 (25% deficit)
    calorieMaxMultiplier: 0.8, // TDEE * 0.8 (20% deficit)
  }
}

/**
 * Apply a macro mode to user profile
 */
export function applyMacroMode(
  mode: 'nnr' | 'offseason' | 'onseason',
  params: {
    weight: number
    fatFreeMass?: number
    caloriesMin: number
    caloriesMax: number
  }
): MacroMode {
  const avgCalories = (params.caloriesMin + params.caloriesMax) / 2

  switch (mode) {
    case 'nnr':
      return nnrMode(avgCalories)

    case 'offseason':
      return offSeasonMode(params.weight, params.caloriesMin, params.caloriesMax)

    case 'onseason':
      if (!params.fatFreeMass) {
        throw new Error('Fat free mass (FFM) required for on-season mode')
      }
      return onSeasonMode(params.fatFreeMass, params.caloriesMin, params.caloriesMax)

    default:
      return nnrMode(avgCalories)
  }
}
