import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface ProfileCompletionGuardProps {
  children: React.ReactNode
}

/**
 * Component that checks if user has completed essential profile fields
 * and redirects to profile page with a toast if not completed.
 * Only runs on first login (not on subsequent visits).
 */
export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, profile, loading, isProfileComplete } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Don't run checks while loading or if no user
    if (loading || !user) return

    // Don't redirect if already on profile page
    if (location.pathname === '/app/profile') return

    // Check if this is likely a first login (profile exists but is incomplete)
    // We check after a small delay to ensure profile has been loaded
    const checkTimeout = setTimeout(() => {
      if (profile && !isProfileComplete) {
        toast.info('Välkommen! Vänligen slutför din profil för att beräkna dina kaloribehov.')
        navigate('/app/profile', { replace: true })
      }
    }, 500)

    return () => clearTimeout(checkTimeout)
  }, [user, profile, loading, isProfileComplete, navigate, location.pathname])

  return <>{children}</>
}
