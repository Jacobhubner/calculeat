import { useMemo } from 'react'
import type { DailyLog, MealEntry } from './useDailyLogs'
import type { Profile } from '@/lib/types'
import {
  calculateNutrientStatus,
  calculateMealStatus,
  calculateMacroStatus,
  calculateEnergyDensity,
  getEnergyDensityColor,
  getEnergyDensityLabel,
  calculateColorCategoryStatus,
  areMacrosBalanced,
  isColorBalanceOk,
  DEFAULT_COLOR_TARGETS,
  type NutrientStatus,
  type DailySummaryData,
} from '@/lib/calculations/dailySummary'

interface MealSummary {
  mealName: string
  percentage: number
  calories: number
  fat: number
  carbs: number
  protein: number
  status: NutrientStatus
  itemCount: number
}

export interface DailySummaryResult extends DailySummaryData {
  // Meal-specific summaries
  meals: MealSummary[]

  // Helper values
  avgCalories: number
  totalWeight: number

  // Remaining values (for sidebar tools)
  remainingCalories: number
  remainingProtein: number
  remainingCarbs: number
  remainingFat: number
}

/**
 * Calculate complete daily summary from DailyLog and Profile
 * Implements all Excel "Today" sheet calculations
 */
export function useDailySummary(
  dailyLog: DailyLog | null | undefined,
  profile: Profile | null | undefined,
  mealSettings?: Array<{ meal_name: string; percentage_of_daily_calories: number }>
): DailySummaryResult | null {
  return useMemo(() => {
    if (!dailyLog || !profile) return null

    // Get calorie goals from daily log snapshot (or profile as fallback)
    const caloriesMin = dailyLog.goal_calories_min ?? profile.calories_min ?? 0
    const caloriesMax = dailyLog.goal_calories_max ?? profile.calories_max ?? 0
    const avgCalories = (caloriesMin + caloriesMax) / 2

    // Get macro percentages from profile
    const fatMinPercent = (profile.fat_min_percent ?? 20) / 100
    const fatMaxPercent = (profile.fat_max_percent ?? 35) / 100
    const carbMinPercent = (profile.carb_min_percent ?? 45) / 100
    const carbMaxPercent = (profile.carb_max_percent ?? 65) / 100
    const proteinMinPercent = (profile.protein_min_percent ?? 10) / 100
    const proteinMaxPercent = (profile.protein_max_percent ?? 35) / 100

    // Get color targets (use defaults for now, can be extended to profile later)
    const colorTargets = {
      green: DEFAULT_COLOR_TARGETS.green,
      yellow: DEFAULT_COLOR_TARGETS.yellow,
      orange: DEFAULT_COLOR_TARGETS.orange,
    }

    // Current totals from daily log
    const totalCalories = dailyLog.total_calories ?? 0
    const totalFat = dailyLog.total_fat_g ?? 0
    const totalCarbs = dailyLog.total_carb_g ?? 0
    const totalProtein = dailyLog.total_protein_g ?? 0
    const greenCalories = dailyLog.green_calories ?? 0
    const yellowCalories = dailyLog.yellow_calories ?? 0
    const orangeCalories = dailyLog.orange_calories ?? 0

    // Calculate total weight from meals if available
    // kcal_per_gram is already in DailyLog, but we calculate it fresh
    let totalWeight = 0
    if (dailyLog.meals) {
      for (const meal of dailyLog.meals) {
        if (meal.items) {
          for (const item of meal.items) {
            totalWeight += item.weight_grams ?? 0
          }
        }
      }
    }

    // Calculate energy density
    const energyDensity = calculateEnergyDensity(totalCalories, totalWeight)

    // Calculate all statuses
    const calorieStatus = calculateNutrientStatus(totalCalories, caloriesMin, caloriesMax, 'kcal')

    const fatStatus = calculateMacroStatus(totalFat, fatMinPercent, fatMaxPercent, avgCalories, 9)

    const carbStatus = calculateMacroStatus(
      totalCarbs,
      carbMinPercent,
      carbMaxPercent,
      avgCalories,
      4
    )

    const proteinStatus = calculateMacroStatus(
      totalProtein,
      proteinMinPercent,
      proteinMaxPercent,
      avgCalories,
      4
    )

    const greenStatus = calculateColorCategoryStatus(
      greenCalories,
      colorTargets.green,
      caloriesMin,
      caloriesMax
    )

    const yellowStatus = calculateColorCategoryStatus(
      yellowCalories,
      colorTargets.yellow,
      caloriesMin,
      caloriesMax
    )

    const orangeStatus = calculateColorCategoryStatus(
      orangeCalories,
      colorTargets.orange,
      caloriesMin,
      caloriesMax
    )

    // Calculate checklist
    const caloriesOk = calorieStatus.status === 'within'
    const macrosOk = areMacrosBalanced(fatStatus, carbStatus, proteinStatus)
    const colorBalanceOk = isColorBalanceOk(greenStatus, yellowStatus, orangeStatus)
    const checkedItems = [caloriesOk, macrosOk, colorBalanceOk].filter(Boolean).length

    // Calculate meal summaries
    const meals: MealSummary[] = []
    if (mealSettings && dailyLog.meals) {
      for (const setting of mealSettings) {
        const mealEntry = dailyLog.meals.find(m => m.meal_name === setting.meal_name)
        const mealPercent = (setting.percentage_of_daily_calories ?? 0) / 100

        const mealCalories = mealEntry?.meal_calories ?? 0
        const mealFat = mealEntry?.meal_fat_g ?? 0
        const mealCarbs = mealEntry?.meal_carb_g ?? 0
        const mealProtein = mealEntry?.meal_protein_g ?? 0
        const itemCount = mealEntry?.items?.length ?? 0

        meals.push({
          mealName: setting.meal_name,
          percentage: mealPercent,
          calories: mealCalories,
          fat: mealFat,
          carbs: mealCarbs,
          protein: mealProtein,
          status: calculateMealStatus(mealCalories, mealPercent, caloriesMin, caloriesMax),
          itemCount,
        })
      }
    }

    // Calculate remaining values for tools
    const remainingCalories = Math.max(caloriesMax - totalCalories, 0)
    const remainingProtein = Math.max(proteinStatus.max - totalProtein, 0)
    const remainingCarbs = Math.max(carbStatus.max - totalCarbs, 0)
    const remainingFat = Math.max(fatStatus.max - totalFat, 0)

    return {
      calorieStatus,
      fatStatus,
      carbStatus,
      proteinStatus,
      energyDensity,
      energyDensityColor: getEnergyDensityColor(energyDensity),
      energyDensityLabel: getEnergyDensityLabel(energyDensity),
      greenStatus,
      yellowStatus,
      orangeStatus,
      colorTargets,
      checklist: {
        caloriesOk,
        macrosOk,
        colorBalanceOk,
        totalChecked: checkedItems,
        totalItems: 3,
      },
      meals,
      avgCalories,
      totalWeight,
      remainingCalories,
      remainingProtein,
      remainingCarbs,
      remainingFat,
    }
  }, [dailyLog, profile, mealSettings])
}

/**
 * Get a single meal's summary
 */
export function useMealSummary(
  mealEntry: MealEntry | undefined,
  mealPercent: number,
  caloriesMin: number,
  caloriesMax: number
): MealSummary | null {
  return useMemo(() => {
    if (!mealEntry) return null

    return {
      mealName: mealEntry.meal_name,
      percentage: mealPercent,
      calories: mealEntry.meal_calories ?? 0,
      fat: mealEntry.meal_fat_g ?? 0,
      carbs: mealEntry.meal_carb_g ?? 0,
      protein: mealEntry.meal_protein_g ?? 0,
      status: calculateMealStatus(
        mealEntry.meal_calories ?? 0,
        mealPercent,
        caloriesMin,
        caloriesMax
      ),
      itemCount: mealEntry.items?.length ?? 0,
    }
  }, [mealEntry, mealPercent, caloriesMin, caloriesMax])
}
