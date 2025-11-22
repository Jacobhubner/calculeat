import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'

export interface MealSetting {
  id: string
  profile_id: string
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
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile

  return useQuery({
    queryKey: ['mealSettings', profile?.id],
    queryFn: async () => {
      if (!profile) throw new Error('Profile not found')

      const { data, error } = await supabase
        .from('user_meal_settings')
        .select('*')
        .eq('profile_id', profile.id)
        .order('meal_order')

      if (error) throw error
      return data as MealSetting[]
    },
    enabled: !!profile,
  })
}

/**
 * Create default meal settings (if user has none)
 */
export function useCreateDefaultMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found')

      // Default 3 meals + 2 snacks = 5 meals
      const defaultMeals = [
        { meal_name: 'Frukost', meal_order: 0, percentage_of_daily_calories: 25 },
        { meal_name: 'Lunch', meal_order: 1, percentage_of_daily_calories: 30 },
        { meal_name: 'Middag', meal_order: 2, percentage_of_daily_calories: 30 },
        { meal_name: 'Mellanmål 1', meal_order: 3, percentage_of_daily_calories: 8 },
        { meal_name: 'Mellanmål 2', meal_order: 4, percentage_of_daily_calories: 7 },
      ]

      const mealsWithProfileId = defaultMeals.map(meal => ({
        ...meal,
        profile_id: profile.id,
      }))

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert(mealsWithProfileId)
        .select()

      if (error) throw error
      return data as MealSetting[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings'] })
    },
  })
}

/**
 * Create a custom meal setting
 */
export function useCreateMealSetting() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMealSettingInput) => {
      if (!profile) throw new Error('Profile not found')

      // Validate total percentage doesn't exceed 100%
      const { data: existing } = await supabase
        .from('user_meal_settings')
        .select('percentage_of_daily_calories')
        .eq('profile_id', profile.id)

      const currentTotal =
        existing?.reduce((sum, m) => sum + m.percentage_of_daily_calories, 0) || 0

      if (currentTotal + input.percentage_of_daily_calories > 100) {
        throw new Error(`Total meal percentages cannot exceed 100%. Current: ${currentTotal}%`)
      }

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert({
          profile_id: profile.id,
          ...input,
        })
        .select()
        .single()

      if (error) throw error
      return data as MealSetting
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings'] })
    },
  })
}

/**
 * Update a meal setting
 */
export function useUpdateMealSetting() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateMealSettingInput> & { id: string }) => {
      if (!profile) throw new Error('Profile not found')

      // Validate total percentage if changing percentage
      if (input.percentage_of_daily_calories !== undefined) {
        const { data: existing } = await supabase
          .from('user_meal_settings')
          .select('percentage_of_daily_calories')
          .eq('profile_id', profile.id)
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
        .eq('profile_id', profile.id)
        .select()
        .single()

      if (error) throw error
      return data as MealSetting
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings'] })
    },
  })
}

/**
 * Delete a meal setting
 */
export function useDeleteMealSetting() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile) throw new Error('Profile not found')

      // Ensure at least 1 meal remains
      const { count } = await supabase
        .from('user_meal_settings')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)

      if (count && count <= 1) {
        throw new Error('Du måste ha minst en måltid konfigurerad')
      }

      const { error } = await supabase
        .from('user_meal_settings')
        .delete()
        .eq('id', id)
        .eq('profile_id', profile.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings'] })
    },
  })
}

/**
 * Reorder meal settings
 */
export function useReorderMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (meals: Array<{ id: string; meal_order: number }>) => {
      if (!profile) throw new Error('Profile not found')

      // Update each meal's order
      const updates = meals.map(meal =>
        supabase
          .from('user_meal_settings')
          .update({ meal_order: meal.meal_order })
          .eq('id', meal.id)
          .eq('profile_id', profile.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings'] })
    },
  })
}

/**
 * Reset to default meal settings (deletes all and creates defaults)
 */
export function useResetMealSettings() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const profile = activeProfile || legacyProfile
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found')

      // Delete all existing
      await supabase.from('user_meal_settings').delete().eq('profile_id', profile.id)

      // Create defaults
      const defaultMeals = [
        { meal_name: 'Frukost', meal_order: 0, percentage_of_daily_calories: 25 },
        { meal_name: 'Lunch', meal_order: 1, percentage_of_daily_calories: 30 },
        { meal_name: 'Middag', meal_order: 2, percentage_of_daily_calories: 30 },
        { meal_name: 'Mellanmål 1', meal_order: 3, percentage_of_daily_calories: 8 },
        { meal_name: 'Mellanmål 2', meal_order: 4, percentage_of_daily_calories: 7 },
      ]

      const mealsWithProfileId = defaultMeals.map(meal => ({
        ...meal,
        profile_id: profile.id,
      }))

      const { data, error } = await supabase
        .from('user_meal_settings')
        .insert(mealsWithProfileId)
        .select()

      if (error) throw error
      return data as MealSetting[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealSettings'] })
    },
  })
}
