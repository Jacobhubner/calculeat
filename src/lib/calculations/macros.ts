/**
 * Macro Calculations
 * Implements macro ranges and calorie goals from Excel Profile sheet
 */

import type { Gender } from '../types'

export type MacroUnit = '%' | 'gram' | 'kcal' | 'g/kg body weight' | 'g/kg FFM'

export type CalorieGoal = 'Maintain weight' | 'Weight gain' | 'Weight loss'

export type DeficitLevel = 'Slow' | 'Moderate' | 'Aggressive'

export interface MacroRange {
  min: number
  max: number
}

export interface MacroRanges {
  fat: MacroRange
  carb: MacroRange
  protein: MacroRange
}

export interface MacroCalculationParams {
  calorieGoal: number
  fatRange: MacroRange // in percentage
  carbRange: MacroRange // in percentage
  proteinRange: MacroRange // in percentage
}

export interface MacroResult {
  fatMinGrams: number
  fatMaxGrams: number
  carbMinGrams: number
  carbMaxGrams: number
  proteinMinGrams: number
  proteinMaxGrams: number
  fatMinKcal: number
  fatMaxKcal: number
  carbMinKcal: number
  carbMaxKcal: number
  proteinMinKcal: number
  proteinMaxKcal: number
}

export interface CalorieGoalParams {
  tdee: number
  goal: CalorieGoal
  deficitLevel?: DeficitLevel
}

/**
 * Default macro ranges (from Excel Profile sheet)
 */
export const DEFAULT_MACRO_RANGES: MacroRanges = {
  fat: { min: 25, max: 40 }, // 25-40% of calories
  carb: { min: 45, max: 60 }, // 45-60% of calories
  protein: { min: 10, max: 20 }, // 10-20% of calories
}

/**
 * Calories per gram for each macronutrient
 */
export const KCAL_PER_GRAM = {
  fat: 9,
  carb: 4,
  protein: 4,
} as const

/**
 * Calculate calorie goal based on TDEE and goal type
 */
export function calculateCalorieGoal(params: CalorieGoalParams): number {
  const { tdee, goal, deficitLevel = 'Moderate' } = params

  if (goal === 'Maintain weight') {
    return tdee
  }

  // Deficit/surplus amounts
  const deficits: Record<DeficitLevel, number> = {
    Slow: 250, // 0.25 kg per week
    Moderate: 500, // 0.5 kg per week
    Aggressive: 750, // 0.75 kg per week
  }

  const adjustment = deficits[deficitLevel]

  if (goal === 'Weight loss') {
    return tdee - adjustment
  }

  if (goal === 'Weight gain') {
    return tdee + adjustment
  }

  return tdee
}

/**
 * Calculate macro ranges in grams and kcal
 */
export function calculateMacros(params: MacroCalculationParams): MacroResult {
  const { calorieGoal, fatRange, carbRange, proteinRange } = params

  // Convert percentages to kcal
  const fatMinKcal = (calorieGoal * fatRange.min) / 100
  const fatMaxKcal = (calorieGoal * fatRange.max) / 100

  const carbMinKcal = (calorieGoal * carbRange.min) / 100
  const carbMaxKcal = (calorieGoal * carbRange.max) / 100

  const proteinMinKcal = (calorieGoal * proteinRange.min) / 100
  const proteinMaxKcal = (calorieGoal * proteinRange.max) / 100

  // Convert kcal to grams
  const fatMinGrams = fatMinKcal / KCAL_PER_GRAM.fat
  const fatMaxGrams = fatMaxKcal / KCAL_PER_GRAM.fat

  const carbMinGrams = carbMinKcal / KCAL_PER_GRAM.carb
  const carbMaxGrams = carbMaxKcal / KCAL_PER_GRAM.carb

  const proteinMinGrams = proteinMinKcal / KCAL_PER_GRAM.protein
  const proteinMaxGrams = proteinMaxKcal / KCAL_PER_GRAM.protein

  return {
    fatMinGrams: Math.round(fatMinGrams),
    fatMaxGrams: Math.round(fatMaxGrams),
    carbMinGrams: Math.round(carbMinGrams),
    carbMaxGrams: Math.round(carbMaxGrams),
    proteinMinGrams: Math.round(proteinMinGrams),
    proteinMaxGrams: Math.round(proteinMaxGrams),
    fatMinKcal: Math.round(fatMinKcal),
    fatMaxKcal: Math.round(fatMaxKcal),
    carbMinKcal: Math.round(carbMinKcal),
    carbMaxKcal: Math.round(carbMaxKcal),
    proteinMinKcal: Math.round(proteinMinKcal),
    proteinMaxKcal: Math.round(proteinMaxKcal),
  }
}

