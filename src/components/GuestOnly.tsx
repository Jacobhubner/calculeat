import { useAuth } from '@/contexts/AuthContext'

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading || user) return null
  return <>{children}</>
}
