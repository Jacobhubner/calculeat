import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'

export interface MealEntryItem {
  id: string
  meal_entry_id: string
  food_item_id: string
  amount: number
  unit: string
  weight_grams?: number
  calories?: number
  fat_g?: number
  carb_g?: number
  protein_g?: number
  item_order: number
  created_at: string
  food_item?: unknown // Will include food item details
}

export interface MealEntry {
  id: string
  daily_log_id: string
  user_id: string
  meal_name: string
  meal_order: number
  meal_calories: number
  meal_fat_g: number
  meal_carb_g: number
  meal_protein_g: number
  created_at: string
  updated_at: string
  items?: MealEntryItem[]
}

export interface DailyLog {
  id: string
  user_id: string
  profile_id: string
  log_date: string
  is_completed: boolean

  // Daily totals
  total_calories: number
  total_fat_g: number
  total_carb_g: number
  total_protein_g: number
  kcal_per_gram?: number

  // Noom tracking
  green_calories: number
  yellow_calories: number
  orange_calories: number

  // Goals (snapshot from profile)
  goal_calories_min?: number
  goal_calories_max?: number
  goal_fat_min_g?: number
  goal_fat_max_g?: number
  goal_carb_min_g?: number
  goal_carb_max_g?: number
  goal_protein_min_g?: number
  goal_protein_max_g?: number

  created_at: string
  updated_at: string
  meals?: MealEntry[]
}

/**
 * Get today's daily log for the active profile
 */
export function useTodayLog() {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['dailyLogs', 'today', user?.id, activeProfile?.id, today],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      const { data, error } = await supabase
        .from('daily_logs')
        .select(
          `
          *,
          meals:meal_entries(
            *,
            items:meal_entry_items(
              *,
              food_item:food_items(*)
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('profile_id', activeProfile.id)
        .eq('log_date', today)
        .order('meal_order', { foreignTable: 'meal_entries' })
        .order('item_order', { foreignTable: 'meal_entries.meal_entry_items' })
        .maybeSingle()

      if (error) throw error
      return data as DailyLog | null
    },
    enabled: !!user && !!activeProfile,
  })
}

/**
 * Get daily log by date for the active profile
 */
export function useDailyLog(date: string) {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)

  return useQuery({
    queryKey: ['dailyLogs', user?.id, activeProfile?.id, date],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      const { data, error } = await supabase
        .from('daily_logs')
        .select(
          `
          *,
          meals:meal_entries(
            *,
            items:meal_entry_items(
              *,
              food_item:food_items(*)
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('profile_id', activeProfile.id)
        .eq('log_date', date)
        .order('meal_order', { foreignTable: 'meal_entries' })
        .order('item_order', { foreignTable: 'meal_entries.meal_entry_items' })
        .maybeSingle()

      if (error) throw error
      return data as DailyLog | null
    },
    enabled: !!user && !!activeProfile && !!date,
  })
}

/**
 * Get daily logs for a date range for the active profile
 */
