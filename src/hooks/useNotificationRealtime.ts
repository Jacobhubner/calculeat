import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/types/notifications'

function toastForNotification(n: Notification) {
  switch (n.type) {
    case 'friend_request_accepted':
      toast.success(n.title)
      break
    case 'friend_request_received':
      toast(n.title, { description: 'Gå till Socialt för att svara.' })
      break
    case 'shared_list_invitation_received':
      toast(n.title, { description: 'Gå till Socialt för att acceptera.' })
      break
    case 'new_message':
      toast(n.title)
      break
    default:
      break
  }
}

export function useNotificationRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const notification = payload.new as Notification
          queryClient.invalidateQueries({ queryKey: ['notifications', 'list', userId] })
          queryClient.invalidateQueries({ queryKey: ['notifications', 'count', userId] })
          toastForNotification(notification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // new_message dedupe updates the row — invalidate list but skip toast
          queryClient.invalidateQueries({ queryKey: ['notifications', 'list', userId] })
          queryClient.invalidateQueries({ queryKey: ['notifications', 'count', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
