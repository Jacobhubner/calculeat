import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const ONBOARDING_KEY = 'calculeat_onboarding_completed'
const STEP_KEY = 'calculeat-onboarding-step'
const STARTED_KEY = 'calculeat-onboarding-started'

export function useOnboarding() {
  const { user, isProfileComplete, isPreviewMode } = useAuth()

  // Preview-mode uses separate localStorage keys to prevent cross-contamination
  const completedKey = isPreviewMode
    ? `calculeat_preview_onboarding_completed_${user?.id}`
    : `${ONBOARDING_KEY}_${user?.id}`
  const stepKey = isPreviewMode ? 'calculeat_preview_onboarding_step' : STEP_KEY
  const startedKey = isPreviewMode ? 'calculeat_preview_onboarding_started' : STARTED_KEY

  const hasSeenOnboarding = user ? localStorage.getItem(completedKey ?? '') === 'true' : true

  // In preview, always show onboarding if profile is incomplete — ignore localStorage flag
  const shouldShowOnboarding = user && !isProfileComplete && (isPreviewMode || !hasSeenOnboarding)

  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)

  useEffect(() => {
    setShowOnboarding(shouldShowOnboarding)
  }, [shouldShowOnboarding])

  const completeOnboarding = () => {
    if (!user) return
    localStorage.setItem(completedKey ?? '', 'true')
    localStorage.removeItem(stepKey)
    localStorage.removeItem(startedKey)
    setShowOnboarding(false)
  }

  // Spara vilket steg användaren är på — möjliggör återupptagning vid sidrefresh
  const saveStep = (step: number) => {
    localStorage.setItem(stepKey, String(step))
    if (!localStorage.getItem(startedKey)) {
      localStorage.setItem(startedKey, new Date().toISOString())
    }
  }

  // Returnera sparat steg vid sidrefresh (0 om inget sparat)
  const resumeStep = (): number => {
    const saved = localStorage.getItem(stepKey)
    return saved ? parseInt(saved, 10) : 0
  }

  return {
    showOnboarding,
    hasSeenOnboarding,
    setShowOnboarding,
    completeOnboarding,
    saveStep,
    resumeStep,
  }
}
