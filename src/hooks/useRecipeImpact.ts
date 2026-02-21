import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface RecipeImpact {
  recipe_id: string
  recipe_name: string
  servings: number
  ingredient_count: number
}

export function useRecipeImpact() {
  const getRecipesUsingFoodItem = useCallback(
    async (foodItemId: string): Promise<RecipeImpact[]> => {
      const { data, error } = await supabase.rpc('get_recipes_using_food_item', {
        p_food_item_id: foodItemId,
      })
      if (error) throw error
      return data as RecipeImpact[]
    },
    []
  )

  return { getRecipesUsingFoodItem }
}
