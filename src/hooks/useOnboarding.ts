import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const ONBOARDING_KEY = 'calculeat_onboarding_completed'
const STEP_KEY = 'calculeat-onboarding-step'
const STARTED_KEY = 'calculeat-onboarding-started'

export function useOnboarding() {
  const { user, isProfileComplete, isPreviewMode } = useAuth()

  const hasSeenOnboarding = user
    ? localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`) === 'true'
    : true

  // In preview, always show onboarding if profile is incomplete — ignore localStorage flag
  const shouldShowOnboarding = user && !isProfileComplete && (isPreviewMode || !hasSeenOnboarding)

  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)

  useEffect(() => {
    setShowOnboarding(shouldShowOnboarding)
  }, [shouldShowOnboarding])

  const completeOnboarding = () => {
    if (!user) return
    localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, 'true')
    localStorage.removeItem(STEP_KEY)
    localStorage.removeItem(STARTED_KEY)
    setShowOnboarding(false)
  }

  // Spara vilket steg användaren är på — möjliggör återupptagning vid sidrefresh
  const saveStep = (step: number) => {
    localStorage.setItem(STEP_KEY, String(step))
    if (!localStorage.getItem(STARTED_KEY)) {
      localStorage.setItem(STARTED_KEY, new Date().toISOString())
    }
  }

  // Returnera sparat steg vid sidrefresh (0 om inget sparat)
  const resumeStep = (): number => {
    const saved = localStorage.getItem(STEP_KEY)
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
