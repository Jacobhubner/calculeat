/**
 * Unit Conversion Utilities
 * Handles conversion between weight units and volume units for food items
 */

/**
 * Convert weight in grams to target unit
 *
 * @param weightGrams - Weight in grams
 * @param targetUnit - Target unit (g, kg, dl, msk, tsk, st, etc.)
 * @param mlPerGram - Conversion factor for volume (ml per gram). Defaults to 1.0 (water density)
 * @returns Amount in target unit
 */
export function convertWeightToUnit(
  weightGrams: number,
  targetUnit: string,
  mlPerGram?: number
): number {
  switch (targetUnit) {
    case 'g':
      return weightGrams
    case 'kg':
      return weightGrams / 1000
    case 'dl': {
      // 1 dl = 100ml
      const ml = weightGrams * (mlPerGram || 1)
      return ml / 100
    }
    case 'msk': {
      // 1 msk = 15ml
      const mlMsk = weightGrams * (mlPerGram || 1)
      return mlMsk / 15
    }
    case 'tsk': {
      // 1 tsk = 5ml
      const mlTsk = weightGrams * (mlPerGram || 1)
      return mlTsk / 5
    }
    default:
      // For other units (st, pkt, etc.), return grams
      return weightGrams
  }
}

/**
 * Get conversion factor from volume unit to grams
 *
 * @param unit - Volume unit (dl, msk, tsk)
 * @param mlPerGram - Conversion factor (ml per gram). Defaults to 1.0 (water density)
 * @returns Grams per unit
 */
export function getVolumeToGrams(unit: string, mlPerGram?: number): number {
  // Convert ml per gram to grams per ml
  const gramsPerMl = mlPerGram ? 1 / mlPerGram : 1

  switch (unit) {
    case 'dl':
      return 100 * gramsPerMl // 1 dl = 100ml
    case 'msk':
      return 15 * gramsPerMl // 1 msk = 15ml
    case 'tsk':
      return 5 * gramsPerMl // 1 tsk = 5ml
    default:
      return 1
  }
}

/**
 * Check if a unit is volume-based
 *
 * @param unit - Unit to check
 * @returns True if unit is volume-based
 */
export function isVolumeUnit(unit: string): boolean {
  return unit === 'dl' || unit === 'msk' || unit === 'tsk'
}
