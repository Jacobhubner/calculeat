/**
 * Daily Summary Calculations
 * Implements Excel "Today" sheet logic for nutrition tracking
 */

export type NutrientStatusType = 'under' | 'within' | 'over'

export interface NutrientStatus {
  current: number
  min: number
  max: number
  status: NutrientStatusType
  difference: number
  displayText: string
}

/**
 * Calculate nutrient status with ⇧/✔/⇩ indicators
 * Based on Excel K5 formula logic
 *
 * @param current - Current consumed amount
 * @param min - Minimum target
 * @param max - Maximum target
 * @param unit - Unit for display (kcal, g)
 * @returns NutrientStatus with calculated values
 */
export function calculateNutrientStatus(
  current: number,
  min: number,
  max: number,
  unit: string
): NutrientStatus {
  // Handle edge case where min/max are 0 or undefined
  if (min === 0 && max === 0) {
    return {
      current,
      min,
      max,
      status: 'within',
      difference: 0,
      displayText: `${Math.round(current)} ${unit}`,
    }
  }

  if (current < min) {
    const diff = min - current
    return {
      current,
      min,
      max,
      status: 'under',
      difference: diff,
      displayText: `⇧ ${Math.round(diff)} ${unit}`,
    }
  } else if (current > max) {
    const diff = current - max
    return {
      current,
      min,
      max,
      status: 'over',
      difference: diff,
      displayText: `⇩ ${Math.round(diff)} ${unit}`,
    }
  } else {
    // Within range - show remaining to max
    const diff = max - current
    return {
      current,
      min,
      max,
      status: 'within',
      difference: diff,
      displayText: `✔ ${Math.round(diff)} ${unit}`,
    }
  }
}

/**
 * Calculate meal-specific calorie status
 * Each meal has a percentage target of daily calories
 *
 * @param mealCalories - Calories consumed in this meal
 * @param mealPercent - Meal's percentage of daily calories (0-1)
 * @param dailyMin - Daily minimum calorie goal
 * @param dailyMax - Daily maximum calorie goal
 */
export function calculateMealStatus(
  mealCalories: number,
  mealPercent: number,
  dailyMin: number,
  dailyMax: number
): NutrientStatus {
  const mealMin = dailyMin * mealPercent
  const mealMax = dailyMax * mealPercent
  return calculateNutrientStatus(mealCalories, mealMin, mealMax, 'kcal')
}

/**
 * Calculate macro status (protein, carbs, fat)
 * Converts percentage goals to gram goals
 *
 * @param currentGrams - Current intake in grams
 * @param minPercent - Minimum percentage of calories (0-1)
 * @param maxPercent - Maximum percentage of calories (0-1)
 * @param avgCalories - Average daily calorie goal ((min + max) / 2)
 * @param kcalPerGram - Calories per gram (protein/carb: 4, fat: 9)
 */
export function calculateMacroStatus(
  currentGrams: number,
  minPercent: number,
  maxPercent: number,
  avgCalories: number,
  kcalPerGram: number
): NutrientStatus {
  const minGrams = (avgCalories * minPercent) / kcalPerGram
  const maxGrams = (avgCalories * maxPercent) / kcalPerGram
  return calculateNutrientStatus(currentGrams, minGrams, maxGrams, 'g')
}

/**
 * Calculate energy density (kcal per gram)
 * M11 in Excel: Total calories / Total weight
 */
export function calculateEnergyDensity(totalCalories: number, totalWeightGrams: number): number {
  if (totalWeightGrams <= 0) return 0
  return totalCalories / totalWeightGrams
}

/**
 * Get color for energy density value
 * Based on Excel SPARKLINE color coding
 */
export function getEnergyDensityColor(density: number): string {
  if (density <= 0) return 'neutral'
  if (density < 0.5) return 'cyan'
  if (density < 1.0) return 'green'
  if (density < 2.0) return 'yellow'
  if (density < 2.5) return 'orange'
  return 'red'
}

/**
 * Get Tailwind classes for energy density color
 */
export function getEnergyDensityColorClass(density: number): string {
  const color = getEnergyDensityColor(density)
  switch (color) {
    case 'cyan':
      return 'bg-cyan-500'
    case 'green':
      return 'bg-green-500'
    case 'yellow':
      return 'bg-yellow-500'
    case 'orange':
      return 'bg-orange-500'
    case 'red':
      return 'bg-red-500'
    default:
      return 'bg-neutral-300'
  }
}

/**
 * Get Swedish label for energy density value
 */
export function getEnergyDensityLabel(density: number): string {
  if (density <= 0) return 'Ingen data'
  if (density < 0.5) return 'Mycket låg'
  if (density < 1.0) return 'Låg (optimalt)'
  if (density < 2.0) return 'Medel'
  if (density < 2.5) return 'Hög'
  return 'Mycket hög'
}

/**
 * Get description for energy density interpretation
 */
