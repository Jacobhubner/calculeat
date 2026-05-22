import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'
import { queryClient } from '@/lib/react-query'

const PREVIEW_KEY = 'calculeat-preview-active'
const ONBOARDING_KEY = 'calculeat_onboarding_completed'

export function usePreviewMode() {
  const { user, refreshProfile } = useAuth()
  const clearProfiles = useProfileStore(state => state.clearProfiles)
  const navigate = useNavigate()

  const isPreviewActive = localStorage.getItem(PREVIEW_KEY) === 'true'

  const enterPreview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_preview_profile')
      if (error) throw error
    },
    onSuccess: async () => {
      localStorage.setItem(PREVIEW_KEY, 'true')
      // Rensa onboarding-flaggan så wizarden visas
      if (user) localStorage.removeItem(`${ONBOARDING_KEY}_${user.id}`)
      // Rensa cacher och ladda om profil
      clearProfiles()
      queryClient.clear()
      await refreshProfile()
      navigate('/app')
    },
  })

  const exitPreview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('exit_preview_profile')
      if (error) throw error
    },
    onSuccess: async () => {
      localStorage.removeItem(PREVIEW_KEY)
      clearProfiles()
      queryClient.clear()
      await refreshProfile()
      navigate('/app')
    },
  })

  return { isPreviewActive, enterPreview, exitPreview }
}
