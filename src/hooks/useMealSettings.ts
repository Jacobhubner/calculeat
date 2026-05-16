import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'

export interface MealSetting {
  id: string
  profile_id: string
  user_id: string
  meal_name: string
  meal_order: number
  percentage_of_daily_calories: number
  created_at: string
  updated_at: string
}

export interface CreateMealSettingInput {
  meal_name: string
  meal_order: number
  percentage_of_daily_calories: number
}

/**
 * Get user's meal settings
 */
export function useMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile

  return useQuery({
    queryKey: ['mealSettings', user?.id],
    queryFn: async () => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('user_meal_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('meal_order')

      if (error) throw error
      return data as MealSetting[]
    },
    enabled: !!profile && !!user,
  })
}

/**
 * Create default meal settings (if user has none)
 * Will use meals_config from profile if available, otherwise use hardcoded defaults
 */
export function useCreateDefaultMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      // Check if profile has meals_config - if so, use those instead of defaults
      const mealsConfig = profile.meals_config as {
        meals?: Array<{ name: string; percentage: number }>
      } | null

      let mealsToInsert: Array<{
        user_id: string
        meal_name: string
        meal_order: number
        percentage_of_daily_calories: number
      }>

      if (mealsConfig?.meals && mealsConfig.meals.length > 0) {
        // Use meals from profile's meals_config
        mealsToInsert = mealsConfig.meals.map((meal, index) => ({
          user_id: user.id,
          meal_name: meal.name,
          meal_order: index,
          percentage_of_daily_calories: meal.percentage,
        }))
      } else {
        // Default 4 meals
        const defaultMeals = [
          { meal_name: 'Frukost', meal_order: 0, percentage_of_daily_calories: 25 },
          { meal_name: 'Lunch', meal_order: 1, percentage_of_daily_calories: 30 },
          { meal_name: 'Mellanmål', meal_order: 2, percentage_of_daily_calories: 15 },
          { meal_name: 'Middag', meal_order: 3, percentage_of_daily_calories: 30 },
        ]

        mealsToInsert = defaultMeals.map(meal => ({
          ...meal,
          user_id: user.id,
        }))
      }

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert(mealsToInsert)
        .select()

      if (error) throw error
      return data as MealSetting[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
    },
  })
}

/**
 * Create a custom meal setting
 */
export function useCreateMealSetting() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMealSettingInput) => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      // Validate total percentage doesn't exceed 100%
      const { data: existing } = await supabase
        .from('user_meal_settings')
        .select('percentage_of_daily_calories')
        .eq('user_id', user.id)

      const currentTotal =
        existing?.reduce((sum, m) => sum + m.percentage_of_daily_calories, 0) || 0

      if (currentTotal + input.percentage_of_daily_calories > 100) {
        throw new Error(`Total meal percentages cannot exceed 100%. Current: ${currentTotal}%`)
      }

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single()

      if (error) throw error
      return data as MealSetting
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
    },
  })
}

/**
 * Update a meal setting
 */
export function useUpdateMealSetting() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateMealSettingInput> & { id: string }) => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      // Validate total percentage if changing percentage
      if (input.percentage_of_daily_calories !== undefined) {
        const { data: existing } = await supabase
          .from('user_meal_settings')
          .select('percentage_of_daily_calories')
          .eq('user_id', user.id)
          .neq('id', id)

        const otherTotal =
          existing?.reduce((sum, m) => sum + m.percentage_of_daily_calories, 0) || 0

        if (otherTotal + input.percentage_of_daily_calories > 100) {
          throw new Error(`Total meal percentages cannot exceed 100%. Other meals: ${otherTotal}%`)
        }
      }

      const { data, error } = await supabase
        .from('user_meal_settings')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as MealSetting
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
    },
  })
}

/**
 * Delete a meal setting
 */
export function useDeleteMealSetting() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      // Ensure at least 1 meal remains
      const { count } = await supabase
        .from('user_meal_settings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (count && count <= 1) {
        throw new Error('Du måste ha minst en måltid konfigurerad')
      }

      const { error } = await supabase
        .from('user_meal_settings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
    },
  })
}

/**
 * Reorder meal settings
 */
export function useReorderMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (meals: Array<{ id: string; meal_order: number }>) => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      // Update each meal's order
      const updates = meals.map(meal =>
        supabase
          .from('user_meal_settings')
          .update({ meal_order: meal.meal_order })
          .eq('id', meal.id)
          .eq('user_id', user.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
    },
  })
}

/**
 * Sync meal settings from profile.meals_config to user_meal_settings table
 * This ensures TodayPage (which reads from user_meal_settings) stays in sync
 * with the meal configuration saved in the profile.
 */
export function useSyncMealSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ meals }: { meals: Array<{ name: string; percentage: number }> }) => {
      if (!meals || meals.length === 0) throw new Error('Meals required')
      if (!user) throw new Error('User not authenticated')

      // Delete all existing meal settings for this user
      await supabase.from('user_meal_settings').delete().eq('user_id', user.id)

      // Insert new meals
      const mealsToInsert = meals.map((meal, index) => ({
        user_id: user.id,
        meal_name: meal.name,
        meal_order: index,
        percentage_of_daily_calories: meal.percentage,
      }))

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert(mealsToInsert)
        .select()

      if (error) throw error

      // Propagate name changes to existing meal_entries
      // This ensures historical data stays in sync with renamed meals
      const { data: profileLogs } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)

      const logIds = profileLogs?.map(l => l.id) ?? []

      if (logIds.length > 0) {
        for (const meal of mealsToInsert) {
          await supabase
            .from('meal_entries')
            .update({ meal_name: meal.meal_name })
            .in('daily_log_id', logIds)
            .eq('meal_order', meal.meal_order)
            .neq('meal_name', meal.meal_name)
        }
      }

      return data as MealSetting[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
    },
  })
}

/**
 * Reset to default meal settings (deletes all and creates defaults)
 */
export function useResetMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile, user } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found')
      if (!user) throw new Error('User not authenticated')

      // Delete all existing
      await supabase.from('user_meal_settings').delete().eq('user_id', user.id)

      // Create defaults
      const defaultMeals = [
        { meal_name: 'Frukost', meal_order: 0, percentage_of_daily_calories: 25 },
        { meal_name: 'Lunch', meal_order: 1, percentage_of_daily_calories: 30 },
        { meal_name: 'Mellanmål', meal_order: 2, percentage_of_daily_calories: 15 },
        { meal_name: 'Middag', meal_order: 3, percentage_of_daily_calories: 30 },
      ]

      const mealsWithIds = defaultMeals.map(meal => ({
        ...meal,
        user_id: user.id,
      }))

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert(mealsWithIds)
        .select()

      if (error) throw error
      return data as MealSetting[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings', user?.id] })
    },
  })
}
