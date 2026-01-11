/**
 * Food Finder Algorithm
 * Smart search and filtering for food items based on multiple criteria
 */

import type { FoodItem } from '@/hooks/useFoodItems'
import type { FoodColor } from '@/lib/calculations/colorDensity'

export interface FoodFinderParams {
  query?: string
  energyDensityColor?: FoodColor
  maxCalories?: number
  minProtein?: number
  maxCarbs?: number
  maxFat?: number
  sortBy?: 'name' | 'calories' | 'protein' | 'noom'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search and filter food items with advanced criteria
 */
export function findFoods(foods: FoodItem[], params: FoodFinderParams): FoodItem[] {
  let results = [...foods]

  // Text search
  if (params.query && params.query.trim()) {
    const query = params.query.toLowerCase().trim()
    results = results.filter(food => {
      const name = food.name.toLowerCase()
      const brand = food.brand?.toLowerCase() || ''
      const barcode = food.barcode || ''

      return name.includes(query) || brand.includes(query) || barcode.includes(query)
    })
  }

  // Noom color filter
  if (params.energyDensityColor) {
    results = results.filter(food => food.energy_density_color === params.energyDensityColor)
  }

  // Calorie filter (per 100g)
  if (params.maxCalories !== undefined) {
    results = results.filter(food => {
      const caloriesPer100g =
        food.default_unit === 'g' ? (food.calories / food.default_amount) * 100 : food.calories
      return caloriesPer100g <= params.maxCalories
    })
  }

  // Protein filter (minimum per 100g)
  if (params.minProtein !== undefined) {
    results = results.filter(food => {
      const proteinPer100g =
        food.default_unit === 'g' ? (food.protein_g / food.default_amount) * 100 : food.protein_g
      return proteinPer100g >= params.minProtein
    })
  }

  // Carbs filter (maximum per 100g)
  if (params.maxCarbs !== undefined) {
    results = results.filter(food => {
      const carbsPer100g =
        food.default_unit === 'g' ? (food.carb_g / food.default_amount) * 100 : food.carb_g
      return carbsPer100g <= params.maxCarbs
    })
  }

  // Fat filter (maximum per 100g)
  if (params.maxFat !== undefined) {
    results = results.filter(food => {
      const fatPer100g =
        food.default_unit === 'g' ? (food.fat_g / food.default_amount) * 100 : food.fat_g
      return fatPer100g <= params.maxFat
    })
  }

  // Sorting
  if (params.sortBy) {
    const order = params.sortOrder || 'asc'
    const multiplier = order === 'asc' ? 1 : -1

    results.sort((a, b) => {
      switch (params.sortBy) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name)

        case 'calories':
          return multiplier * (a.calories - b.calories)

        case 'protein':
          return multiplier * (a.protein_g - b.protein_g)

        case 'noom': {
          const noomOrder = { Green: 1, Yellow: 2, Orange: 3 }
          const aOrder = noomOrder[a.energy_density_color || 'Yellow']
          const bOrder = noomOrder[b.energy_density_color || 'Yellow']
          return multiplier * (aOrder - bOrder)
        }

        default:
          return 0
      }
    })
  }

  return results
}

/**
 * Find foods that match a specific macro target
 * Useful for meal planning
 */
export function findFoodsByMacroTarget(
  foods: FoodItem[],
  target: {
    calories: number
    protein?: number
    carbs?: number
    fat?: number
    tolerance?: number // % tolerance, default 10%
  }
): FoodItem[] {
  const tolerance = target.tolerance || 10

  return foods.filter(food => {
    // Check calories
    const calorieDiff = Math.abs(food.calories - target.calories)
    const caloriePercent = (calorieDiff / target.calories) * 100
    if (caloriePercent > tolerance) return false

    // Check protein if specified
    if (target.protein !== undefined) {
      const proteinDiff = Math.abs(food.protein_g - target.protein)
      const proteinPercent = (proteinDiff / target.protein) * 100
      if (proteinPercent > tolerance) return false
    }

    // Check carbs if specified
    if (target.carbs !== undefined) {
      const carbsDiff = Math.abs(food.carb_g - target.carbs)
      const carbsPercent = (carbsDiff / target.carbs) * 100
      if (carbsPercent > tolerance) return false
    }

    // Check fat if specified
    if (target.fat !== undefined) {
      const fatDiff = Math.abs(food.fat_g - target.fat)
      const fatPercent = (fatDiff / target.fat) * 100
      if (fatPercent > tolerance) return false
    }

    return true
  })
}

