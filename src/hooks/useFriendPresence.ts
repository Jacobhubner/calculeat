import { useMemo } from 'react'
import { usePresence } from '@/contexts/PresenceContext'

export function useFriendPresence(friendIds: string[]): Set<string> {
  const { onlineUserIds } = usePresence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(
    () => new Set(friendIds.filter(id => onlineUserIds.has(id))),
    [friendIds.join(','), onlineUserIds]
  )
}
