/**
 * Custom hook för media queries - responsiv design
 */

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Add listener for future changes
    media.addEventListener('change', listener)

    return () => {
      media.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}

/**
 * Fördefinierade breakpoints
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
  }
}
