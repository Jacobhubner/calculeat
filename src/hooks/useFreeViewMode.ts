import { useState, useEffect } from 'react'

/**
 * Admin-verktyg: navigera CalculEat med riktig data men tvingade
 * gratis-entitlements, för att se premium-lås/blur/uppgraderingsflöden
 * som en gratisanvändare skulle. Ren client-side override — ingen
 * DB-skrivning, ingen sandlåda. Se usePreviewMode för det andra
 * admin-testläget (tom sandlådeprofil för onboarding/tomma-tillstånd).
 */
export const FREE_VIEW_KEY = 'calculeat-free-view-active'

function setFreeViewFlag(value: boolean) {
  if (value) {
    localStorage.setItem(FREE_VIEW_KEY, 'true')
  } else {
    localStorage.removeItem(FREE_VIEW_KEY)
  }
  window.dispatchEvent(new Event('free-view-mode-change'))
}

export function useFreeViewMode() {
  const [isFreeViewActive, setIsFreeViewActive] = useState(
    () => localStorage.getItem(FREE_VIEW_KEY) === 'true'
  )

  useEffect(() => {
    const sync = () => setIsFreeViewActive(localStorage.getItem(FREE_VIEW_KEY) === 'true')
    window.addEventListener('free-view-mode-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('free-view-mode-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return {
    isFreeViewActive,
    enterFreeView: () => setFreeViewFlag(true),
    exitFreeView: () => setFreeViewFlag(false),
  }
}
