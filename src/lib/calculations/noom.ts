/**
 * Noom Color System
 * Implements the Noom traffic light system from Excel "New Item" sheet
 * Categorizes foods based on calorie density (kcal/gram)
 */

export type NoomColor = 'Green' | 'Yellow' | 'Orange'
export type NoomFoodType = 'Solid' | 'Liquid' | 'Soup'

export interface NoomCalculationParams {
  calories: number
  weightGrams: number
  foodType: NoomFoodType
}

/**
 * Calculate calorie density (kcal per gram)
 */
export function calculateCalorieDensity(calories: number, weightGrams: number): number {
  if (weightGrams <= 0) {
    return 0
  }
  return calories / weightGrams
}

/**
 * Determine Noom color based on food type and calorie density
 * Exact formula from Excel: "New Item" sheet, cell J14
 *
 * Solid foods:
 *   Green: < 1 kcal/g
 *   Yellow: 1-2.4 kcal/g
 *   Orange: > 2.4 kcal/g
 *
 * Liquid foods:
 *   Green: < 0.4 kcal/g
 *   Yellow: 0.4-0.5 kcal/g
 *   Orange: > 0.5 kcal/g
 *
 * Soup:
 *   Green: < 0.5 kcal/g
 *   Yellow: 0.5-1 kcal/g
 *   Orange: > 1 kcal/g
 */
export function calculateNoomColor(params: NoomCalculationParams): NoomColor {
  const { calories, weightGrams, foodType } = params

  const kcalPerGram = calculateCalorieDensity(calories, weightGrams)

  if (foodType === 'Solid') {
    if (kcalPerGram < 1) return 'Green'
    if (kcalPerGram <= 2.4) return 'Yellow'
    return 'Orange'
  }

  if (foodType === 'Liquid') {
    if (kcalPerGram < 0.4) return 'Green'
    if (kcalPerGram <= 0.5) return 'Yellow'
    return 'Orange'
  }

  if (foodType === 'Soup') {
    if (kcalPerGram < 0.5) return 'Green'
    if (kcalPerGram <= 1) return 'Yellow'
    return 'Orange'
  }

  // Default to Solid logic
  if (kcalPerGram < 1) return 'Green'
  if (kcalPerGram <= 2.4) return 'Yellow'
  return 'Orange'
}

/**
 * Get Noom color thresholds for a food type
 */
export function getNoomThresholds(foodType: NoomFoodType): { green: number; yellow: number } {
  switch (foodType) {
    case 'Solid':
      return { green: 1, yellow: 2.4 }
    case 'Liquid':
      return { green: 0.4, yellow: 0.5 }
    case 'Soup':
      return { green: 0.5, yellow: 1 }
    default:
      return { green: 1, yellow: 2.4 }
  }
}

/**
 * Get description for Noom color
 */
export const NOOM_COLOR_DESCRIPTIONS: Record<NoomColor, string> = {
  Green: 'Låg kaloritäthet - ät mer av dessa',
  Yellow: 'Måttlig kaloritäthet - ät i måttliga mängder',
  Orange: 'Hög kaloritäthet - ät mindre av dessa',
}

/**
 * Get Swedish description for food type
 */
export const NOOM_FOOD_TYPE_DESCRIPTIONS: Record<NoomFoodType, string> = {
  Solid: 'Fast föda',
  Liquid: 'Vätska',
  Soup: 'Soppa',
}

/**
 * Calculate Noom color distribution for a meal or day
 */
export interface NoomDistribution {
  greenCalories: number
  yellowCalories: number
  orangeCalories: number
  totalCalories: number
  greenPercentage: number
  yellowPercentage: number
  orangePercentage: number
}

export function calculateNoomDistribution(
  foods: Array<{ calories: number; noomColor: NoomColor }>
): NoomDistribution {
  const greenCalories = foods
    .filter(f => f.noomColor === 'Green')
    .reduce((sum, f) => sum + f.calories, 0)

  const yellowCalories = foods
    .filter(f => f.noomColor === 'Yellow')
    .reduce((sum, f) => sum + f.calories, 0)

  const orangeCalories = foods
    .filter(f => f.noomColor === 'Orange')
    .reduce((sum, f) => sum + f.calories, 0)

  const totalCalories = greenCalories + yellowCalories + orangeCalories

  return {
    greenCalories,
    yellowCalories,
    orangeCalories,
    totalCalories,
    greenPercentage: totalCalories > 0 ? (greenCalories / totalCalories) * 100 : 0,
    yellowPercentage: totalCalories > 0 ? (yellowCalories / totalCalories) * 100 : 0,
    orangePercentage: totalCalories > 0 ? (orangeCalories / totalCalories) * 100 : 0,
  }
}

/**
 * Recommend Noom color targets for weight loss
 * Based on Noom recommendations
 */
export function getNoomTargets(): {
  green: { min: number; max: number }
  yellow: { min: number; max: number }
  orange: { min: number; max: number }
} {
  return {
    green: { min: 30, max: 100 }, // At least 30% green foods
    yellow: { min: 0, max: 45 }, // Up to 45% yellow foods
    orange: { min: 0, max: 25 }, // Up to 25% orange foods
  }
}
