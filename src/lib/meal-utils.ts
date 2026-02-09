import type { MealEntry } from '@/hooks/useDailyLogs'
import type { CreateSavedMealInput } from '@/hooks/useSavedMeals'

/**
 * Generate a smart default meal name based on meal type and time
 *
 * Examples:
 * - "Frukost" at 7am weekday → "Min vanliga frukost"
 * - "Lunch" at 12pm weekend → "Helglunch"
 * - "Mellanmål 1" → "Mellanmål 1 - 8 feb"
 */
export const generateDefaultMealName = (mealType: string): string => {
  const now = new Date()
  const isWeekend = [0, 6].includes(now.getDay())

  const prefix = isWeekend ? 'Helg' : 'Min vanliga'

  // Check for common meal types (case-insensitive)
  const lowerMealType = mealType.toLowerCase()

  if (lowerMealType.includes('frukost')) {
    return `${prefix} frukost`
  } else if (lowerMealType.includes('lunch')) {
    return `${prefix} lunch`
  } else if (lowerMealType.includes('middag')) {
    return `${prefix} middag`
  }

  // Fallback: meal type + date
  const day = now.getDate()
  const month = now.toLocaleString('sv-SE', { month: 'short' })
  return `${mealType} - ${day} ${month}`
}

/**
 * Transform a MealEntry from Today's Log into CreateSavedMealInput format
 *
 * @param mealEntry - The meal entry from daily log (with items)
 * @param customName - Optional custom name (if not provided, uses generateDefaultMealName)
 * @returns CreateSavedMealInput ready for useCreateSavedMeal() mutation
 */
export const transformMealToSavedMeal = (
  mealEntry: MealEntry,
  customName?: string
): CreateSavedMealInput => {
  return {
    name: customName || generateDefaultMealName(mealEntry.meal_name),
    items: mealEntry.items?.map(item => ({
      food_item_id: item.food_item_id,
      amount: item.amount,
      unit: item.unit,
      weight_grams: item.weight_grams,
    })) || []
  }
}

/**
 * Get the numeric order for a meal name
 *
 * @param mealName - The meal name (e.g., "Frukost", "Lunch")
 * @returns The numeric order (0-4) for the meal
 */
export const getMealOrder = (mealName: string): number => {
  const orderMap: Record<string, number> = {
    'Frukost': 0,
    'Lunch': 1,
    'Middag': 2,
    'Mellanmål': 3,
    'Mellanmål 1': 3,
    'Mellanmål 2': 4,
  }
  if (orderMap[mealName] !== undefined) return orderMap[mealName]
  // Fallback: if name contains "mellanmål", give it order 3+
  if (mealName.toLowerCase().includes('mellanmål')) return 3
  return 0
}

/**
 * Get suggested meal slot based on current time
 *
 * @returns The suggested meal name based on time of day
 */
export const getSuggestedMealSlot = (): string => {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 10) return 'Frukost'
  if (hour >= 10 && hour < 14) return 'Lunch'
  if (hour >= 14 && hour < 22) return 'Middag'

  return 'Mellanmål 1'
}
