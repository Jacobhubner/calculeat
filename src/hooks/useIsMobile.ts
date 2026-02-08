import { useState, useEffect } from 'react'

/** Matches Tailwind md: breakpoint (768px) */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  /* eslint-disable react-hooks/set-state-in-effect -- Syncing with external matchMedia API */
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  return isMobile
}
