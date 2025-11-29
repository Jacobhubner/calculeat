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
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const updateProfileInStore = useProfileStore(state => state.updateProfile)

  return useMutation({
    mutationFn: async ({ profileId, data }: UpdateProfileParams) => {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return updated as Profile
    },
    onSuccess: async (updated, { profileId }) => {
      console.log('[useUpdateProfile] onSuccess called, updated profile:', updated)
      // Update store
      updateProfileInStore(profileId, updated)
      console.log('[useUpdateProfile] Zustand store updated')

      // Invalidate queries to mark them as stale
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      queryClient.invalidateQueries({ queryKey: queryKeys.profileById(profileId) })

      // Wait for queries to actually refetch and update
      await queryClient.refetchQueries({
        queryKey: queryKeys.profiles,
        type: 'active',
      })

      toast.success('Profil uppdaterad', {
        description: 'Dina ändringar har sparats',
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte uppdatera profil', {
        description: error.message,
      })
    },
  })
}
