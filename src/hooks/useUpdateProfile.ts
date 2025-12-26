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

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const updateProfileInStore = useProfileStore(state => state.updateProfile)

  return useMutation({
    mutationFn: async ({ profileId, data }: UpdateProfileParams) => {
      // Convert undefined values to null for Supabase (undefined is ignored by Supabase)
      const sanitizedData = Object.entries(data).reduce(
        (acc, [key, value]) => {
          acc[key] = value === undefined ? null : value
          return acc
        },
        {} as Record<string, unknown>,
      )

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