/**
 * Convert macro value from one unit to another
 */
export function convertMacroUnit(
  value: number,
  fromUnit: MacroUnit,
  toUnit: MacroUnit,
  context: {
    totalCalories?: number
    bodyWeight?: number
    fatFreeMass?: number
    macroType: 'fat' | 'carb' | 'protein'
  }
): number | null {
  const { totalCalories, bodyWeight, fatFreeMass, macroType } = context

  // Same unit - no conversion needed
  if (fromUnit === toUnit) {
    return value
  }

  // Convert to grams first (common intermediate)
  let grams: number | null = null

  switch (fromUnit) {
    case 'gram':
      grams = value
      break

    case 'kcal':
      grams = value / KCAL_PER_GRAM[macroType]
      break

    case '%': {
      if (!totalCalories) return null
      const kcal = (value / 100) * totalCalories
      grams = kcal / KCAL_PER_GRAM[macroType]
      break
    }

    case 'g/kg body weight':
      if (!bodyWeight) return null
      grams = value * bodyWeight
      break

    case 'g/kg FFM':
      if (!fatFreeMass) return null
      grams = value * fatFreeMass
      break

    default:
      return null
  }

  if (grams === null) return null

  // Convert from grams to target unit
  switch (toUnit) {
    case 'gram':
      return grams

    case 'kcal':
      return grams * KCAL_PER_GRAM[macroType]

    case '%': {
      if (!totalCalories) return null
      const kcal = grams * KCAL_PER_GRAM[macroType]
      return (kcal / totalCalories) * 100
    }

    case 'g/kg body weight':
      if (!bodyWeight) return null
      return grams / bodyWeight

    case 'g/kg FFM':
      if (!fatFreeMass) return null
      return grams / fatFreeMass

    default:
      return null
  }
}

/**
 * Calculate protein requirements based on activity level and goal
 * Uses evidence-based recommendations
 */
export function calculateProteinRequirement(params: {
  bodyWeight: number
  fatFreeMass?: number
  goal: CalorieGoal
  activityLevel: 'sedentary' | 'active' | 'very_active'
}): { minGrams: number; maxGrams: number; recommendation: string } {
  const { bodyWeight, fatFreeMass, goal, activityLevel } = params

  let minPerKg: number
  let maxPerKg: number
  let recommendation: string

  if (goal === 'Weight loss') {
    // Higher protein during deficit to preserve muscle
    if (activityLevel === 'sedentary') {
      minPerKg = 1.6
      maxPerKg = 2.2
      recommendation = '1.6-2.2 g/kg for muscle preservation'
    } else if (activityLevel === 'active') {
      minPerKg = 2.0
      maxPerKg = 2.4
      recommendation = '2.0-2.4 g/kg for active individuals in deficit'
    } else {
      minPerKg = 2.2
      maxPerKg = 2.7
      recommendation = '2.2-2.7 g/kg for very active individuals in deficit'
    }
  } else if (goal === 'Weight gain') {
    // Moderate protein for muscle building
    if (activityLevel === 'sedentary') {
      minPerKg = 1.4
      maxPerKg = 1.8
      recommendation = '1.4-1.8 g/kg for muscle gain'
    } else if (activityLevel === 'active') {
      minPerKg = 1.6
      maxPerKg = 2.2
      recommendation = '1.6-2.2 g/kg for active muscle building'
    } else {
      minPerKg = 1.8
      maxPerKg = 2.4
      recommendation = '1.8-2.4 g/kg for very active muscle building'
    }
  } else {
    // Maintenance
    if (activityLevel === 'sedentary') {
      minPerKg = 1.2
      maxPerKg = 1.6
      recommendation = '1.2-1.6 g/kg for maintenance'
    } else if (activityLevel === 'active') {
      minPerKg = 1.4
      maxPerKg = 2.0
      recommendation = '1.4-2.0 g/kg for active maintenance'
    } else {
      minPerKg = 1.6
      maxPerKg = 2.2
      recommendation = '1.6-2.2 g/kg for very active maintenance'
    }
  }

  // Use fat free mass if available, otherwise total body weight
  const referenceWeight = fatFreeMass || bodyWeight

  return {
    minGrams: Math.round(minPerKg * referenceWeight),
    maxGrams: Math.round(maxPerKg * referenceWeight),
    recommendation,
  }
}

