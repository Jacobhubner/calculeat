import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useFriendPresence(friendIds: string[]): Set<string> {
  const { user } = useAuth()
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Recompute online set from current presence state + latest friendIds
  const recompute = (friendIdSet: Set<string>, userId: string) => {
    if (!channelRef.current) return
    const state = channelRef.current.presenceState<{ user_id: string }>()
    const ids = new Set(
      Object.values(state)
        .flat()
        .map(p => p.user_id)
        .filter(id => id !== userId && friendIdSet.has(id))
    )
    setOnlineIds(ids)
  }

  // Re-run recompute whenever friendIds changes (friends loaded async after mount)
  useEffect(() => {
    if (!user || !channelRef.current) return
    recompute(new Set(friendIds), user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendIds.join(',')])

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('online-friends')
    channelRef.current = channel

    const handleSync = () => recompute(new Set(friendIds), user.id)

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleSync)
      .on('presence', { event: 'leave' }, handleSync)
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id })
        }
      })

    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return onlineIds
}
