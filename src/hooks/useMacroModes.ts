/**
 * Macro Modes Hook
 * Apply predefined macro modes (NNR, Off-season, On-season) to user profile
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { applyMacroMode, type MacroMode } from '@/lib/utils/macroModes'
import { useProfileStore } from '@/stores/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'

export interface ApplyMacroModeInput {
  mode: 'nnr' | 'offseason' | 'onseason'
  bodyFatOverride?: number // Optional override from form input
}

/**
 * Apply a macro mode to the current user's profile
 */
export function useApplyMacroMode() {
  const queryClient = useQueryClient()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const { data: allProfiles = [] } = useProfiles()

  // Get full profile data from allProfiles to ensure we have complete data
  const fullProfile = activeProfile ? allProfiles.find(p => p.id === activeProfile.id) : undefined

  // Use full profile if available, otherwise fall back to legacy profile
  const profile = fullProfile || legacyProfile

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

      // Use bodyFatOverride if provided, otherwise use saved value
      const bodyFatPercentage = input.bodyFatOverride ?? profile.body_fat_percentage

      if (input.mode === 'onseason' && !bodyFatPercentage) {
        throw new Error('Body fat percentage is required for on-season mode to calculate FFM')
      }

      // Calculate FFM (Fat Free Mass) if body fat percentage is available
      const ffm =
        bodyFatPercentage && profile.weight_kg
          ? calculateLeanMass(profile.weight_kg, bodyFatPercentage)
          : undefined

      // Calculate macro mode
      const macroMode = applyMacroMode(input.mode, {
        weight: profile.weight_kg,
        fatFreeMass: ffm,
        caloriesMin: profile.calories_min,
        caloriesMax: profile.calories_max,
      })

      // Only update macro-related fields to preserve other unsaved changes in the form
      const macroData = {
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
    onSuccess: updatedData => {
      // Update the store immediately with the new macro values
      const updateProfileInStore = useProfileStore.getState().updateProfile
      if (activeProfile?.id && updatedData) {
        updateProfileInStore(activeProfile.id, updatedData)
      }

      // Invalidate profile queries to refetch full data
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
  const { data: allProfiles = [] } = useProfiles()

  // Get full profile data from allProfiles to ensure we have complete data
  const fullProfile = activeProfile ? allProfiles.find(p => p.id === activeProfile.id) : undefined

  // Use full profile if available, otherwise fall back to legacy profile
  const profile = fullProfile || legacyProfile

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
