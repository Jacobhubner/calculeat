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
    onSuccess: (updated, { profileId }) => {
      // Update store
      updateProfileInStore(profileId, updated)

      // Invalidera profil-queries så de hämtas på nytt
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      queryClient.invalidateQueries({ queryKey: queryKeys.profileById(profileId) })

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
