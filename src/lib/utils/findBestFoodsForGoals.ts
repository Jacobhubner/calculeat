/**
 * Find Best Foods for Goals
 * Advanced algorithm from Apps Script Today.gs
 * Finds foods that match BOTH calorie AND macro targets
 */

import type { FoodItem } from '@/hooks/useFoodItems'
import type { FoodColor } from '@/lib/calculations/colorDensity'
import { convertWeightToUnit } from '@/lib/utils/unitConversion'

export interface FindBestFoodsParams {
  desiredCalories: number
  desiredMacroType: 'protein' | 'carbs' | 'fat'
  desiredMacroAmount: number
  // Optional secondary macro for more precise matching
  secondaryMacroType?: 'protein' | 'carbs' | 'fat'
  secondaryMacroAmount?: number
  numberOfResults?: number
  recipeOnly?: boolean
  nonRecipeOnly?: boolean
  foodColors?: FoodColor[]
  tolerance?: number // % tolerance for calories, default 10%
}

export interface FoodGoalMatch {
  food: FoodItem
  amount: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  macroAccuracy: number // How close to desired primary macro (0-100%)
  secondaryMacroAccuracy?: number // How close to desired secondary macro (0-100%)
  calorieAccuracy: number // How close to desired calories (0-100%)
  overallScore: number // Combined score (0-100)
}

/**
 * Find foods that match both calorie AND macro targets
 * This is the main algorithm from Apps Script findBestFoodsForGoals()
 */
export function findBestFoodsForGoals(
  foods: FoodItem[],
  params: FindBestFoodsParams
): FoodGoalMatch[] {
  const {
    desiredCalories,
    desiredMacroType,
    desiredMacroAmount,
    secondaryMacroType,
    secondaryMacroAmount,
    numberOfResults = 10,
    recipeOnly = false,
    nonRecipeOnly = false,
    foodColors = [],
    tolerance = 10,
  } = params

  // Validate required parameters to prevent division by zero
  if (desiredCalories <= 0 || desiredMacroAmount <= 0) {
    return []
  }

  // Validate secondary macro (must be different from primary)
  const useSecondaryMacro =
    secondaryMacroType &&
    secondaryMacroAmount &&
    secondaryMacroAmount > 0 &&
    secondaryMacroType !== desiredMacroType

  // Filter foods first
  let filtered = [...foods]

  // Recipe filter
  if (recipeOnly) {
    filtered = filtered.filter(food => food.is_recipe)
  } else if (nonRecipeOnly) {
    filtered = filtered.filter(food => !food.is_recipe)
  }

  // Food color filter (allow multiple)
  if (foodColors.length > 0) {
    filtered = filtered.filter(food => foodColors.includes(food.energy_density_color || 'Yellow'))
  }

  // Calculate matches
  const matches: FoodGoalMatch[] = []

  for (const food of filtered) {
    // Skip foods with zero calories
    if (food.calories <= 0) continue

    // Get base weight (what the nutrition info is based on)
    const baseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100

    // Calculate amount needed to reach desired calories (in terms of base portions)
    const amountForCalories = desiredCalories / food.calories

    // Calculate weight in grams needed
    const weightGrams = amountForCalories * baseWeight

    // Convert weight to appropriate unit
    const amount = convertWeightToUnit(weightGrams, food.default_unit, food.ml_per_gram)

    // Calculate what macros we'd get at that amount
    const macroAtAmount = getMacroValue(food, desiredMacroType) * amountForCalories

    // Check if calories are within tolerance
    const caloriesDiff = Math.abs(food.calories * amountForCalories - desiredCalories)
    const caloriePercent = (caloriesDiff / desiredCalories) * 100
    if (caloriePercent > tolerance) continue

    // Calculate primary macro accuracy
    const macroDiff = Math.abs(macroAtAmount - desiredMacroAmount)
    const macroAccuracy = Math.max(0, 100 - (macroDiff / desiredMacroAmount) * 100)

    // Calculate secondary macro accuracy if applicable
    let secondaryMacroAccuracy: number | undefined
    if (useSecondaryMacro && secondaryMacroType && secondaryMacroAmount) {
      const secondaryMacroAtAmount = getMacroValue(food, secondaryMacroType) * amountForCalories
      const secondaryMacroDiff = Math.abs(secondaryMacroAtAmount - secondaryMacroAmount)
      secondaryMacroAccuracy = Math.max(0, 100 - (secondaryMacroDiff / secondaryMacroAmount) * 100)
    }

    const calorieAccuracy = Math.max(0, 100 - (caloriesDiff / desiredCalories) * 100)

    // Calculate overall score
    // With secondary macro: 40% primary, 30% secondary, 30% calories
    // Without secondary macro: 60% primary, 40% calories
    let overallScore: number
    if (useSecondaryMacro && secondaryMacroAccuracy !== undefined) {
      overallScore = macroAccuracy * 0.4 + secondaryMacroAccuracy * 0.3 + calorieAccuracy * 0.3
    } else {
      overallScore = macroAccuracy * 0.6 + calorieAccuracy * 0.4
    }

    matches.push({
      food,
      amount,
      unit: food.default_unit,
      calories: food.calories * amountForCalories,
      protein: food.protein_g * amountForCalories,
      carbs: food.carb_g * amountForCalories,
      fat: food.fat_g * amountForCalories,
      macroAccuracy,
      secondaryMacroAccuracy,
      calorieAccuracy,
      overallScore,
    })
  }

  // Sort by overall score (highest first)
  matches.sort((a, b) => b.overallScore - a.overallScore)

  return matches.slice(0, numberOfResults)
}

