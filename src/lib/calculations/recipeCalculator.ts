/**
 * Recipe Calculator
 * Calculates nutrition totals for recipes based on ingredients
 * Implements the "Recipe Calculator" feature from Excel
 */

import type { FoodItem } from '@/hooks/useFoodItems'
import { getVolumeToGrams, isVolumeUnit } from '@/lib/utils/unitConversion'
import { calculateFoodColor, type FoodColor } from '@/lib/calculations/colorDensity'

export interface NutrientRow {
  food_item_id: string
  nutrient_code: string
  amount: number
  reference_amount: number
}

export interface RecipeIngredientInput {
  foodItem: FoodItem
  amount: number
  unit: string
}

export interface IngredientNutrition {
  weightGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface RecipeNutrition {
  totalWeight: number
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalSaturatedFat: number | null
  totalSugars: number | null
  totalSalt: number | null
  perServing: {
    weight: number
    calories: number
    protein: number
    carbs: number
    fat: number
    saturatedFat: number | null
    sugars: number | null
    salt: number | null
  }
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
    saturatedFat: number | null
    sugars: number | null
    salt: number | null
  }
  energyDensityColor: FoodColor | null
}

/**
 * Calculate weight in grams for an ingredient based on amount and unit
 */
export function calculateIngredientWeight(food: FoodItem, amount: number, unit: string): number {
  if (amount <= 0) return 0

  // Handle gram-based units
  if (unit === 'g') {
    return amount
  }

  if (unit === 'kg') {
    return amount * 1000
  }

  // Handle volume units (dl, msk, tsk)
  if (isVolumeUnit(unit)) {
    const gramsPerUnit = getVolumeToGrams(unit, food.ml_per_gram)
    return amount * gramsPerUnit
  }

  // Handle piece/serving units (st, portion, etc.)
  if (food.grams_per_piece && food.grams_per_piece > 0) {
    // Check if this is the serving unit or a generic piece unit
    if (unit === food.serving_unit || unit === 'st' || unit === 'portion') {
      return amount * food.grams_per_piece
    }
  }

  // Fallback: if unit matches default_unit, use weight_grams
  if (unit === food.default_unit && food.weight_grams) {
    return amount * (food.weight_grams / food.default_amount)
  }

  // Last resort: assume amount is in grams (but log warning)
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Unknown unit "${unit}" for food "${food.name}", treating as grams`)
  }
  return amount
}

/**
 * Calculate nutrition for a single ingredient
 */
export function calculateIngredientNutrition(
  food: FoodItem,
  amount: number,
  unit: string
): IngredientNutrition {
  const weightGrams = calculateIngredientWeight(food, amount, unit)

  if (weightGrams <= 0) {
    return {
      weightGrams: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  }

  // Get base weight for the food item (default to 100g if not specified)
  const baseWeight = food.weight_grams && food.weight_grams > 0 ? food.weight_grams : 100

  // Calculate multiplier based on weight
  const multiplier = weightGrams / baseWeight

  return {
    weightGrams: Math.round(weightGrams * 10) / 10,
    calories: Math.round(food.calories * multiplier * 10) / 10,
    protein: Math.round(food.protein_g * multiplier * 10) / 10,
    carbs: Math.round(food.carb_g * multiplier * 10) / 10,
    fat: Math.round(food.fat_g * multiplier * 10) / 10,
  }
}

/**
 * Calculate total nutrition for a recipe
 */
export function calculateRecipeNutrition(
  ingredients: RecipeIngredientInput[],
  servings: number,
  allNutrients?: NutrientRow[]
): RecipeNutrition {
  // Calculate totals
  let totalWeight = 0
  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0

  // Track optional nutrients — null means "no data available at all"
  let totalSaturatedFat: number | null = null
  let totalSugars: number | null = null
  let totalSalt: number | null = null

  for (const ingredient of ingredients) {
    const nutrition = calculateIngredientNutrition(
      ingredient.foodItem,
      ingredient.amount,
      ingredient.unit
    )
    totalWeight += nutrition.weightGrams
    totalCalories += nutrition.calories
    totalProtein += nutrition.protein
    totalCarbs += nutrition.carbs
    totalFat += nutrition.fat

    // Sum optional nutrients from food_nutrients if available
    if (allNutrients && nutrition.weightGrams > 0) {
      const baseWeight =
        ingredient.foodItem.weight_grams && ingredient.foodItem.weight_grams > 0
          ? ingredient.foodItem.weight_grams
          : 100
      const multiplier = nutrition.weightGrams / baseWeight

      const itemNutrients = allNutrients.filter(n => n.food_item_id === ingredient.foodItem.id)

      const satFatRow = itemNutrients.find(n => n.nutrient_code === 'saturated_fat')
      if (satFatRow) {
        const scaled = (satFatRow.amount / satFatRow.reference_amount) * baseWeight * multiplier
        totalSaturatedFat = (totalSaturatedFat ?? 0) + scaled
      }

      const sugarsRow = itemNutrients.find(n => n.nutrient_code === 'sugars')
      if (sugarsRow) {
        const scaled = (sugarsRow.amount / sugarsRow.reference_amount) * baseWeight * multiplier
        totalSugars = (totalSugars ?? 0) + scaled
      }

      const saltRow = itemNutrients.find(n => n.nutrient_code === 'salt')
      if (saltRow) {
        const scaled = (saltRow.amount / saltRow.reference_amount) * baseWeight * multiplier
        totalSalt = (totalSalt ?? 0) + scaled
      }
    }
  }

  // Calculate per serving (safe division with NaN/Infinity protection)
  const servingCount = servings > 0 ? servings : 1
  const r = (v: number) => Math.round(v * 10) / 10 || 0
  const rOpt = (v: number | null) => (v !== null ? Math.round(v * 10) / 10 : null)

  const perServing = {
    weight: r(totalWeight / servingCount),
    calories: r(totalCalories / servingCount),
    protein: r(totalProtein / servingCount),
    carbs: r(totalCarbs / servingCount),
    fat: r(totalFat / servingCount),
    saturatedFat: rOpt(totalSaturatedFat !== null ? totalSaturatedFat / servingCount : null),
    sugars: rOpt(totalSugars !== null ? totalSugars / servingCount : null),
    salt: rOpt(totalSalt !== null ? totalSalt / servingCount : null),
  }

  // Calculate per 100g (with NaN/Infinity protection)
  const per100g =
    totalWeight > 0
      ? {
          calories: r((totalCalories / totalWeight) * 100),
          protein: r((totalProtein / totalWeight) * 100),
          carbs: r((totalCarbs / totalWeight) * 100),
          fat: r((totalFat / totalWeight) * 100),
          saturatedFat:
            totalSaturatedFat !== null ? rOpt((totalSaturatedFat / totalWeight) * 100) : null,
          sugars: totalSugars !== null ? rOpt((totalSugars / totalWeight) * 100) : null,
          salt: totalSalt !== null ? rOpt((totalSalt / totalWeight) * 100) : null,
        }
      : {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          saturatedFat: null,
          sugars: null,
          salt: null,
        }

  // Calculate energy density color (treat recipe as solid food)
  const energyDensityColor =
    totalWeight > 0
      ? calculateFoodColor({
          calories: totalCalories,
          weightGrams: totalWeight,
          foodType: 'Solid',
        })
      : null

  return {
    totalWeight: Math.round(totalWeight * 10) / 10,
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalSaturatedFat: rOpt(totalSaturatedFat),
    totalSugars: rOpt(totalSugars),
    totalSalt: rOpt(totalSalt),
    perServing,
    per100g,
    energyDensityColor,
  }
}

/**
 * Get available units for a food item
 */
export function getAvailableUnits(food: FoodItem): string[] {
  const units: string[] = ['g']

  // Add volume units if ml_per_gram is defined
  if (food.ml_per_gram && food.ml_per_gram > 0) {
    units.push('dl', 'msk', 'tsk')
  }

  // Add serving unit if grams_per_piece is defined
  if (food.grams_per_piece && food.grams_per_piece > 0) {
    const servingUnit = food.serving_unit || 'st'
    if (!units.includes(servingUnit)) {
      units.push(servingUnit)
    }
    if (!units.includes('st') && servingUnit !== 'st') {
      units.push('st')
    }
  }

  return units
}

/**
 * Get default unit for a food item in recipe context
 */
export function getDefaultRecipeUnit(food: FoodItem): string {
  // Prefer serving unit if available
  if (food.grams_per_piece && food.grams_per_piece > 0) {
    return food.serving_unit || 'st'
  }

  // Otherwise use default unit or gram
  return food.default_unit || 'g'
}

/**
 * Format unit display name
 */
export function formatUnitName(unit: string): string {
  const unitNames: Record<string, string> = {
    g: 'gram',
    kg: 'kilogram',
    dl: 'deciliter',
    msk: 'matsked',
    tsk: 'tesked',
    st: 'styck',
    portion: 'portion',
  }
  return unitNames[unit] || unit
}