/**
 * Suggest foods to fill remaining macros for the day
 */
export function suggestFoodsForRemainingMacros(
  foods: FoodItem[],
  remaining: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
): FoodItem[] {
  // Calculate which macro is most needed (as % of remaining)
  const total = remaining.protein + remaining.carbs + remaining.fat
  const proteinPercent = (remaining.protein / total) * 100
  const carbsPercent = (remaining.carbs / total) * 100
  const fatPercent = (remaining.fat / total) * 100

  // Filter foods that are high in the most needed macro
  let suggestions: FoodItem[] = []

  if (proteinPercent >= carbsPercent && proteinPercent >= fatPercent) {
    // Need protein - find high protein foods
    suggestions = foods.filter(food => {
      const proteinRatio = food.protein_g / food.calories
      return proteinRatio > 0.2 // At least 20% of calories from protein
    })
  } else if (carbsPercent >= proteinPercent && carbsPercent >= fatPercent) {
    // Need carbs - find high carb foods
    suggestions = foods.filter(food => {
      const carbRatio = (food.carb_g * 4) / food.calories
      return carbRatio > 0.5 // At least 50% of calories from carbs
    })
  } else {
    // Need fat - find high fat foods
    suggestions = foods.filter(food => {
      const fatRatio = (food.fat_g * 9) / food.calories
      return fatRatio > 0.6 // At least 60% of calories from fat
    })
  }

  // Filter by remaining calories
  suggestions = suggestions.filter(food => food.calories <= remaining.calories * 1.1)

  // Sort by Noom color (prefer green)
  suggestions.sort((a, b) => {
    const noomOrder = { Green: 1, Yellow: 2, Orange: 3 }
    const aOrder = noomOrder[a.energy_density_color || 'Yellow']
    const bOrder = noomOrder[b.energy_density_color || 'Yellow']
    return aOrder - bOrder
  })

  return suggestions.slice(0, 10) // Top 10 suggestions
}

/**
 * Calculate "similarity score" between two foods
 * Useful for finding substitutes
 */
export function calculateFoodSimilarity(food1: FoodItem, food2: FoodItem): number {
  let score = 0

  // Same Noom color (+20 points)
  if (food1.energy_density_color === food2.energy_density_color) {
    score += 20
  }

  // Similar calories (+30 points max)
  const calorieDiff = Math.abs(food1.calories - food2.calories)
  const calorieScore = Math.max(0, 30 - calorieDiff / 10)
  score += calorieScore

  // Similar protein (+20 points max)
  const proteinDiff = Math.abs(food1.protein_g - food2.protein_g)
  const proteinScore = Math.max(0, 20 - proteinDiff)
  score += proteinScore

  // Similar carbs (+15 points max)
  const carbsDiff = Math.abs(food1.carb_g - food2.carb_g)
  const carbsScore = Math.max(0, 15 - carbsDiff)
  score += carbsScore

  // Similar fat (+15 points max)
  const fatDiff = Math.abs(food1.fat_g - food2.fat_g)
  const fatScore = Math.max(0, 15 - fatDiff)
  score += fatScore

  return score // Max 100 points
}

/**
 * Find substitute foods for a given food item
 */
export function findSubstitutes(
  targetFood: FoodItem,
  allFoods: FoodItem[],
  limit: number = 5
): Array<{ food: FoodItem; similarity: number }> {
  // Calculate similarity for all foods
  const withScores = allFoods
    .filter(food => food.id !== targetFood.id) // Exclude the food itself
    .map(food => ({
      food,
      similarity: calculateFoodSimilarity(targetFood, food),
    }))

  // Sort by similarity (highest first)
  withScores.sort((a, b) => b.similarity - a.similarity)

  return withScores.slice(0, limit)
}
