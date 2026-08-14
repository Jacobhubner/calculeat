import { useMemo } from 'react'
import { useFoodItems } from './useFoodItems'
import {
  findBestFoodsForGoals,
  type FindBestFoodsParams,
  type FoodGoalMatch,
} from '@/lib/utils/findBestFoodsForGoals'
import type { FoodColor } from '@/lib/calculations/colorDensity'
import type { FoodSource, FoodTab } from './useFoodItems'
import { getDataSourceByTabKey, getAllSourceIds } from '@/lib/constants/dataSources'

/**
 * 'alla' och 'mina' är virtuella filter; övriga värden är tabKey ur
 * DATA_SOURCES, så en ny datakälla blir giltig utan att typen ändras.
 */
export type SuggestionSourceFilter = 'alla' | 'mina' | FoodTab

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
  sourceFilter?: SuggestionSourceFilter
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

    // Filter by source — datakällorna slås upp i DATA_SOURCES i stället för
    // en case per källa, så en ny källa fungerar utan ändring här.
    const sourcesToInclude: FoodSource[] = (() => {
      if (params.sourceFilter === 'mina') return ['user', 'manual']
      const dataSource = params.sourceFilter
        ? getDataSourceByTabKey(params.sourceFilter)
        : undefined
      if (dataSource) return [dataSource.id as FoodSource]
      // 'alla', utelämnat filter och okända värden: egna + alla registrerade
      return ['user', 'manual', ...(getAllSourceIds() as FoodSource[])]
    })()
    const filteredFoods = foods.filter(f => sourcesToInclude.includes(f.source))

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

    return findBestFoodsForGoals(filteredFoods, findParams)
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
