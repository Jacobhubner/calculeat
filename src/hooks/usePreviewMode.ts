import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'
import { queryClient } from '@/lib/react-query'

export const PREVIEW_KEY = 'calculeat-preview-active'
const ONBOARDING_KEY = 'calculeat_onboarding_completed'

function setPreviewFlag(value: boolean) {
  if (value) {
    localStorage.setItem(PREVIEW_KEY, 'true')
  } else {
    localStorage.removeItem(PREVIEW_KEY)
  }
  window.dispatchEvent(new Event('preview-mode-change'))
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
      if (user) localStorage.removeItem(`${ONBOARDING_KEY}_${user.id}`)
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
      clearProfiles()
      queryClient.clear()
      await refreshProfile()
      navigate('/app')
    },
  })

  return { isPreviewActive, enterPreview, exitPreview }
}
