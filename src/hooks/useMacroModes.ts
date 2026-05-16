/**
 * Macro Modes Hook
 * Preview predefined macro modes (NNR, Off-season, On-season)
 */

import { applyMacroMode, type MacroMode } from '@/lib/utils/macroModes'
import { useProfileStore } from '@/stores/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'

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

  if (!profile?.weight_kg || !profile?.tdee) {
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

    // Calculate NEW calories_min/max from TDEE using macro mode multipliers
    const tempMacroMode = applyMacroMode(mode, {
      weight: profile.weight_kg,
      fatFreeMass: ffm,
      caloriesMin: profile.tdee,
      caloriesMax: profile.tdee,
    })

    const newCaloriesMin = profile.tdee * tempMacroMode.calorieMinMultiplier
    const newCaloriesMax = profile.tdee * tempMacroMode.calorieMaxMultiplier

    return applyMacroMode(mode, {
      weight: profile.weight_kg,
      fatFreeMass: ffm,
      caloriesMin: newCaloriesMin,
      caloriesMax: newCaloriesMax,
    })
  } catch {
    return null
  }
}
