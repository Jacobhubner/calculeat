/**
 * Find Best Foods for Goals
 * Advanced algorithm from Apps Script Today.gs
 * Finds foods that match BOTH calorie AND macro targets
 */

import type { FoodItem } from '@/hooks/useFoodItems'
import type { FoodColor } from '@/lib/calculations/colorDensity'

export interface FindBestFoodsParams {
  desiredCalories: number
  desiredMacroType: 'protein' | 'carbs' | 'fat'
  desiredMacroAmount: number
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
  macroAccuracy: number // How close to desired macro (0-100%)
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
    numberOfResults = 10,
    recipeOnly = false,
    nonRecipeOnly = false,
    foodColors = [],
    tolerance = 10,
  } = params

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
    filtered = filtered.filter(food => foodColors.includes(food.noom_color || 'Yellow'))
  }

  // Calculate matches
  const matches: FoodGoalMatch[] = []

  for (const food of filtered) {
    // Calculate amount needed to reach desired calories
    const amountForCalories = desiredCalories / food.calories

    // Calculate what macros we'd get at that amount
    const macroAtAmount = getMacroValue(food, desiredMacroType) * amountForCalories

    // Check if calories are within tolerance
    const caloriesDiff = Math.abs(food.calories * amountForCalories - desiredCalories)
    const caloriePercent = (caloriesDiff / desiredCalories) * 100
    if (caloriePercent > tolerance) continue

    // Calculate accuracy scores
    const macroDiff = Math.abs(macroAtAmount - desiredMacroAmount)
    const macroAccuracy = Math.max(0, 100 - (macroDiff / desiredMacroAmount) * 100)

    const calorieAccuracy = Math.max(0, 100 - (caloriesDiff / desiredCalories) * 100)

    // Overall score (weighted: 60% macro accuracy, 40% calorie accuracy)
    const overallScore = macroAccuracy * 0.6 + calorieAccuracy * 0.4

    matches.push({
      food,
      amount: amountForCalories * food.default_amount,
      unit: food.default_unit,
      calories: food.calories * amountForCalories,
      protein: food.protein_g * amountForCalories,
      carbs: food.carb_g * amountForCalories,
      fat: food.fat_g * amountForCalories,
      macroAccuracy,
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
  // Determine which macro is most needed
  const total = remaining.protein + remaining.carbs + remaining.fat
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
    const amountForCalories = targetCalories / food.calories

    matches.push({
      food,
      amount: amountForCalories * food.default_amount,
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
    .filter(food => food.noom_color === 'Green') // Prefer green foods
    .sort((a, b) => a.calories - b.calories)
    .slice(0, numberOfResults)
}

/**
 * Find foods by color density (multiple selection)
 */
export function findFoodsByColors(foods: FoodItem[], colors: FoodColor[]): FoodItem[] {
  return foods.filter(food => colors.includes(food.noom_color || 'Yellow'))
}

// Legacy export for backwards compatibility
export const findFoodsByNoomColors = findFoodsByColors

/**
 * Find recipe or non-recipe foods
 */
export function findRecipeFoods(foods: FoodItem[], recipeOnly: boolean): FoodItem[] {
  return foods.filter(food => food.is_recipe === recipeOnly)
}
