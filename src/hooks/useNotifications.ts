import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Notification } from '@/lib/types/notifications'

export function useNotifications(limit = 30, offset = 0) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'list', user?.id, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notifications', {
        p_limit: limit,
        p_offset: offset,
      })
      if (error) throw error
      return data as Notification[]
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { data, error } = await supabase.rpc('get_unread_notification_count')
      if (error) throw error
      return data as number
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count', user?.id] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count', user?.id] })
    },
  })
}
