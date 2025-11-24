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
}

/**
 * NNR Mode (Nordic Nutrition Recommendations)
 * Maintains weight with balanced macros
 */
export function nnrMode(_avgCalories: number): MacroMode {
  return {
    calorieGoal: 'Maintain weight',
    fatMinPercent: 25,
    fatMaxPercent: 40,
    proteinMinPercent: 10,
    proteinMaxPercent: 20,
    carbMinPercent: 45,
    carbMaxPercent: 60,
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

  // Convert to percentages (min% uses caloriesMax, max% uses caloriesMin)
  const fatMinPercent = ((fatMinGrams * 9) / caloriesMax) * 100
  const fatMaxPercent = ((fatMaxGrams * 9) / caloriesMin) * 100
  const proteinMinPercent = ((proteinMinGrams * 4) / caloriesMax) * 100
  const proteinMaxPercent = ((proteinMaxGrams * 4) / caloriesMin) * 100

  // CARBS: remaining energy after fat and protein
  const fatMaxKcal = fatMaxGrams * 9
  const proteinMaxKcal = proteinMaxGrams * 4
  const fatMinKcal = fatMinGrams * 9
  const proteinMinKcal = proteinMinGrams * 4

  const carbsMinKcal = caloriesMin - (fatMaxKcal + proteinMaxKcal)
  const carbsMaxKcal = caloriesMax - (fatMinKcal + proteinMinKcal)

  const carbMinPercent = (carbsMinKcal / caloriesMin) * 100
  const carbMaxPercent = (carbsMaxKcal / caloriesMax) * 100

  return {
    calorieGoal: 'Weight gain',
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
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
  // FAT: 15-30% of calorie range
  const fatMinGrams = (caloriesMin * 0.15) / 9
  const fatMaxGrams = (caloriesMax * 0.3) / 9

  // PROTEIN: 2.3-3.1 g per kg FFM
  const proteinMinGrams = fatFreeMass * 2.3
  const proteinMaxGrams = fatFreeMass * 3.1

  // Convert to percentages (min% uses caloriesMax, max% uses caloriesMin)
  const fatMinPercent = ((fatMinGrams * 9) / caloriesMax) * 100
  const fatMaxPercent = ((fatMaxGrams * 9) / caloriesMin) * 100
  const proteinMinPercent = ((proteinMinGrams * 4) / caloriesMax) * 100
  const proteinMaxPercent = ((proteinMaxGrams * 4) / caloriesMin) * 100

  // CARBS: remaining energy after fat and protein
  const fatMaxKcal = fatMaxGrams * 9
  const proteinMaxKcal = proteinMaxGrams * 4
  const fatMinKcal = fatMinGrams * 9
  const proteinMinKcal = proteinMinGrams * 4

  const carbsMinKcal = caloriesMin - (fatMaxKcal + proteinMaxKcal)
  const carbsMaxKcal = caloriesMax - (fatMinKcal + proteinMinKcal)

  const carbMinPercent = (carbsMinKcal / caloriesMin) * 100
  const carbMaxPercent = (carbsMaxKcal / caloriesMax) * 100

  return {
    calorieGoal: 'Weight loss',
    deficitLevel: '20-25%',
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
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
