/**
 * Plate Calculator
 * Calculates how much of a food item to eat to reach a target calorie goal
 * Implements the "How much should I put on my plate?" feature from Excel
 */

import type { FoodItem } from '@/hooks/useFoodItems'
import { getVolumeToGrams, isVolumeUnit } from '@/lib/utils/unitConversion'

export interface PlateCalculationResult {
  unitsNeeded: number
  unitName: string
  weightGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * Calculate how much of a food item is needed to reach target calories
 *
 * Formula: unitsNeeded = targetKcal / kcalPerUnit
 *
 * @param food - The food item to calculate for
 * @param targetCalories - The target calorie amount
 * @returns Calculation result with amount, weight, and macros
 */
export function calculatePlateAmount(
  food: FoodItem,
  targetCalories: number
): PlateCalculationResult | null {
  // Validate inputs
  if (targetCalories <= 0) {
    return null
  }

  if (food.calories <= 0) {
    return null // Can't calculate for zero-calorie foods
  }

  // Determine the unit to use and calculate kcal per unit
  let kcalPerUnit: number
  let unitName: string
  let gramsPerUnit: number

  // Priority: grams_per_piece (serving) > default_unit
  if (food.grams_per_piece && food.grams_per_piece > 0) {
    // Use serving unit (e.g., "st", "pkt")
    unitName = food.serving_unit || 'st'
    gramsPerUnit = food.grams_per_piece

    // Calculate kcal per piece based on food's nutrition per weight
    const pieceBaseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100
    const kcalPerGram = food.calories / pieceBaseWeight
    kcalPerUnit = kcalPerGram * gramsPerUnit
  } else {
    // Use default unit
    unitName = food.default_unit

    // Calculate kcal per unit based on food's nutrition per weight
    const baseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100
    const kcalPerGram = food.calories / baseWeight

    // For volume units, convert to grams properly
    if (isVolumeUnit(food.default_unit)) {
      const volumeToGramsConversion = getVolumeToGrams(food.default_unit, food.ml_per_gram)
      gramsPerUnit = food.default_amount * volumeToGramsConversion
    } else {
      gramsPerUnit = food.default_amount
    }

    kcalPerUnit = kcalPerGram * gramsPerUnit
  }

  // Validate against division by zero
  if (gramsPerUnit <= 0 || kcalPerUnit <= 0) {
    return null
  }

  // Calculate units needed
  const unitsNeeded = targetCalories / kcalPerUnit

  // Calculate weight in grams
  const weightGrams = unitsNeeded * gramsPerUnit

  // Calculate macros proportionally
  const baseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100
  const multiplier = weightGrams / baseWeight

  return {
    unitsNeeded: Math.round(unitsNeeded * 100) / 100,
    unitName,
    weightGrams: Math.round(weightGrams * 10) / 10,
    calories: Math.round(targetCalories * 10) / 10,
    protein: Math.round(food.protein_g * multiplier * 10) / 10,
    carbs: Math.round(food.carb_g * multiplier * 10) / 10,
    fat: Math.round(food.fat_g * multiplier * 10) / 10,
  }
}

/**
 * Calculate how much of a food item is needed to reach target macro
 *
 * @param food - The food item to calculate for
 * @param targetMacro - The target macro amount in grams
 * @param macroType - Which macro to target (protein, carbs, fat)
 * @returns Calculation result with amount, weight, and all macros
 */
export function calculatePlateForMacro(
  food: FoodItem,
  targetMacro: number,
  macroType: 'protein' | 'carbs' | 'fat'
): PlateCalculationResult | null {
  if (targetMacro <= 0) return null

  // Get macro per base weight (with safe default)
  const baseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100
  let macroPerBaseWeight: number

  switch (macroType) {
    case 'protein':
      macroPerBaseWeight = food.protein_g
      break
    case 'carbs':
      macroPerBaseWeight = food.carb_g
      break
    case 'fat':
      macroPerBaseWeight = food.fat_g
      break
    default: {
      const _exhaustive: never = macroType
      return _exhaustive
    }
  }

  if (macroPerBaseWeight <= 0) return null

  // Calculate weight needed for target macro
  const weightGrams = (targetMacro / macroPerBaseWeight) * baseWeight

  // Calculate calories at this weight
  const multiplier = weightGrams / baseWeight
  const calories = food.calories * multiplier

  // Determine unit and units needed
  let unitName: string
  let unitsNeeded: number

  if (food.grams_per_piece && food.grams_per_piece > 0) {
    unitName = food.serving_unit || 'st'
    unitsNeeded = weightGrams / food.grams_per_piece
  } else {
    unitName = food.default_unit
    // For volume units, convert to grams properly
    let gramsPerUnit: number
    if (isVolumeUnit(food.default_unit)) {
      const volumeToGramsConversion = getVolumeToGrams(food.default_unit, food.ml_per_gram)
      gramsPerUnit = food.default_amount * volumeToGramsConversion
    } else {
      // Safe division - use weight_grams if valid, then default_amount, then 100
      gramsPerUnit =
        food.weight_grams && food.weight_grams > 0
          ? food.weight_grams
          : food.default_amount && food.default_amount > 0
            ? food.default_amount
            : 100
    }
    unitsNeeded = weightGrams / gramsPerUnit
  }

  return {
    unitsNeeded: Math.round(unitsNeeded * 100) / 100,
    unitName,
    weightGrams: Math.round(weightGrams * 10) / 10,
    calories: Math.round(calories * 10) / 10,
    protein: Math.round(food.protein_g * multiplier * 10) / 10,
    carbs: Math.round(food.carb_g * multiplier * 10) / 10,
    fat: Math.round(food.fat_g * multiplier * 10) / 10,
  }
}
