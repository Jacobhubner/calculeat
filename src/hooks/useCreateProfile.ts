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
      // Update Zustand store FIRST (synchronous, immediate update)
      addProfile(profile)
      setActiveProfile(profile)

      // Then invalidate and refetch queries in background
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      await queryClient.refetchQueries({
        queryKey: queryKeys.profiles,
        type: 'active',
      })

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
