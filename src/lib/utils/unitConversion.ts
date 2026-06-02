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
  mlPerGram?: number | null,
  sourceMlBased?: boolean
): number {
  // For ml-based foods without density, weightGrams is actually ml.
  // Use mlPerGram=1 so the ml↔volume conversions work correctly.
  const effectiveMlPerGram = mlPerGram ?? (sourceMlBased ? 1 : null)
  switch (targetUnit) {
    case 'g':
      return weightGrams
    case 'kg':
      return weightGrams / 1000
    case 'ml':
      return effectiveMlPerGram ? weightGrams * effectiveMlPerGram : NaN
    case 'dl':
      return effectiveMlPerGram ? (weightGrams * effectiveMlPerGram) / 100 : NaN
    case 'msk':
      return effectiveMlPerGram ? (weightGrams * effectiveMlPerGram) / 15 : NaN
    case 'tsk':
      return effectiveMlPerGram ? (weightGrams * effectiveMlPerGram) / 5 : NaN
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
