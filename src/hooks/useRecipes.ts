import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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
  instructions?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  notes?: string
  created_at: string
  updated_at: string
  ingredients?: RecipeIngredient[]
}

export interface CreateRecipeInput {
  name: string
  servings: number
  instructions?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  notes?: string
  ingredients: Array<{
    food_item_id: string
    amount: number
    unit: string
    weight_grams?: number
  }>
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
 */
export function useCreateRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      if (!user) throw new Error('User not authenticated')

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: input.name,
          servings: input.servings,
          instructions: input.instructions,
          prep_time_minutes: input.prep_time_minutes,
          cook_time_minutes: input.cook_time_minutes,
          notes: input.notes,
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
    },
  })
}

/**
 * Update a recipe
 */
export function useUpdateRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateRecipeInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated')

      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: input.name,
          servings: input.servings,
          instructions: input.instructions,
          prep_time_minutes: input.prep_time_minutes,
          cook_time_minutes: input.cook_time_minutes,
          notes: input.notes,
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
    },
  })
}

/**
 * Delete a recipe
 */
export function useDeleteRecipe() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
