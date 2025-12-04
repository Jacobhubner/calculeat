/**
 * Custom hook för att byta aktiv profil
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'

export function useSwitchProfile() {
  const queryClient = useQueryClient()
  const setActiveProfile = useProfileStore(state => state.setActiveProfile)
  const updateProfile = useProfileStore(state => state.updateProfile)

  return useMutation({
    mutationFn: async (profileId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      // First, deactivate all profiles for this user
      await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', profileId)

      // Then activate the selected profile
      const { data: activeProfile, error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return activeProfile as Profile
    },
    onSuccess: async profile => {
      // Update store
      setActiveProfile(profile)
      updateProfile(profile.id, { is_active: true })

      // Invalidate and refetch profiles - await to ensure Dashboard gets new data
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })

      toast.success('Profil bytt!', {
        description: `Du använder nu ${profile.profile_name}`,
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte byta profil', {
        description: error.message,
      })
    },
  })
}
