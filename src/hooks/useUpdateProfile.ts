/**
 * Custom hook för att uppdatera en profil med React Query
 * Uppdaterad för att arbeta med profiles-tabellen
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { ProfileFormData, Profile } from '@/lib/types'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'

interface UpdateProfileParams {
  profileId: string
  data: Partial<ProfileFormData>
  silent?: boolean // Om true, visa inte toast-meddelande
}

// E2: Fält som existerar i user_profiles och ska dual-writeas.
// Fält som bara finns i profiles (initial_weight_kg, accumulated_at, baseline_bmr, is_active)
// filtreras bort här och skrivs aldrig till user_profiles.
const USER_PROFILE_FIELDS = new Set([
  'birth_date',
  'gender',
  'height_cm',
  'weight_kg',
  'tdee',
  'bmr',
  'bmr_formula',
  'pal_system',
  'activity_level',
  'intensity_level',
  'training_frequency_per_week',
  'training_duration_minutes',
  'daily_steps',
  'custom_pal',
  'training_activity_id',
  'training_days_per_week',
  'training_minutes_per_session',
  'walking_activity_id',
  'steps_per_day',
  'hours_standing_per_day',
  'household_activity_id',
  'household_hours_per_day',
  'spa_factor',
  'calorie_goal',
  'deficit_level',
  'calories_min',
  'calories_max',
  'fat_min_percent',
  'fat_max_percent',
  'carb_min_percent',
  'carb_max_percent',
  'protein_min_percent',
  'protein_max_percent',
  'meals_config',
  'body_fat_percentage',
  'body_composition_method',
  'tdee_source',
  'tdee_calculated_at',
  'tdee_calculation_snapshot',
  'target_weight_kg',
])

function pickUserProfileFields(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([key]) => USER_PROFILE_FIELDS.has(key)))
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const updateProfileInStore = useProfileStore(state => state.updateProfile)

  return useMutation({
    mutationFn: async ({ profileId, data }: UpdateProfileParams) => {
      // Strip undefined values — they should not overwrite existing DB values.
      // Callers must pass null explicitly if they intend to clear a field.
      const sanitizedData = Object.entries(data).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) acc[key] = value
          return acc
        },
        {} as Record<string, unknown>
      )

      // profiles write — hard fail (canonical source-of-truth under Fas 2)
      const { data: updated, error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', profileId)
        .select()

      if (error) {
        throw error
      }

      if (!updated || updated.length === 0) {
        throw new Error('No profile was updated')
      }

      // E2: user_profiles dual-write — soft fail.
      // profiles är fortfarande canonical read-source; ett misslyckat user_profiles-write
      // syns i E1 parity-warnings vid nästa session men bryter inte UI.
      const upFields = pickUserProfileFields(sanitizedData)
      if (Object.keys(upFields).length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { error: upError } = await supabase
            .from('user_profiles')
            .update(upFields)
            .eq('id', user.id)
          if (upError) {
            console.warn('[E2 dual-write] user_profiles update failed:', upError.message)
          }
        }
      }

      return updated[0] as Profile
    },
    onSuccess: async (updated, { profileId, silent }) => {
      // Update store
      updateProfileInStore(profileId, updated)

      // Invalidate queries to mark them as stale
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      queryClient.invalidateQueries({ queryKey: queryKeys.profileById(profileId) })

      // Wait for queries to actually refetch and update
      await queryClient.refetchQueries({
        queryKey: queryKeys.profiles,
        type: 'active',
      })

      // Only show toast if not silent
      if (!silent) {
        toast.success('Profil uppdaterad', {
          description: 'Dina ändringar har sparats',
        })
      }
    },
    onError: (error: Error) => {
      toast.error('Kunde inte uppdatera profil', {
        description: error.message,
      })
    },
  })
}
