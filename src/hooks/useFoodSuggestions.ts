import { useMemo } from 'react'
import { useFoodItems } from './useFoodItems'
import {
  findBestFoodsForGoals,
  type FindBestFoodsParams,
  type FoodGoalMatch,
} from '@/lib/utils/findBestFoodsForGoals'
import type { FoodColor } from '@/lib/calculations/colorDensity'

export interface FoodSuggestionParams {
  targetCalories: number
  primaryMacro: 'protein' | 'carbs' | 'fat'
  primaryMacroTarget: number
  secondaryMacro?: 'protein' | 'carbs' | 'fat'
  secondaryMacroTarget?: number
  count?: number
  recipesOnly?: boolean
  nonRecipesOnly?: boolean
  energyDensityColors?: FoodColor[]
  tolerance?: number
}

export interface UseFoodSuggestionsResult {
  suggestions: FoodGoalMatch[]
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to get food suggestions based on calorie and macro targets
 *
 * @param params - The suggestion parameters
 * @param enabled - Whether to run the calculation (default: true)
 * @returns Food suggestions sorted by match score
 */
export function useFoodSuggestions(
  params: FoodSuggestionParams,
  enabled: boolean = true
): UseFoodSuggestionsResult {
  const { data: foods, isLoading, error } = useFoodItems()

  const suggestions = useMemo(() => {
    if (!enabled || !foods || foods.length === 0) {
      return []
    }

    // Validate required inputs
    if (params.targetCalories <= 0 || params.primaryMacroTarget <= 0) {
      return []
    }

    const findParams: FindBestFoodsParams = {
      desiredCalories: params.targetCalories,
      desiredMacroType: params.primaryMacro,
      desiredMacroAmount: params.primaryMacroTarget,
      secondaryMacroType: params.secondaryMacro,
      secondaryMacroAmount: params.secondaryMacroTarget,
      numberOfResults: params.count || 10,
      recipeOnly: params.recipesOnly,
      nonRecipeOnly: params.nonRecipesOnly,
      foodColors: params.energyDensityColors,
      tolerance: params.tolerance || 25, // Reasonable default for accurate suggestions
    }

    return findBestFoodsForGoals(foods, findParams)
  }, [foods, params, enabled])

  return {
    suggestions,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Get macro label in Swedish
 */
export function getMacroLabel(macro: 'protein' | 'carbs' | 'fat'): string {
  switch (macro) {
    case 'protein':
      return 'Protein'
    case 'carbs':
      return 'Kolhydrater'
    case 'fat':
      return 'Fett'
    default: {
      // Exhaustiveness check - ensures all cases are handled
      const _exhaustive: never = macro
      return String(_exhaustive)
    }
  }
}

/**
 * Get macro color for styling
 */
export function getMacroColor(macro: 'protein' | 'carbs' | 'fat'): string {
  switch (macro) {
    case 'protein':
      return 'blue'
    case 'carbs':
      return 'green'
    case 'fat':
      return 'amber'
    default: {
      // Exhaustiveness check - ensures all cases are handled
      const _exhaustive: never = macro
      return String(_exhaustive)
    }
  }
}
