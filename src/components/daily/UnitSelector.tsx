import { useMemo } from 'react'
import { Select } from '@/components/ui/select'
import type { FoodItem } from '@/hooks/useFoodItems'

// Volume conversions (ml per unit)
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  dl: 100,
  msk: 15,
  tsk: 5,
}

const UNIT_LABELS: Record<string, string> = {
  g: 'gram',
  ml: 'ml',
  dl: 'dl',
  msk: 'msk',
  tsk: 'tsk',
  st: 'st',
}

interface UnitSelectorProps {
  food: FoodItem
  value: string
  onChange: (unit: string) => void
  className?: string
}

/**
 * Get available units for a food item based on its properties
 */
export function getAvailableUnits(food: FoodItem): string[] {
  const units: string[] = []

  // Always add the default unit first
  units.push(food.default_unit ?? 'g')

  // Always ensure 'g' is available (for 100g reference)
  if (!units.includes('g')) units.push('g')

  // Add volume units if the food is ml-based (no density needed for ml↔dl/msk/tsk)
  // or if ml_per_gram is set (enables gram↔volume conversion too)
  const isMlBased = (food.default_unit ?? '').toLowerCase() === 'ml'
  if (isMlBased || food.ml_per_gram) {
    if (!units.includes('ml')) units.push('ml')
    if (!units.includes('dl')) units.push('dl')
    if (!units.includes('msk')) units.push('msk')
    if (!units.includes('tsk')) units.push('tsk')
  }

  // If food has grams_per_piece OR a serving_unit defined, add the serving unit
  if (food.grams_per_piece || (food.serving_unit && food.serving_unit.trim())) {
    const servingUnit = food.serving_unit || 'st'
    if (!units.includes(servingUnit) && !VOLUME_TO_ML[servingUnit.toLowerCase()]) {
      units.push(servingUnit)
    }
  }

  // Unused default_unit that isn't g/ml/volume — already added first, keep it
  // Remove duplicates introduced by edge cases
  return [...new Set(units.map(u => u).filter(Boolean))]
}

/**
 * Calculate nutrition values for a given amount and unit
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

  // Calculate weight in grams based on unit
  if (unitLower === 'g') {
    weightGrams = amount
  } else if (unitLower === 'ml') {
    if (food.ml_per_gram) {
      weightGrams = amount / food.ml_per_gram
    } else if ((food.default_unit ?? '').toLowerCase() === 'ml') {
      // ml-based food without density: scale directly against reference_amount (ml)
      const refMl = food.reference_amount > 0 ? food.reference_amount : 100
      weightGrams = (amount / refMl) * refMl // weight stays virtual; nutrition ratio is amount/refMl
      // Override: use ml ratio directly in the nutrition calc below by returning early
      const ratio = amount / (food.reference_amount > 0 ? food.reference_amount : 100)
      return {
        weightGrams: amount, // ml treated as "weight" for display purposes
        calories: food.calories * ratio,
        protein: food.protein_g * ratio,
        carbs: food.carb_g * ratio,
        fat: food.fat_g * ratio,
      }
    } else {
      return null
    }
  } else if (VOLUME_TO_ML[unitLower]) {
    // Volume unit (dl, msk, tsk)
    const totalMl = amount * VOLUME_TO_ML[unitLower]
    if (food.ml_per_gram) {
      weightGrams = totalMl / food.ml_per_gram
    } else if ((food.default_unit ?? '').toLowerCase() === 'ml') {
      // ml-based food without density: compute ratio against reference_amount (ml)
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
    // Piece/serving unit — use grams_per_piece if available
    if (food.grams_per_piece) {
      if (food.reference_unit === 'ml' && food.ml_per_gram) {
        // grams_per_piece stores ml for ml-products; convert to gram so multiplier stays in gram/gram
        weightGrams = (amount * food.grams_per_piece) / food.ml_per_gram
      } else {
        weightGrams = amount * food.grams_per_piece
      }
    } else {
      // No piece weight known — scale amount relative to default_amount
      const refAmount = food.reference_amount > 0 ? food.reference_amount : 100
      weightGrams = (amount / food.default_amount) * refAmount
    }
  } else {
    // Unknown unit — scale amount relative to default_amount using reference_amount as base
    const refAmount = food.reference_amount > 0 ? food.reference_amount : 100
    weightGrams = (amount / food.default_amount) * refAmount
  }

  // Calculate nutrition based on weight ratio.
  // food.calories/protein_g/etc. are always stored per reference_amount (default 100g).
  // Special case: ml-based foods — convert reference_amount (ml) to grams first.
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

export function UnitSelector({ food, value, onChange, className }: UnitSelectorProps) {
  const availableUnits = useMemo(() => getAvailableUnits(food), [food])

  // Ensure current value is in the list
  const currentValue = availableUnits.includes(value) ? value : availableUnits[0]

  return (
    <Select
      value={currentValue}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={className}
    >
      {availableUnits.map(unit => (
        <option key={unit} value={unit}>
          {UNIT_LABELS[(unit ?? 'g').toLowerCase()] || unit}
        </option>
      ))}
    </Select>
  )
}
