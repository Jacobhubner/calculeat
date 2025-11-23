/**
 * Custom hook för att skapa en ny profil
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { ProfileFormData, Profile } from '@/lib/types'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'

export function useCreateProfile() {
  const queryClient = useQueryClient()
  const addProfile = useProfileStore(state => state.addProfile)
  const setActiveProfile = useProfileStore(state => state.setActiveProfile)

  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      // Create new profile
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          ...data,
          is_active: true, // New profile becomes active
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return newProfile as Profile
    },
    onSuccess: async profile => {
      // Invalidate and wait for queries to refetch
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })

      // Then set as active profile
      addProfile(profile)
      setActiveProfile(profile)

      toast.success('Profil skapad!', {
        description: `${profile.profile_name} är nu din aktiva profil`,
      })
    },
    onError: (error: Error) => {
      toast.error('Kunde inte skapa profil', {
        description: error.message,
      })
    },
  })
}
