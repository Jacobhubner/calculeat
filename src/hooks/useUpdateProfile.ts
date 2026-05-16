/**
 * Custom hook för att uppdatera en profil med React Query
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
      // Strip undefined values — they should not overwrite existing DB values.
      // Callers must pass null explicitly if they intend to clear a field.
      const sanitizedData = Object.entries(data).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) acc[key] = value
          return acc
        },
        {} as Record<string, unknown>
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Write to user_profiles — canonical source (Fas 3)
      const { error: upError } = await supabase
        .from('user_profiles')
        .update(sanitizedData)
        .eq('id', user.id)

      if (upError) throw upError

      // Fetch updated row and shape-map to Profile for store/consumers
      const { data: upData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      return {
        ...upData,
        id: profileId,
        user_id: user.id,
      } as Profile
    },
    onSuccess: async (updated, { profileId, silent }) => {
      // Update store
      updateProfileInStore(profileId, updated)

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })

      await queryClient.refetchQueries({
        queryKey: queryKeys.profiles,
        type: 'active',
      })

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
