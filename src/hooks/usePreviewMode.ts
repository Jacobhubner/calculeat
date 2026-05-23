import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'
import { queryClient } from '@/lib/react-query'

export const PREVIEW_KEY = 'calculeat-preview-active'

function setPreviewFlag(value: boolean) {
  if (value) {
    localStorage.setItem(PREVIEW_KEY, 'true')
  } else {
    localStorage.removeItem(PREVIEW_KEY)
  }
  window.dispatchEvent(new Event('preview-mode-change'))
}

function clearPreviewOnboardingKeys(userId: string | undefined) {
  if (userId) localStorage.removeItem(`calculeat_preview_onboarding_completed_${userId}`)
  localStorage.removeItem('calculeat_preview_onboarding_step')
  localStorage.removeItem('calculeat_preview_onboarding_started')
}

export function usePreviewMode() {
  const { user, refreshProfile, isPreviewMode } = useAuth()
  const clearProfiles = useProfileStore(state => state.clearProfiles)
  const navigate = useNavigate()

  // localStorage as secondary signal for fast initial render (avoids flash).
  // AuthContext.isPreviewMode is the authoritative source — always DB-synced.
  const [localFlag, setLocalFlag] = useState(() => localStorage.getItem(PREVIEW_KEY) === 'true')

  useEffect(() => {
    const sync = () => setLocalFlag(localStorage.getItem(PREVIEW_KEY) === 'true')
    window.addEventListener('preview-mode-change', sync)
    return () => window.removeEventListener('preview-mode-change', sync)
  }, [])

  // Use AuthContext as primary source; fall back to localFlag before first refresh
  const isPreviewActive = isPreviewMode || localFlag

  const enterPreview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_preview_profile')
      if (error) throw error
    },
    onSuccess: async () => {
      setPreviewFlag(true)
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
      setPreviewFlag(false)
      clearPreviewOnboardingKeys(user?.id)
      clearProfiles()
      queryClient.clear()
      await refreshProfile()
      navigate('/app')
    },
    onError: error => {
      console.error('[exitPreview] RPC failed:', error)
      toast.error('Kunde inte avsluta preview-läget', {
        description:
          'Databasanropet misslyckades. Du kan försöka igen eller tvinga fram en lokal utloggning.',
        duration: Infinity,
        action: {
          label: 'Tvinga avslut',
          onClick: () => {
            setPreviewFlag(false)
            clearPreviewOnboardingKeys(user?.id)
            clearProfiles()
            queryClient.clear()
            refreshProfile().then(() => navigate('/app'))
          },
        },
      })
    },
  })

  return { isPreviewActive, enterPreview, exitPreview }
}
