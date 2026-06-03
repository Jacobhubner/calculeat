import type { FoodItem } from '@/hooks/useFoodItems'

// Volume conversions (ml per unit)
export const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  dl: 100,
  msk: 15,
  tsk: 5,
}

/**
 * Get available units for a food item based on its properties
 */
export function getAvailableUnits(food: FoodItem): string[] {
  const units: string[] = []

  units.push(food.default_unit ?? 'g')

  if (!units.includes('g')) units.push('g')

  const isMlBased = (food.default_unit ?? '').toLowerCase() === 'ml'
  if (isMlBased || food.ml_per_gram) {
    if (!units.includes('ml')) units.push('ml')
    if (!units.includes('dl')) units.push('dl')
    if (!units.includes('msk')) units.push('msk')
    if (!units.includes('tsk')) units.push('tsk')
  }

  if (food.grams_per_piece || (food.serving_unit && food.serving_unit.trim())) {
    const servingUnit = food.serving_unit || 'st'
    if (!units.includes(servingUnit) && !VOLUME_TO_ML[servingUnit.toLowerCase()]) {
      units.push(servingUnit)
    }
  }

  return [...new Set(units.filter(Boolean))]
}

/**
 * Calculate nutrition values for a given amount and unit.
 * Single source of truth — shared by UnitSelector, saved meals, recipe preview, etc.
 */
export function calculateNutritionForUnit(
  food: FoodItem,
  amount: number,
  unit: string
): {
  weightGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
} | null {
  if (amount <= 0) return null

  const unitLower = (unit ?? 'g').toLowerCase()
  let weightGrams: number

  if (unitLower === 'g') {
    weightGrams = amount
  } else if (unitLower === 'ml') {
    if (food.ml_per_gram) {
      weightGrams = amount / food.ml_per_gram
    } else if ((food.default_unit ?? '').toLowerCase() === 'ml') {
      const ratio = amount / (food.reference_amount > 0 ? food.reference_amount : 100)
      return {
        weightGrams: amount,
        calories: food.calories * ratio,
        protein: food.protein_g * ratio,
        carbs: food.carb_g * ratio,
        fat: food.fat_g * ratio,
      }
    } else {
      return null
    }
  } else if (VOLUME_TO_ML[unitLower]) {
    const totalMl = amount * VOLUME_TO_ML[unitLower]
    if (food.ml_per_gram) {
      weightGrams = totalMl / food.ml_per_gram
    } else if ((food.default_unit ?? '').toLowerCase() === 'ml') {
      const ratio = totalMl / (food.reference_amount > 0 ? food.reference_amount : 100)
      return {
        weightGrams: totalMl,
        calories: food.calories * ratio,
        protein: food.protein_g * ratio,
        carbs: food.carb_g * ratio,
        fat: food.fat_g * ratio,
      }
    } else {
      return null
    }
  } else if (unitLower === 'st' || unitLower === food.serving_unit?.toLowerCase()) {
    if (food.grams_per_piece) {
      if (food.reference_unit === 'ml' && food.ml_per_gram) {
        weightGrams = (amount * food.grams_per_piece) / food.ml_per_gram
      } else {
        weightGrams = amount * food.grams_per_piece
      }
    } else {
      const refAmount = food.reference_amount > 0 ? food.reference_amount : 100
      weightGrams = (amount / food.default_amount) * refAmount
    }
  } else {
    const refAmount = food.reference_amount > 0 ? food.reference_amount : 100
    weightGrams = (amount / food.default_amount) * refAmount
  }

  const baseWeight =
    food.reference_unit === 'ml' && food.ml_per_gram && food.reference_amount
      ? food.reference_amount / food.ml_per_gram
      : food.reference_amount > 0
        ? food.reference_amount
        : 100
  const multiplier = weightGrams / baseWeight

  return {
    weightGrams: Math.round(weightGrams * 10) / 10,
    calories: Math.round(food.calories * multiplier * 10) / 10,
    protein: Math.round(food.protein_g * multiplier * 10) / 10,
    carbs: Math.round(food.carb_g * multiplier * 10) / 10,
    fat: Math.round(food.fat_g * multiplier * 10) / 10,
  }
}
