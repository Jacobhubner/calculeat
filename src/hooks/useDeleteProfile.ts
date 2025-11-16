/**
 * Custom hook för att radera en profil
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  const removeProfile = useProfileStore(state => state.removeProfile)
  const profiles = useProfileStore(state => state.profiles)

  return useMutation({
    mutationFn: async (profileId: string) => {
      // Prevent deleting the last profile
      if (profiles.length <= 1) {
        throw new Error('Du kan inte radera din sista profil')
      }

      const { error } = await supabase.from('profiles').delete().eq('id', profileId)

      if (error) {
        throw error
      }

      return profileId
    },
    onSuccess: profileId => {
      // Remove from store (will auto-switch to another profile)
      removeProfile(profileId)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })

      toast.success('Profil raderad', {
        description: 'Profilen har tagits bort',
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte radera profil', {
        description: error.message,
      })
    },
  })
}