export function useDailyLogs(startDate: string, endDate: string) {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)

  return useQuery({
    queryKey: ['dailyLogs', 'range', user?.id, activeProfile?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      const { data, error } = await supabase
        .from('daily_logs')
        .select(
          `
          *,
          meals:meal_entries(
            *,
            items:meal_entry_items(
              *,
              food_item:food_items(*)
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('profile_id', activeProfile.id)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false })
        .order('meal_order', { foreignTable: 'meal_entries' })

      if (error) throw error
      return data as DailyLog[]
    },
    enabled: !!user && !!activeProfile && !!startDate && !!endDate,
  })
}

/**
 * Create or get today's log for active profile (ensures log exists)
 */
export function useEnsureTodayLog() {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      const today = new Date().toISOString().split('T')[0]

      // Check if log exists for this profile and date
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', activeProfile.id)
        .eq('log_date', today)
        .maybeSingle()

      if (existing) return existing as DailyLog

      // Calculate macro goals in grams from profile percentages
      const avgCalories =
        ((activeProfile.calories_min || 0) + (activeProfile.calories_max || 0)) / 2
      const fatMinG = (avgCalories * (activeProfile.fat_min_percent || 20)) / 100 / 9
      const fatMaxG = (avgCalories * (activeProfile.fat_max_percent || 35)) / 100 / 9
      const carbMinG = (avgCalories * (activeProfile.carb_min_percent || 45)) / 100 / 4
      const carbMaxG = (avgCalories * (activeProfile.carb_max_percent || 55)) / 100 / 4
      const proteinMinG = (avgCalories * (activeProfile.protein_min_percent || 15)) / 100 / 4
      const proteinMaxG = (avgCalories * (activeProfile.protein_max_percent || 25)) / 100 / 4

      // Create new log with all goals from active profile
      const { data: newLog, error } = await supabase
        .from('daily_logs')
        .insert({
          user_id: user.id,
          profile_id: activeProfile.id,
          log_date: today,
          goal_calories_min: activeProfile.calories_min,
          goal_calories_max: activeProfile.calories_max,
          goal_fat_min_g: Math.round(fatMinG),
          goal_fat_max_g: Math.round(fatMaxG),
          goal_carb_min_g: Math.round(carbMinG),
          goal_carb_max_g: Math.round(carbMaxG),
          goal_protein_min_g: Math.round(proteinMinG),
          goal_protein_max_g: Math.round(proteinMaxG),
        })
        .select()
        .single()

      if (error) throw error
      return newLog as DailyLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
    },
  })
}

/**
 * Add food item to a meal
 */
export function useAddFoodToMeal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      mealEntryId: string
      foodItemId: string
      amount: number
      unit: string
      weightGrams?: number
      // Pre-calculated nutrition values (optional - will be calculated by trigger if not provided)
      calories?: number
      protein_g?: number
      carb_g?: number
      fat_g?: number
    }) => {
      if (!user) throw new Error('User not authenticated')

      // Get current item count for ordering
      const { count } = await supabase
        .from('meal_entry_items')
        .select('*', { count: 'exact', head: true })
        .eq('meal_entry_id', params.mealEntryId)

      const { data, error } = await supabase
        .from('meal_entry_items')
        .insert({
          meal_entry_id: params.mealEntryId,
          food_item_id: params.foodItemId,
          amount: params.amount,
          unit: params.unit,
          weight_grams: params.weightGrams,
          calories: params.calories,
          protein_g: params.protein_g,
          carb_g: params.carb_g,
          fat_g: params.fat_g,
          item_order: count || 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Small delay to allow database triggers to complete before refetching
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['dailyLogs'] })
      }, 100)
    },
  })
}

/**
 * Remove food item from meal
 */
export function useRemoveFoodFromMeal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase.from('meal_entry_items').delete().eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      // Small delay to allow database triggers to complete before refetching
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['dailyLogs'] })
      }, 100)
    },
  })
}

/**
 * Update food item amount in meal
 */
export function useUpdateMealItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      itemId: string
      amount: number
      unit?: string
      weightGrams?: number
    }) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('meal_entry_items')
        .update({
          amount: params.amount,
          unit: params.unit,
          weight_grams: params.weightGrams,
        })
        .eq('id', params.itemId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Small delay to allow database triggers to complete before refetching
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['dailyLogs'] })
      }, 100)
    },
  })
}

/**
 * Create a new meal entry for today
 */
export function useCreateMealEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { dailyLogId: string; mealName: string; mealOrder: number }) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('meal_entries')
        .insert({
          daily_log_id: params.dailyLogId,
          user_id: user.id,
          meal_name: params.mealName,
          meal_order: params.mealOrder,
          meal_calories: 0,
          meal_fat_g: 0,
          meal_carb_g: 0,
          meal_protein_g: 0,
        })
        .select()
        .single()

      if (error) throw error
      return data as MealEntry
    },
    onSuccess: () => {
      // Small delay to allow database triggers to complete before refetching
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['dailyLogs'] })
      }, 100)
    },
  })
}

/**
 * Delete a meal entry
 */
export function useDeleteMealEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mealEntryId: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('meal_entries')
        .delete()
        .eq('id', mealEntryId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      // Small delay to allow database triggers to complete before refetching
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['dailyLogs'] })
      }, 100)
    },
  })
}

/**
 * Mark today's log as completed
 */
export function useFinishDay() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dailyLogId: string) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('daily_logs')
        .update({ is_completed: true })
        .eq('id', dailyLogId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as DailyLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
    },
  })
}

/**
 * Copy a previous day's meals to today for the active profile
 */
export function useCopyDayToToday() {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sourceDailyLogId: string) => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      // Get source log with all meals and items
      const { data: sourceLog, error: fetchError } = await supabase
        .from('daily_logs')
        .select(
          `
          *,
          meals:meal_entries(
            *,
            items:meal_entry_items(*)
          )
        `
        )
        .eq('id', sourceDailyLogId)
        .single()

      if (fetchError) throw fetchError

      // Ensure today's log exists for active profile
      const today = new Date().toISOString().split('T')[0]
      const { data: todayLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', activeProfile.id)
        .eq('log_date', today)
        .maybeSingle()

      let targetLogId: string

      if (todayLog) {
        targetLogId = todayLog.id
      } else {
        const { data: newLog, error: createError } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            profile_id: activeProfile.id,
            log_date: today,
          })
          .select()
          .single()

        if (createError) throw createError
        targetLogId = newLog.id
      }

      // Copy each meal
      for (const meal of sourceLog.meals || []) {
        const { data: newMeal, error: mealError } = await supabase
          .from('meal_entries')
          .insert({
            daily_log_id: targetLogId,
            user_id: user.id,
            meal_name: meal.meal_name,
            meal_order: meal.meal_order,
            meal_calories: 0,
            meal_fat_g: 0,
            meal_carb_g: 0,
            meal_protein_g: 0,
          })
          .select()
          .single()

        if (mealError) throw mealError

        // Copy items
        if (meal.items && meal.items.length > 0) {
          const items = meal.items.map((item: MealEntryItem) => ({
            meal_entry_id: newMeal.id,
            food_item_id: item.food_item_id,
            amount: item.amount,
            unit: item.unit,
            weight_grams: item.weight_grams,
            item_order: item.item_order,
          }))

          const { error: itemsError } = await supabase.from('meal_entry_items').insert(items)

          if (itemsError) throw itemsError
        }
      }

      return targetLogId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
    },
  })
}

/**
 * Update the goal snapshot for a daily log
 * Used when user wants to sync daily log goals with their current profile settings
 */
export function useUpdateDailyLogGoals() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      dailyLogId: string
      goals: {
        goal_calories_min?: number
        goal_calories_max?: number
        goal_fat_min_g?: number
        goal_fat_max_g?: number
        goal_carb_min_g?: number
        goal_carb_max_g?: number
        goal_protein_min_g?: number
        goal_protein_max_g?: number
      }
    }) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('daily_logs')
        .update(params.goals)
        .eq('id', params.dailyLogId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as DailyLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
    },
  })
}
