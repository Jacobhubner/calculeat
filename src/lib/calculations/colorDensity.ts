/**
 * Color Density System (Volumetrics-based Traffic Light System)
 * Categorizes foods based on calorie density (kcal/gram)
 * Uses color-coding: Green (low), Yellow (medium), Orange (high)
 */

export type FoodColor = 'Green' | 'Yellow' | 'Orange'
export type FoodType = 'Solid' | 'Liquid' | 'Soup'

export interface ColorDensityCalculationParams {
  calories: number
  weightGrams: number
  foodType: FoodType
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
 * Calculate kcal per gram with data quality awareness.
 * Returns null if insufficient data (e.g. ml-based without density).
 * Never approximates — incomplete data → null.
 */
export function calculateKcalPerGram(params: {
  calories: number
  referenceAmount: number
  referenceUnit: 'g' | 'ml'
  densityGPerMl?: number | null
}): number | null {
  if (params.referenceAmount <= 0) return null

  if (params.referenceUnit === 'g') {
    return params.calories / params.referenceAmount
  }

  // referenceUnit = 'ml'
  if (!params.densityGPerMl || params.densityGPerMl <= 0) return null
  return params.calories / params.referenceAmount / params.densityGPerMl
}

/**
 * Determine food color based on food type and calorie density
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
export function calculateFoodColor(params: ColorDensityCalculationParams): FoodColor {
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
 * Calculate food color from reference-based params.
 * Returns null if kcal_per_gram cannot be determined.
 */
export function calculateFoodColorFromReference(params: {
  calories: number
  referenceAmount: number
  referenceUnit: 'g' | 'ml'
  densityGPerMl?: number | null
  foodType: FoodType | null
}): FoodColor | null {
  if (!params.foodType) return null

  const kcalPerGram = calculateKcalPerGram({
    calories: params.calories,
    referenceAmount: params.referenceAmount,
    referenceUnit: params.referenceUnit,
    densityGPerMl: params.densityGPerMl,
  })

  if (kcalPerGram === null) return null

  return calculateFoodColor({
    calories: params.calories,
    weightGrams: params.calories / kcalPerGram, // reverse to weight for existing function
    foodType: params.foodType,
  })
}

/**
 * Get color thresholds for a food type
 */
export function getColorThresholds(foodType: FoodType): { green: number; yellow: number } {
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
 * Get description for food color
 */
export const FOOD_COLOR_DESCRIPTIONS: Record<FoodColor, string> = {
  Green: 'Låg kaloritäthet - ät mer av dessa',
  Yellow: 'Måttlig kaloritäthet - ät i måttliga mängder',
  Orange: 'Hög kaloritäthet - ät mindre av dessa',
}

/**
 * Get Swedish description for food type
 */
export const FOOD_TYPE_DESCRIPTIONS: Record<FoodType, string> = {
  Solid: 'Fast föda',
  Liquid: 'Vätska',
  Soup: 'Soppa',
}

/**
 * Calculate color distribution for a meal or day
 */
export interface ColorDistribution {
  greenCalories: number
  yellowCalories: number
  orangeCalories: number
  totalCalories: number
  greenPercentage: number
  yellowPercentage: number
  orangePercentage: number
}

export function calculateColorDistribution(
  foods: Array<{ calories: number; foodColor: FoodColor }>
): ColorDistribution {
  const greenCalories = foods
    .filter(f => f.foodColor === 'Green')
    .reduce((sum, f) => sum + f.calories, 0)

  const yellowCalories = foods
    .filter(f => f.foodColor === 'Yellow')
    .reduce((sum, f) => sum + f.calories, 0)

  const orangeCalories = foods
    .filter(f => f.foodColor === 'Orange')
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
 * Recommend color targets for weight loss
 * Based on volumetrics principles
 */
export function getColorTargets(): {
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

// Legacy "Noom" exports removed - trademark compliance
// Use the standard names: FoodColor, calculateFoodColor, etc.
