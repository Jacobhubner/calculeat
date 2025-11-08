/**
 * Custom hook för att uppdatera användarprofil med React Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { UserProfileFormData } from '@/lib/types'
import { toast } from 'sonner'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<UserProfileFormData>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Ingen användare inloggad')
      }

      const { data: updated, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return updated
    },
    onSuccess: () => {
      // Invalidera profil-queries så de hämtas på nytt
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile })
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
