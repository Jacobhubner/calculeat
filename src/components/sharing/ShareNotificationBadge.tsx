import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'

interface ShareNotificationBadgeProps {
  mode: 'icon' | 'count-only'
  className?: string
}

export function ShareNotificationBadge({ mode, className }: ShareNotificationBadgeProps) {
  const count = useSocialBadgeCount()

  if (count === 0) return null

  if (mode === 'count-only') {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ${className ?? ''}`}
      >
        {count > 99 ? '99+' : count}
      </span>
    )
  }

  return (
    <Link
      to="/app/social"
      className={`relative inline-flex items-center justify-center p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors ${className ?? ''}`}
      aria-label={`${count} väntande notifikation${count !== 1 ? 'er' : ''}`}
    >
      <Bell className="h-5 w-5" />
      <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  )
}
