/**
 * Unit Conversion Utilities
 * Handles conversion between weight units and volume units for food items
 */

/**
 * Convert weight in grams to target unit.
 * Returns NaN for volume units when mlPerGram is not available — callers must guard.
 */
export function convertWeightToUnit(
  weightGrams: number,
  targetUnit: string,
  mlPerGram?: number | null
): number {
  switch (targetUnit) {
    case 'g':
      return weightGrams
    case 'kg':
      return weightGrams / 1000
    case 'ml':
      return mlPerGram ? weightGrams * mlPerGram : NaN
    case 'dl':
      return mlPerGram ? (weightGrams * mlPerGram) / 100 : NaN
    case 'msk':
      return mlPerGram ? (weightGrams * mlPerGram) / 15 : NaN
    case 'tsk':
      return mlPerGram ? (weightGrams * mlPerGram) / 5 : NaN
    default:
      return weightGrams
  }
}

/**
 * Get conversion factor from volume unit to grams.
 * Returns NaN when mlPerGram is not available — callers must guard.
 */
export function getVolumeToGrams(unit: string, mlPerGram?: number | null): number {
  if (!mlPerGram) return NaN

  const gramsPerMl = 1 / mlPerGram
  switch (unit) {
    case 'ml':
      return gramsPerMl
    case 'dl':
      return 100 * gramsPerMl
    case 'msk':
      return 15 * gramsPerMl
    case 'tsk':
      return 5 * gramsPerMl
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
  return unit === 'ml' || unit === 'dl' || unit === 'msk' || unit === 'tsk'
}
