import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PresenceContextValue {
  onlineUserIds: Set<string>
}

const PresenceContext = createContext<PresenceContextValue>({ onlineUserIds: new Set() })

export function usePresence() {
  return useContext(PresenceContext)
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

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

  return <PresenceContext.Provider value={{ onlineUserIds }}>{children}</PresenceContext.Provider>
}
