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
export function offSeasonMode(weight: number, avgCalories: number): MacroMode {
  // Calculate grams first
  const fatMinGrams = weight * 0.5
  const fatMaxGrams = weight * 1.5
  const proteinMinGrams = weight * 1.6
  const proteinMaxGrams = weight * 2.2

  // Convert to percentages
  const fatMinPercent = ((fatMinGrams * 9) / avgCalories) * 100
  const fatMaxPercent = ((fatMaxGrams * 9) / avgCalories) * 100
  const proteinMinPercent = ((proteinMinGrams * 4) / avgCalories) * 100
  const proteinMaxPercent = ((proteinMaxGrams * 4) / avgCalories) * 100

  // Carbs fill the rest
  const carbMinPercent = 100 - proteinMaxPercent - fatMaxPercent
  const carbMaxPercent = 100 - proteinMinPercent - fatMinPercent

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
export function onSeasonMode(leanBodyMass: number, avgCalories: number): MacroMode {
  // High protein for muscle preservation
  const proteinMinGrams = leanBodyMass * 2.3
  const proteinMaxGrams = leanBodyMass * 3.1

  // Lower fat
  const fatMinPercent = 15
  const fatMaxPercent = 30

  // Convert protein to percentages
  const proteinMinPercent = ((proteinMinGrams * 4) / avgCalories) * 100
  const proteinMaxPercent = ((proteinMaxGrams * 4) / avgCalories) * 100

  // Carbs fill the rest
  const carbMinPercent = 100 - proteinMaxPercent - fatMaxPercent
  const carbMaxPercent = 100 - proteinMinPercent - fatMinPercent

  return {
    calorieGoal: 'Weight loss',
    deficitLevel: 'Moderate',
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
    leanBodyMass?: number
    caloriesMin: number
    caloriesMax: number
  }
): MacroMode {
  const avgCalories = (params.caloriesMin + params.caloriesMax) / 2

  switch (mode) {
    case 'nnr':
      return nnrMode(avgCalories)

    case 'offseason':
      return offSeasonMode(params.weight, avgCalories)

    case 'onseason':
      if (!params.leanBodyMass) {
        throw new Error('Lean body mass required for on-season mode')
      }
      return onSeasonMode(params.leanBodyMass, avgCalories)

    default:
      return nnrMode(avgCalories)
  }
}
