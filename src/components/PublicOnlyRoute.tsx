import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

/**
 * Component that redirects authenticated users away from public-only pages
 * (like login/register) to the dashboard.
 */
export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-600">Laddar...</div>
      </div>
    )
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/app" replace />
  }

  // Not authenticated, show the public page (login/register)
  return <>{children}</>
}