export function getEnergyDensityDescription(density: number): string {
  if (density <= 0) return 'Lägg till mat för att se energitäthet'
  if (density < 0.5) return 'Drycker, soppor, vattentäta grönsaker'
  if (density < 1.0) return 'Grönsaker, frukt, magra proteiner'
  if (density < 2.0) return 'Blandkost, kolhydrater, måttligt fett'
  if (density < 2.5) return 'Fetare mat, ost, nötter'
  return 'Mycket energität mat (chips, choklad, olja)'
}

// Color category targets - default percentages
// Can be customized per profile
export const DEFAULT_COLOR_TARGETS = {
  green: 0.3, // 30% of daily calories
  yellow: 0.45, // 45% of daily calories
  orange: 0.25, // 25% of daily calories
} as const

/**
 * Calculate color category status for a specific color
 *
 * @param colorCalories - Calories from this color category
 * @param colorPercent - Target percentage for this color (0-1)
 * @param dailyMin - Daily minimum calorie goal
 * @param dailyMax - Daily maximum calorie goal
 */
export function calculateColorCategoryStatus(
  colorCalories: number,
  colorPercent: number,
  dailyMin: number,
  dailyMax: number
): NutrientStatus {
  const colorMin = dailyMin * colorPercent
  const colorMax = dailyMax * colorPercent
  return calculateNutrientStatus(colorCalories, colorMin, colorMax, 'kcal')
}

/**
 * Get range text for a color category target
 * e.g., "873 - 927 kcal"
 */
export function getColorCategoryRangeText(
  colorPercent: number,
  dailyMin: number,
  dailyMax: number
): string {
  const min = Math.round(dailyMin * colorPercent)
  const max = Math.round(dailyMax * colorPercent)
  return `${min} - ${max} kcal`
}

/**
 * Check if all three macros are within their target ranges
 */
export function areMacrosBalanced(
  fatStatus: NutrientStatus,
  carbStatus: NutrientStatus,
  proteinStatus: NutrientStatus
): boolean {
  return (
    fatStatus.status === 'within' &&
    carbStatus.status === 'within' &&
    proteinStatus.status === 'within'
  )
}

/**
 * Check if all three color categories are within their target ranges
 */
export function isColorBalanceOk(
  greenStatus: NutrientStatus,
  yellowStatus: NutrientStatus,
  orangeStatus: NutrientStatus
): boolean {
  return (
    greenStatus.status === 'within' &&
    yellowStatus.status === 'within' &&
    orangeStatus.status === 'within'
  )
}

/**
 * Get status badge configuration based on NutrientStatus
 */
export function getStatusBadgeConfig(status: NutrientStatus): {
  variant: 'under' | 'within' | 'over'
  icon: '⇧' | '✔' | '⇩'
  colorClass: string
  bgClass: string
  textClass: string
} {
  switch (status.status) {
    case 'under':
      return {
        variant: 'under',
        icon: '⇧',
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-50 border-blue-200',
        textClass: 'text-blue-500',
      }
    case 'within':
      return {
        variant: 'within',
        icon: '✔',
        colorClass: 'text-green-600',
        bgClass: 'bg-green-50 border-green-200',
        textClass: 'text-green-700',
      }
    case 'over':
      return {
        variant: 'over',
        icon: '⇩',
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-700',
      }
  }
}

/**
 * Calculate progress percentage for a tri-zone bar
 * Returns a value 0-100 where:
 * - 0-33: Under minimum (cyan zone)
 * - 33-66: Within range (green zone)
 * - 66-100: Over maximum (red zone)
 */
export function calculateTriZoneProgress(current: number, min: number, max: number): number {
  if (max === 0) return 0

  if (current < min) {
    // Under minimum: map 0->current to 0->33
    return (current / min) * 33
  } else if (current <= max) {
    // Within range: map min->current to 33->66
    const rangeProgress = (current - min) / (max - min)
    return 33 + rangeProgress * 33
  } else {
    // Over maximum: map max->current to 66->100 (cap at 100)
    const overProgress = Math.min((current - max) / max, 1) // Cap at 100% over
    return 66 + overProgress * 34
  }
}

export interface DailySummaryData {
  // Calorie status
  calorieStatus: NutrientStatus

  // Macro status
  fatStatus: NutrientStatus
  carbStatus: NutrientStatus
  proteinStatus: NutrientStatus

  // Energy density
  energyDensity: number
  energyDensityColor: string
  energyDensityLabel: string

  // Color category status
  greenStatus: NutrientStatus
  yellowStatus: NutrientStatus
  orangeStatus: NutrientStatus

  // Color targets used
  colorTargets: {
    green: number
    yellow: number
    orange: number
  }

  // Checklist results
  checklist: {
    caloriesOk: boolean
    macrosOk: boolean
    colorBalanceOk: boolean
    totalChecked: number
    totalItems: number
  }
}
