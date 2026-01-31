import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FoodColor } from '@/lib/calculations/colorDensity'
import type { FoodItem } from '@/hooks/useFoodItems'

export interface RecipeIngredient {
  id: string
  recipe_id: string
  food_item_id: string
  amount: number
  unit: string
  weight_grams?: number
  ingredient_order: number
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  name: string
  servings: number
  food_item_id?: string
  food_item?: FoodItem | null // The linked food item with default_unit info
  total_weight_grams?: number
  created_at: string
  updated_at: string
  ingredients?: RecipeIngredient[]
}

export interface RecipeNutritionData {
  totalWeight: number
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  perServing: {
    weight: number
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  energyDensityColor: FoodColor | null
}

export interface CreateRecipeInput {
  name: string
  servings: number
  saveAs?: '100g' | 'portion' // How to save the food_item
  ingredients: Array<{
    food_item_id: string
    amount: number
    unit: string
    weight_grams?: number
  }>
  // Nutrition data calculated in frontend
  nutrition?: RecipeNutritionData
}

/**
 * Get all recipes for the current user
 */
export function useRecipes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          food_item:food_items(*),
          ingredients:recipe_ingredients(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      return data as Recipe[]
    },
    enabled: !!user,
  })
}

/**
 * Search recipes
 */
export function useSearchRecipes(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recipes', 'search', user?.id, query],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          food_item:food_items(*),
          ingredients:recipe_ingredients(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .order('name')

      if (error) throw error
      return data as Recipe[]
    },
    enabled: !!user && !!query,
  })
}

/**
 * Get a single recipe by ID
 */
export function useRecipe(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          food_item:food_items(*),
          ingredients:recipe_ingredients(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as Recipe
    },
    enabled: !!user && !!id,
  })
}

/**
 * Create a new recipe
 * Also creates a corresponding food_item with is_recipe=true for easy meal logging
 */
export function useCreateRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      if (!user) throw new Error('User not authenticated')

      let foodItemId: string | undefined

      // If nutrition data is provided, create a food_item for the recipe
      if (input.nutrition) {
        const saveAs = input.saveAs || 'portion'
        const is100gFormat = saveAs === '100g'

        const foodItemData = is100gFormat
          ? {
              // Per 100g format - only 100g display available (no unit toggle)
              user_id: user.id,
              name: input.name,
              is_recipe: true,
              default_amount: 100,
              default_unit: 'g',
              calories: input.nutrition.per100g.calories,
              protein_g: input.nutrition.per100g.protein,
              carb_g: input.nutrition.per100g.carbs,
              fat_g: input.nutrition.per100g.fat,
              weight_grams: 100,
              kcal_per_gram: input.nutrition.per100g.calories / 100,
              energy_density_color: input.nutrition.energyDensityColor,
              food_type: 'Solid' as const,
            }
          : {
              // Per portion format - both port and 100g display available
              user_id: user.id,
              name: input.name,
              is_recipe: true,
              default_amount: 1,
              default_unit: 'portion',
              calories: input.nutrition.perServing.calories,
              protein_g: input.nutrition.perServing.protein,
              carb_g: input.nutrition.perServing.carbs,
              fat_g: input.nutrition.perServing.fat,
              weight_grams: input.nutrition.perServing.weight,
              kcal_per_gram: input.nutrition.per100g.calories / 100,
              energy_density_color: input.nutrition.energyDensityColor,
              food_type: 'Solid' as const,
              grams_per_piece: input.nutrition.perServing.weight,
              serving_unit: 'portion',
              kcal_per_unit: input.nutrition.perServing.calories,
              fat_per_unit: input.nutrition.perServing.fat,
              carb_per_unit: input.nutrition.perServing.carbs,
              protein_per_unit: input.nutrition.perServing.protein,
            }

        const { data: foodItem, error: foodItemError } = await supabase
          .from('food_items')
          .insert(foodItemData)
          .select()
          .single()

        if (foodItemError) throw foodItemError
        foodItemId = foodItem.id
      }

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: input.name,
          servings: input.servings,
          food_item_id: foodItemId,
          total_weight_grams: input.nutrition?.totalWeight,
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      // Add ingredients
      if (input.ingredients.length > 0) {
        const ingredients = input.ingredients.map((ing, index) => ({
          recipe_id: recipe.id,
          food_item_id: ing.food_item_id,
          amount: ing.amount,
          unit: ing.unit,
          weight_grams: ing.weight_grams,
          ingredient_order: index,
        }))

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredients)

        if (ingredientsError) throw ingredientsError
      }

      return recipe as Recipe
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

