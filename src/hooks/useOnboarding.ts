/**
 * Hook för att hantera onboarding-status
 * Sparar i localStorage om användaren har sett onboarding
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const ONBOARDING_KEY = 'calculeat_onboarding_completed'

export function useOnboarding() {
  const { user, isProfileComplete } = useAuth()

  // Check if user has seen onboarding (computed value)
  const hasSeenOnboarding = user
    ? localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`) === 'true'
    : true

  // Determine if onboarding should show (computed value)
  const shouldShowOnboarding = user && !hasSeenOnboarding && !isProfileComplete

  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)

  // Update showOnboarding when dependencies change
  useEffect(() => {
    setShowOnboarding(shouldShowOnboarding)
  }, [shouldShowOnboarding])

  const completeOnboarding = () => {
    if (!user) return

    const key = `${ONBOARDING_KEY}_${user.id}`
    localStorage.setItem(key, 'true')
    setShowOnboarding(false)
  }

  return {
    showOnboarding,
    hasSeenOnboarding,
    setShowOnboarding,
    completeOnboarding,
  }
}