/**
 * Helper to get macro value from food item
 */
function getMacroValue(food: FoodItem, macroType: 'protein' | 'carbs' | 'fat'): number {
  switch (macroType) {
    case 'protein':
      return food.protein_g
    case 'carbs':
      return food.carb_g
    case 'fat':
      return food.fat_g
  }
}

/**
 * Find foods to fill remaining macros for the day
 * Enhanced version with goal-based matching
 */
export function findFoodsForRemainingMacros(
  foods: FoodItem[],
  remaining: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
): FoodGoalMatch[] {
  // Validate inputs to prevent division by zero
  if (remaining.calories <= 0) {
    return []
  }

  // Determine which macro is most needed
  const total = remaining.protein + remaining.carbs + remaining.fat

  // If no macros remaining, return empty
  if (total <= 0) {
    return []
  }

  const proteinPercent = (remaining.protein / total) * 100
  const carbsPercent = (remaining.carbs / total) * 100
  const fatPercent = (remaining.fat / total) * 100

  let macroType: 'protein' | 'carbs' | 'fat'
  let macroAmount: number

  if (proteinPercent >= carbsPercent && proteinPercent >= fatPercent) {
    macroType = 'protein'
    macroAmount = remaining.protein
  } else if (carbsPercent >= proteinPercent && carbsPercent >= fatPercent) {
    macroType = 'carbs'
    macroAmount = remaining.carbs
  } else {
    macroType = 'fat'
    macroAmount = remaining.fat
  }

  // Use findBestFoodsForGoals with green food preference (low calorie density)
  return findBestFoodsForGoals(foods, {
    desiredCalories: remaining.calories,
    desiredMacroType: macroType,
    desiredMacroAmount: macroAmount,
    numberOfResults: 10,
    foodColors: ['Green', 'Yellow'], // Prefer healthier options
    tolerance: 20, // More lenient for suggestions
  })
}

/**
 * Quick search for high-protein foods
 */
export function findHighProteinFoods(
  foods: FoodItem[],
  targetCalories: number,
  numberOfResults: number = 5
): FoodGoalMatch[] {
  // Sort by protein density
  const sorted = foods
    .filter(food => food.calories > 0)
    .sort((a, b) => {
      const aRatio = a.protein_g / a.calories
      const bRatio = b.protein_g / b.calories
      return bRatio - aRatio
    })

  const matches: FoodGoalMatch[] = []

  for (const food of sorted.slice(0, numberOfResults * 2)) {
    const baseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100
    const amountForCalories = targetCalories / food.calories
    const weightGrams = amountForCalories * baseWeight
    const amount = convertWeightToUnit(weightGrams, food.default_unit, food.ml_per_gram)

    matches.push({
      food,
      amount,
      unit: food.default_unit,
      calories: food.calories * amountForCalories,
      protein: food.protein_g * amountForCalories,
      carbs: food.carb_g * amountForCalories,
      fat: food.fat_g * amountForCalories,
      macroAccuracy: 100, // N/A for this function
      calorieAccuracy: 100,
      overallScore: (food.protein_g / food.calories) * 100,
    })
  }

  return matches.slice(0, numberOfResults)
}

/**
 * Quick search for low-calorie foods
 */
export function findLowCalorieFoods(
  foods: FoodItem[],
  maxCalories: number,
  numberOfResults: number = 10
): FoodItem[] {
  return foods
    .filter(food => food.calories <= maxCalories)
    .filter(food => food.energy_density_color === 'Green') // Prefer green foods
    .sort((a, b) => a.calories - b.calories)
    .slice(0, numberOfResults)
}

/**
 * Find foods by color density (multiple selection)
 */
export function findFoodsByColors(foods: FoodItem[], colors: FoodColor[]): FoodItem[] {
  return foods.filter(food => colors.includes(food.energy_density_color || 'Yellow'))
}

// Legacy export for backwards compatibility
// Alias removed - use findFoodsByColors directly

/**
 * Find recipe or non-recipe foods
 */
export function findRecipeFoods(foods: FoodItem[], recipeOnly: boolean): FoodItem[] {
  return foods.filter(food => food.is_recipe === recipeOnly)
}
