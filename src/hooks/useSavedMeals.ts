import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface SavedMealItem {
  id: string
  saved_meal_id: string
  food_item_id: string
  amount: number
  unit: string
  weight_grams?: number
  item_order: number
  created_at: string
}

export interface SavedMeal {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  items?: SavedMealItem[]
}

export interface CreateSavedMealInput {
  name: string
  items: Array<{
    food_item_id: string
    amount: number
    unit: string
    weight_grams?: number
  }>
}

/**
 * Get all saved meals for the current user
 */
export function useSavedMeals() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['savedMeals', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('saved_meals')
        .select(
          `
          *,
          items:saved_meal_items(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      return data as SavedMeal[]
    },
    enabled: !!user,
  })
}

/**
 * Search saved meals
 */
export function useSearchSavedMeals(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['savedMeals', 'search', user?.id, query],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('saved_meals')
        .select(
          `
          *,
          items:saved_meal_items(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .order('name')

      if (error) throw error
      return data as SavedMeal[]
    },
    enabled: !!user && !!query,
  })
}

/**
 * Get a single saved meal by ID
 */
export function useSavedMeal(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['savedMeals', id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('saved_meals')
        .select(
          `
          *,
          items:saved_meal_items(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as SavedMeal
    },
    enabled: !!user && !!id,
  })
}

/**
 * Create a new saved meal
 */
export function useCreateSavedMeal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSavedMealInput) => {
      if (!user) throw new Error('User not authenticated')

      // Create saved meal
      const { data: meal, error: mealError } = await supabase
        .from('saved_meals')
        .insert({
          user_id: user.id,
          name: input.name,
        })
        .select()
        .single()

      if (mealError) throw mealError

      // Add items
      if (input.items.length > 0) {
        const items = input.items.map((item, index) => ({
          saved_meal_id: meal.id,
          food_item_id: item.food_item_id,
          amount: item.amount,
          unit: item.unit,
          weight_grams: item.weight_grams,
          item_order: index,
        }))

        const { error: itemsError } = await supabase.from('saved_meal_items').insert(items)

        if (itemsError) throw itemsError
      }

      return meal as SavedMeal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMeals'] })
    },
  })
}

/**
 * Update a saved meal
 */
export function useUpdateSavedMeal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateSavedMealInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated')

      // Update saved meal
      const { data: meal, error: mealError } = await supabase
        .from('saved_meals')
        .update({
          name: input.name,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (mealError) throw mealError

      // Update items if provided
      if (input.items) {
        // Delete old items
        await supabase.from('saved_meal_items').delete().eq('saved_meal_id', id)

        // Add new items
        if (input.items.length > 0) {
          const items = input.items.map((item, index) => ({
            saved_meal_id: id,
            food_item_id: item.food_item_id,
            amount: item.amount,
            unit: item.unit,
            weight_grams: item.weight_grams,
            item_order: index,
          }))

          const { error: itemsError } = await supabase.from('saved_meal_items').insert(items)

          if (itemsError) throw itemsError
        }
      }

      return meal as SavedMeal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMeals'] })
    },
  })
}

/**
 * Delete a saved meal
 */
export function useDeleteSavedMeal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('saved_meals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMeals'] })
    },
  })
}
