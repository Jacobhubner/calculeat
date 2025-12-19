import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useActiveProfile } from '@/hooks'

interface ProfileCompletionGuardProps {
  children: React.ReactNode
}

/**
 * Component that checks if user has completed essential profile fields
 * and redirects to profile page with a toast if not completed.
 *
 * Two-stage check:
 * 1. Basic info (birth_date, gender, height_cm) - must be completed first
 * 2. TDEE - must be calculated or entered manually before accessing other pages
 *
 * Allowed routes without TDEE: /app/profile, /app/tools/tdee-calculator
 */
export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, profile, loading, isProfileComplete } = useAuth()
  const { profile: activeProfile } = useActiveProfile()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Don't run checks while loading or if no user
    if (loading || !user) return

    // Paths that are allowed without TDEE
    const allowedWithoutTDEE = ['/app/profile', '/app/tools/tdee-calculator']
    const isAllowed = allowedWithoutTDEE.some(route => location.pathname.startsWith(route))

    // Check if this is likely a first login (profile exists but basic info is incomplete)
    const checkTimeout = setTimeout(() => {
      // Stage 1: Check basic info completion
      if (profile && !isProfileComplete) {
        if (location.pathname !== '/app/profile') {
          toast.info('Välkommen! Vänligen slutför din profil för att beräkna dina kaloribehov.')
          navigate('/app/profile', { replace: true })
        }
        return
      }

      // Stage 2: Check TDEE completion (only if basic info is complete)
      const hasBasicInfo = !!(
        activeProfile?.birth_date &&
        activeProfile?.gender &&
        activeProfile?.height_cm
      )
      const hasTDEE = !!activeProfile?.tdee

      if (hasBasicInfo && !hasTDEE && !isAllowed) {
        toast.info('Beräkna eller ange ditt TDEE för att fortsätta')
        navigate('/app/profile', { replace: true })
      }
    }, 500)

    return () => clearTimeout(checkTimeout)
  }, [user, profile, activeProfile, loading, isProfileComplete, navigate, location.pathname])

  return <>{children}</>
}
