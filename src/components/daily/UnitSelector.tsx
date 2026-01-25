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
  const defaultUnit = food.default_unit.toLowerCase()

  // Always add the default unit first
  units.push(food.default_unit)

  // If default unit is gram or ml, and food has ml_per_gram, add volume units
  if ((defaultUnit === 'g' || defaultUnit === 'ml') && food.ml_per_gram) {
    if (!units.includes('ml')) units.push('ml')
    if (!units.includes('dl')) units.push('dl')
    if (!units.includes('msk')) units.push('msk')
    if (!units.includes('tsk')) units.push('tsk')
  }

  // If food has grams_per_piece, add the serving unit
  if (food.grams_per_piece) {
    const servingUnit = food.serving_unit || 'st'
    if (!units.includes(servingUnit)) {
      units.push(servingUnit)
    }
  }

  return units
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

  const unitLower = unit.toLowerCase()
  let weightGrams: number

  // Calculate weight in grams based on unit
  if (unitLower === 'g') {
    weightGrams = amount
  } else if (unitLower === 'ml') {
    if (!food.ml_per_gram) return null
    weightGrams = amount / food.ml_per_gram
  } else if (VOLUME_TO_ML[unitLower]) {
    // Volume unit (dl, msk, tsk)
    if (!food.ml_per_gram) return null
    const totalMl = amount * VOLUME_TO_ML[unitLower]
    weightGrams = totalMl / food.ml_per_gram
  } else if (unitLower === 'st' || unitLower === food.serving_unit?.toLowerCase()) {
    // Piece/serving unit
    if (!food.grams_per_piece) return null
    weightGrams = amount * food.grams_per_piece
  } else {
    // Unknown unit - assume it's the default unit
    const baseWeight = food.weight_grams || 100
    weightGrams = (amount / food.default_amount) * baseWeight
  }

  // Calculate nutrition based on weight ratio
  const baseWeight = food.weight_grams || 100
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
          {UNIT_LABELS[unit.toLowerCase()] || unit}
        </option>
      ))}
    </Select>
  )
}