/**
 * Update a recipe
 * Also updates the corresponding food_item if it exists
 */
export function useUpdateRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateRecipeInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated')

      // Get existing recipe to find food_item_id
      const { data: existingRecipe } = await supabase
        .from('recipes')
        .select('food_item_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      // Update food_item if it exists and nutrition data is provided
      if (existingRecipe?.food_item_id && input.nutrition && input.name) {
        const saveAs = input.saveAs || 'portion'
        const is100gFormat = saveAs === '100g'

        const foodItemUpdate = is100gFormat
          ? {
              // Per 100g format - only 100g display (clear per-portion fields)
              name: input.name,
              default_amount: 100,
              default_unit: 'g',
              calories: input.nutrition.per100g.calories,
              protein_g: input.nutrition.per100g.protein,
              carb_g: input.nutrition.per100g.carbs,
              fat_g: input.nutrition.per100g.fat,
              weight_grams: 100,
              kcal_per_gram: input.nutrition.per100g.calories / 100,
              energy_density_color: input.nutrition.energyDensityColor,
              // Clear per-portion fields so no unit toggle appears
              grams_per_piece: null,
              serving_unit: null,
              kcal_per_unit: null,
              fat_per_unit: null,
              carb_per_unit: null,
              protein_per_unit: null,
            }
          : {
              // Per portion format - both port and 100g display available
              name: input.name,
              default_amount: 1,
              default_unit: 'portion',
              calories: input.nutrition.perServing.calories,
              protein_g: input.nutrition.perServing.protein,
              carb_g: input.nutrition.perServing.carbs,
              fat_g: input.nutrition.perServing.fat,
              weight_grams: input.nutrition.perServing.weight,
              kcal_per_gram: input.nutrition.per100g.calories / 100,
              energy_density_color: input.nutrition.energyDensityColor,
              grams_per_piece: input.nutrition.perServing.weight,
              serving_unit: 'portion',
              kcal_per_unit: input.nutrition.perServing.calories,
              fat_per_unit: input.nutrition.perServing.fat,
              carb_per_unit: input.nutrition.perServing.carbs,
              protein_per_unit: input.nutrition.perServing.protein,
            }

        await supabase
          .from('food_items')
          .update(foodItemUpdate)
          .eq('id', existingRecipe.food_item_id)
      }

      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: input.name,
          servings: input.servings,
          total_weight_grams: input.nutrition?.totalWeight,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (recipeError) throw recipeError

      // Update ingredients if provided
      if (input.ingredients) {
        // Delete old ingredients
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)

        // Add new ingredients
        if (input.ingredients.length > 0) {
          const ingredients = input.ingredients.map((ing, index) => ({
            recipe_id: id,
            food_item_id: ing.food_item_id,
            amount: ing.amount,
            unit: ing.unit,
            weight_grams: ing.weight_grams,
            ingredient_order: index,
          }))

          const { error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredients)

          if (ingredientsError) throw ingredientsError
        }
      }

      return recipe as Recipe
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

/**
 * Delete a recipe
 * Also deletes the corresponding food_item if it exists
 */
export function useDeleteRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated')

      // Get the food_item_id before deleting
      const { data: recipe } = await supabase
        .from('recipes')
        .select('food_item_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      // Delete the recipe (cascade will delete ingredients)
      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', user.id)

      if (error) throw error

      // Delete the corresponding food_item if it exists
      if (recipe?.food_item_id) {
        await supabase.from('food_items').delete().eq('id', recipe.food_item_id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}
