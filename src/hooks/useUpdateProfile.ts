/**
 * Custom hook för att uppdatera en profil med React Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/react-query'
import type { ProfileFormData, Profile } from '@/lib/types'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import { PreviewBlockedError } from '@/hooks/usePreviewMutation'

interface UpdateProfileParams {
  profileId: string
  data: Partial<ProfileFormData>
  silent?: boolean // Om true, visa inte toast-meddelande
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const updateProfileInStore = useProfileStore(state => state.updateProfile)
  const { refreshProfile } = useAuth()

  return useMutation({
    mutationFn: async ({ profileId, data }: UpdateProfileParams) => {
      // Preview-läget: sparning TILLÅTS. create_preview_profile har redan
      // säkerhetskopierat den riktiga user_profiles-raden till JSONB och
      // nollställt den, så skrivningar hamnar på preview-versionen. Vid
      // exit_preview_profile skrivs raden tillbaka från backupen — så inget
      // preview-värde överlever. En äkta sandlåda: fyll i profil som en ny
      // användare, allt raderas vid avslut.

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

      // Håll AuthContext i synk — ProfileCompletionGuard läser
      // isProfileComplete därifrån och studsar annars användaren
      // tillbaka till profilen trots att datat är sparat
      await refreshProfile()

      if (!silent) {
        toast.success('Profil uppdaterad', {
          description: 'Dina ändringar har sparats',
        })
      }
    },
    onError: (error: Error) => {
      if (error instanceof PreviewBlockedError) return
      toast.error('Kunde inte uppdatera profil', {
        description: error.message,
      })
    },
  })
}
