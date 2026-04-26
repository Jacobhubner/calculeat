import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface NewFriendNotification {
  id: string // friendship_id used as stable key
  name: string
}

interface PresenceContextValue {
  onlineUserIds: Set<string>
  recentNewFriends: NewFriendNotification[]
  dismissNewFriend: (id: string) => void
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  recentNewFriends: [],
  dismissNewFriend: () => {},
})

export function usePresence() {
  return useContext(PresenceContext)
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [recentNewFriends, setRecentNewFriends] = useState<NewFriendNotification[]>([])

  const dismissNewFriend = useCallback((id: string) => {
    setRecentNewFriends(prev => prev.filter(n => n.id !== id))
  }, [])

  // Global presence tracking
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('online-friends')

    const recompute = () => {
      const state = channel.presenceState<{ user_id: string }>()
      setOnlineUserIds(
        new Set(
          Object.values(state)
            .flat()
            .map(p => p.user_id)
        )
      )
    }

    channel
      .on('presence', { event: 'sync' }, recompute)
      .on('presence', { event: 'join' }, recompute)
      .on('presence', { event: 'leave' }, recompute)
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: user.id })
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Global social Realtime — friend requests + share feedback
  useEffect(() => {
    if (!user) return

    const friendshipsChannel = supabase
      .channel(`friendships-count:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`,
        },
        payload => {
          if ((payload.new as Record<string, unknown>)?.status === 'pending') {
            queryClient.invalidateQueries({ queryKey: ['friends', 'count'] })
            queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`,
        },
        payload => {
          if ((payload.old as Record<string, unknown>)?.status === 'pending') {
            queryClient.invalidateQueries({ queryKey: ['friends', 'count'] })
            queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${user.id}`,
        },
        payload => {
          const newStatus = (payload.new as Record<string, unknown>)?.status
          const oldStatus = (payload.old as Record<string, unknown>)?.status
          if (oldStatus === 'pending' && newStatus === 'accepted') {
            queryClient.invalidateQueries({ queryKey: ['friends', 'list'] })
            queryClient.invalidateQueries({ queryKey: ['friends', 'sent'] })
            const row = payload.new as Record<string, unknown>
            const name = (row.addressee_alias as string | undefined) ?? 'Din vän'
            const friendshipId = (row.id as string | undefined) ?? String(Date.now())
            toast.success(name ? `Du och ${name} är nu vänner!` : 'Vänförfrågan accepterad!')
            setRecentNewFriends(prev => {
              if (prev.some(n => n.id === friendshipId)) return prev
              return [{ id: friendshipId, name }, ...prev]
            })
          }
        }
      )
      .subscribe()

    const shareChannel = supabase
      .channel(`share-feedback:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'share_invitations',
          filter: `sender_id=eq.${user.id}`,
        },
        payload => {
          const newStatus = (payload.new as Record<string, unknown>)?.status
          const oldStatus = (payload.old as Record<string, unknown>)?.status
          if (oldStatus !== 'pending') return
          if (newStatus === 'accepted') {
            toast.success('Din delning importerades!')
          } else if (newStatus === 'rejected') {
            toast('Delningen tackades nej', { description: 'Mottagaren valde att inte importera.' })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(friendshipsChannel)
      supabase.removeChannel(shareChannel)
    }
  }, [user, queryClient])

  return (
    <PresenceContext.Provider value={{ onlineUserIds, recentNewFriends, dismissNewFriend }}>
      {children}
    </PresenceContext.Provider>
  )
}
