/**
 * Unit Conversion System
 * Implements all 8 conversion cases from Excel "Unit converter.gs"
 * and ml_gram formula from "New Item" sheet
 */

export type FoodUnit =
  | 'g'
  | 'ml'
  | 'dl'
  | 'tbsp'
  | 'msk'
  | 'tsp'
  | 'tsk'
  | 'pinch'
  | 'krm'
  | 'oz'
  | 'cup(US)'
  | 'st'
  | 'piece'

export interface UnitConversionParams {
  amount: number
  fromUnit: FoodUnit
  toUnit: FoodUnit
  // Optional metadata for conversion
  gramsPerUnit?: number // How many grams in one unit (e.g., 1 apple = 150g)
  mlPerGram?: number // For liquids: how many ml per gram
  defaultServingGrams?: number // Default serving size in grams
}

/**
 * Volume unit conversions to ml
 */
const VOLUME_TO_ML: Record<string, number> = {
  dl: 100,
  tbsp: 15,
  msk: 15, // Swedish tablespoon
  tsp: 5,
  tsk: 5, // Swedish teaspoon
  pinch: 1,
  krm: 1, // Swedish pinch
  oz: 29.5735296875,
  'cup(US)': 236.5882365,
}

/**
 * Calculate ml_per_gram from volume conversions
 * This is the complex formula from Excel "New Item" sheet
 */
export function calculateMlPerGram(params: {
  amount_g: number
  amount_volume: number
  unit_volume: FoodUnit
}): number | null {
  const { amount_g, amount_volume, unit_volume } = params

  if (amount_g <= 0 || amount_volume <= 0) {
    return null
  }

  // Direct ml conversion
  if (unit_volume === 'ml') {
    return amount_volume / amount_g
  }

  // Volume unit conversions
  const mlPerUnit = VOLUME_TO_ML[unit_volume]
  if (mlPerUnit) {
    const totalMl = amount_volume * mlPerUnit
    return totalMl / amount_g
  }

  return null
}

/**
 * Convert between units
 * Implements all 8 conversion cases from Excel
 */
export function convertUnits(params: UnitConversionParams): number {
  const { amount, fromUnit, toUnit, gramsPerUnit, mlPerGram } = params

  // Same unit - no conversion needed
  if (fromUnit === toUnit) {
    return amount
  }

  // Case 1: g/100g to volume unit
  if (fromUnit === 'g' && VOLUME_TO_ML[toUnit]) {
    if (!mlPerGram) {
      throw new Error('mlPerGram required for g to volume conversion')
    }
    const totalMl = amount * mlPerGram
    return totalMl / VOLUME_TO_ML[toUnit]
  }

  // Case 2: ml/100ml to volume unit
  if (fromUnit === 'ml' && VOLUME_TO_ML[toUnit]) {
    return amount / VOLUME_TO_ML[toUnit]
  }

  // Case 3: Any volume unit to 1 volume (reverse of case 2)
  if (VOLUME_TO_ML[fromUnit] && toUnit === 'ml') {
    return amount * VOLUME_TO_ML[fromUnit]
  }

  // Case 4: g/100g to ml/100ml (requires mlPerGram)
  if (fromUnit === 'g' && toUnit === 'ml') {
    if (!mlPerGram) {
      throw new Error('mlPerGram required for g to ml conversion')
    }
    return amount * mlPerGram
  }

  // Case 5: ml/100ml to g/100g (reverse of case 4)
  if (fromUnit === 'ml' && toUnit === 'g') {
    if (!mlPerGram) {
      throw new Error('mlPerGram required for ml to g conversion')
    }
    return amount / mlPerGram
  }

  // Case 6: Any unit to 100 unit (serving size conversion)
  if (toUnit === 'g' && gramsPerUnit) {
    if (fromUnit === 'st' || fromUnit === 'piece') {
      return amount * gramsPerUnit
    }
    // Convert volume to ml first, then to grams
    if (VOLUME_TO_ML[fromUnit]) {
      const totalMl = amount * VOLUME_TO_ML[fromUnit]
      if (mlPerGram) {
        return totalMl / mlPerGram
      }
    }
  }

  // Case 7: g/100g to any other unit (piece, serving, etc.)
  if (fromUnit === 'g' && (toUnit === 'st' || toUnit === 'piece')) {
    if (!gramsPerUnit) {
      throw new Error('gramsPerUnit required for g to piece conversion')
    }
    return amount / gramsPerUnit
  }

  // Case 8: ml/100ml to any other unit
  if (fromUnit === 'ml' && (toUnit === 'st' || toUnit === 'piece')) {
    if (!gramsPerUnit || !mlPerGram) {
      throw new Error('gramsPerUnit and mlPerGram required for ml to piece conversion')
    }
    // Convert ml to g first
    const grams = amount / mlPerGram
    return grams / gramsPerUnit
  }

  // Case 9: Volume unit to any other unit
  if (VOLUME_TO_ML[fromUnit] && (toUnit === 'g' || toUnit === 'st' || toUnit === 'piece')) {
    const totalMl = amount * VOLUME_TO_ML[fromUnit]
    if (!mlPerGram) {
      throw new Error('mlPerGram required for volume to weight conversion')
    }
    const grams = totalMl / mlPerGram

    if (toUnit === 'g') {
      return grams
    }
    if (toUnit === 'st' || toUnit === 'piece') {
      if (!gramsPerUnit) {
        throw new Error('gramsPerUnit required for volume to piece conversion')
      }
      return grams / gramsPerUnit
    }
  }

  throw new Error(`Unsupported conversion: ${fromUnit} to ${toUnit}`)
}

/**
 * Calculate weight in grams for any unit
 */
export function calculateWeightInGrams(
  amount: number,
  unit: FoodUnit,
  gramsPerUnit?: number,
  mlPerGram?: number
): number {
  if (unit === 'g') {
    return amount
  }

  if (unit === 'st' || unit === 'piece') {
    if (!gramsPerUnit) {
      throw new Error('gramsPerUnit required for piece to gram conversion')
    }
    return amount * gramsPerUnit
  }

  // Volume units
  if (unit === 'ml') {
    if (!mlPerGram) {
      throw new Error('mlPerGram required for ml to gram conversion')
    }
    return amount / mlPerGram
  }

  const mlPerUnit = VOLUME_TO_ML[unit]
  if (mlPerUnit) {
    if (!mlPerGram) {
      throw new Error('mlPerGram required for volume to gram conversion')
    }
    const totalMl = amount * mlPerUnit
    return totalMl / mlPerGram
  }

  throw new Error(`Unsupported unit: ${unit}`)
}

/**
 * Get unit display name in Swedish
 */
export const UNIT_DISPLAY_NAMES: Record<FoodUnit, string> = {
  g: 'gram',
  ml: 'milliliter',
  dl: 'deciliter',
  tbsp: 'matsked',
  msk: 'matsked',
  tsp: 'tesked',
  tsk: 'tesked',
  pinch: 'kryddmått',
  krm: 'kryddmått',
  oz: 'uns',
  'cup(US)': 'kopp (US)',
  st: 'styck',
  piece: 'styck',
}
