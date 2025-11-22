/**
 * Macro Modes Hook
 * Apply predefined macro modes (NNR, Off-season, On-season) to user profile
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { applyMacroMode, type MacroMode } from '@/lib/utils/macroModes'
import { useProfileStore } from '@/stores/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'

export interface ApplyMacroModeInput {
  mode: 'nnr' | 'offseason' | 'onseason'
}

/**
 * Apply a macro mode to the current user's profile
 */
export function useApplyMacroMode() {
  const queryClient = useQueryClient()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()

  // Use active profile from store if available, otherwise fall back to legacy profile
  const profile = activeProfile || legacyProfile

  return useMutation({
    mutationFn: async (input: ApplyMacroModeInput) => {
      if (!profile) {
        throw new Error('User profile not found')
      }

      // Validate required data
      if (!profile.weight_kg) {
        throw new Error('Weight is required to apply macro mode')
      }

      if (!profile.calories_min || !profile.calories_max) {
        throw new Error('Calorie range is required to apply macro mode')
      }

      if (input.mode === 'onseason' && !profile.body_fat_percentage) {
        throw new Error('Body fat percentage is required for on-season mode to calculate FFM')
      }

      // Calculate FFM (Fat Free Mass) if body fat percentage is available
      const ffm =
        profile.body_fat_percentage && profile.weight_kg
          ? calculateLeanMass(profile.weight_kg, profile.body_fat_percentage)
          : undefined

      // Calculate macro mode
      const macroMode = applyMacroMode(input.mode, {
        weight: profile.weight_kg,
        fatFreeMass: ffm,
        caloriesMin: profile.calories_min,
        caloriesMax: profile.calories_max,
      })

      const macroData = {
        calorie_goal: macroMode.calorieGoal,
        deficit_level: macroMode.deficitLevel || null,
        fat_min_percent: macroMode.fatMinPercent,
        fat_max_percent: macroMode.fatMaxPercent,
        carb_min_percent: macroMode.carbMinPercent,
        carb_max_percent: macroMode.carbMaxPercent,
        protein_min_percent: macroMode.proteinMinPercent,
        protein_max_percent: macroMode.proteinMaxPercent,
        updated_at: new Date().toISOString(),
      }

      // Update active profile if using multi-profile system, otherwise update user_profiles
      if (activeProfile?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .update(macroData)
          .eq('id', activeProfile.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Legacy: update user_profiles for backward compatibility
        const { data, error } = await supabase
          .from('user_profiles')
          .update(macroData)
          .eq('id', profile.id)
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

/**
 * Preview macro mode without applying
 */
export function usePreviewMacroMode(mode: 'nnr' | 'offseason' | 'onseason'): MacroMode | null {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()

  // Use active profile from store if available, otherwise fall back to legacy profile
  const profile = activeProfile || legacyProfile

  if (!profile?.weight_kg || !profile?.calories_min || !profile?.calories_max) {
    return null
  }

  if (mode === 'onseason' && !profile.body_fat_percentage) {
    return null
  }

  try {
    // Calculate FFM (Fat Free Mass) if body fat percentage is available
    const ffm =
      profile.body_fat_percentage && profile.weight_kg
        ? calculateLeanMass(profile.weight_kg, profile.body_fat_percentage)
        : undefined

    return applyMacroMode(mode, {
      weight: profile.weight_kg,
      fatFreeMass: ffm,
      caloriesMin: profile.calories_min,
      caloriesMax: profile.calories_max,
    })
  } catch {
    return null
  }
}
