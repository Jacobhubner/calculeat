/**
 * Portal Component
 * Renders children at document.body level to escape stacking context issues
 */

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: React.ReactNode
}

export function Portal({ children }: PortalProps) {
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  return createPortal(children, document.body)
}