/**
 * Calculate fat requirements (essential fat + hormonal health)
 */
export function calculateFatRequirement(params: {
  bodyWeight: number
  gender: Gender
  totalCalories: number
}): { minGrams: number; maxGrams: number; minPercentage: number; maxPercentage: number } {
  const { bodyWeight, gender, totalCalories } = params

  // Minimum fat for hormonal health
  const minPercentage = gender === 'female' ? 25 : 20 // Women need more for hormonal health
  const maxPercentage = 40 // Upper limit for most people

  // Also enforce absolute minimum based on body weight
  const absoluteMinGrams = gender === 'female' ? bodyWeight * 0.8 : bodyWeight * 0.7

  const minGramsFromPercentage = (totalCalories * minPercentage) / 100 / KCAL_PER_GRAM.fat
  const maxGramsFromPercentage = (totalCalories * maxPercentage) / 100 / KCAL_PER_GRAM.fat

  return {
    minGrams: Math.round(Math.max(minGramsFromPercentage, absoluteMinGrams)),
    maxGrams: Math.round(maxGramsFromPercentage),
    minPercentage,
    maxPercentage,
  }
}

/**
 * Calculate carb requirements (fills remaining calories after protein and fat)
 */
export function calculateCarbRequirement(params: {
  totalCalories: number
  proteinGrams: number
  fatGrams: number
}): { grams: number; percentage: number; kcal: number } {
  const { totalCalories, proteinGrams, fatGrams } = params

  const proteinKcal = proteinGrams * KCAL_PER_GRAM.protein
  const fatKcal = fatGrams * KCAL_PER_GRAM.fat

  const remainingKcal = totalCalories - proteinKcal - fatKcal
  const carbGrams = remainingKcal / KCAL_PER_GRAM.carb
  const carbPercentage = (remainingKcal / totalCalories) * 100

  return {
    grams: Math.round(Math.max(0, carbGrams)),
    percentage: Math.round(Math.max(0, carbPercentage)),
    kcal: Math.round(Math.max(0, remainingKcal)),
  }
}

/**
 * Validate that macro ranges sum to approximately 100%
 */
export function validateMacroRanges(ranges: MacroRanges): {
  valid: boolean
  minSum: number
  maxSum: number
  error?: string
} {
  const minSum = ranges.fat.min + ranges.carb.min + ranges.protein.min
  const maxSum = ranges.fat.max + ranges.carb.max + ranges.protein.max

  if (minSum > 100) {
    return {
      valid: false,
      minSum,
      maxSum,
      error: `Minimum percentages sum to ${minSum}%, which exceeds 100%`,
    }
  }

  if (maxSum < 100) {
    return {
      valid: false,
      minSum,
      maxSum,
      error: `Maximum percentages sum to ${maxSum}%, which is below 100%`,
    }
  }

  return {
    valid: true,
    minSum,
    maxSum,
  }
}

/**
 * Get balanced macro split (common presets)
 */
export function getBalancedMacroSplit(
  preset: 'balanced' | 'low_carb' | 'high_carb' | 'high_protein'
): MacroRanges {
  switch (preset) {
    case 'balanced':
      return {
        fat: { min: 25, max: 35 },
        carb: { min: 40, max: 50 },
        protein: { min: 20, max: 30 },
      }

    case 'low_carb':
      return {
        fat: { min: 35, max: 45 },
        carb: { min: 25, max: 35 },
        protein: { min: 25, max: 35 },
      }

    case 'high_carb':
      return {
        fat: { min: 20, max: 30 },
        carb: { min: 50, max: 60 },
        protein: { min: 15, max: 25 },
      }

    case 'high_protein':
      return {
        fat: { min: 25, max: 35 },
        carb: { min: 30, max: 40 },
        protein: { min: 30, max: 40 },
      }

    default:
      return DEFAULT_MACRO_RANGES
  }
}
