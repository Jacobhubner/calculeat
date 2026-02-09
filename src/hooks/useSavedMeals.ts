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

/**
 * Load a saved meal into a specific meal slot in today's log
 * Pattern based on useCopyDayToToday from useDailyLogs.ts
 */
export function useLoadSavedMealToSlot() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      savedMealId: string
      targetMealName: string
      dailyLogId: string
      targetMealEntryId?: string
      mealOrder: number
    }) => {
      if (!user) throw new Error('User not authenticated')

      // 1. Fetch saved meal with items and food_item data
      const { data: savedMeal, error: fetchError } = await supabase
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
        .eq('id', params.savedMealId)
        .single()

      if (fetchError) throw fetchError
      if (!savedMeal.items || savedMeal.items.length === 0) {
        throw new Error('Saved meal has no items')
      }

      // 2. Ensure meal entry exists (create if needed)
      let mealEntryId = params.targetMealEntryId

      if (!mealEntryId) {
        const { data: newMealEntry, error: createError } = await supabase
          .from('meal_entries')
          .insert({
            daily_log_id: params.dailyLogId,
            user_id: user.id,
            meal_name: params.targetMealName,
            meal_order: params.mealOrder,
            meal_calories: 0,
            meal_fat_g: 0,
            meal_carb_g: 0,
            meal_protein_g: 0,
          })
          .select()
          .single()

        if (createError) throw createError
        mealEntryId = newMealEntry.id
      }

      // 3. Get current item count for ordering (append to end)
      const { count } = await supabase
        .from('meal_entry_items')
        .select('*', { count: 'exact', head: true })
        .eq('meal_entry_id', mealEntryId)

      // 4. Filter out missing food items and batch insert valid items
      const validItems = savedMeal.items.filter(item => item.food_item)
      const missingCount = savedMeal.items.length - validItems.length

      if (validItems.length === 0) {
        throw new Error('All food items in saved meal are missing or deleted')
      }

      const itemsToInsert = validItems.map((item, index) => {
        const foodItem = item.food_item
        const grams = item.weight_grams || item.amount * 100
        const multiplier = grams / 100

        return {
          meal_entry_id: mealEntryId,
          food_item_id: item.food_item_id,
          amount: item.amount,
          unit: item.unit,
          weight_grams: item.weight_grams,
          calories: foodItem ? (foodItem.calories || 0) * multiplier : null,
          fat_g: foodItem ? (foodItem.fat_g || 0) * multiplier : null,
          carb_g: foodItem ? (foodItem.carb_g || 0) * multiplier : null,
          protein_g: foodItem ? (foodItem.protein_g || 0) * multiplier : null,
          item_order: (count || 0) + index,
        }
      })

      const { error: insertError } = await supabase
        .from('meal_entry_items')
        .insert(itemsToInsert)

      if (insertError) throw insertError

      // 5. Update last_used_at timestamp
      await supabase
        .from('saved_meals')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', params.savedMealId)

      // 6. Calculate total calories for toast message
      const totalCalories = validItems.reduce((sum, item) => {
        const foodItem = item.food_item
        if (!foodItem) return sum
        // Calculate calories based on amount and unit
        const caloriesPer100g = foodItem.calories || 0
        const grams = item.weight_grams || (item.amount * 100) // Fallback
        return sum + (caloriesPer100g * grams) / 100
      }, 0)

      return {
        insertedCount: validItems.length,
        totalCalories: Math.round(totalCalories),
        missingCount,
        mealName: savedMeal.name,
      }
    },
    onSuccess: () => {
      // Invalidate both dailyLogs and savedMeals queries
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
      queryClient.invalidateQueries({ queryKey: ['savedMeals'] })
    },
  })
}
