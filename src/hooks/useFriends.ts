import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Friend, FriendRequest, SentFriendRequest } from '@/lib/types/friends'

// ──────────────────────────────────────────────────────────────────────────────
// Friends list
// ──────────────────────────────────────────────────────────────────────────────

export function useFriends() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['friends', 'list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_friends')
      if (error) throw error
      return data as Friend[]
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Pending friend requests (inkommande)
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingFriendRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['friends', 'requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_friend_requests')
      if (error) throw error
      return data as FriendRequest[]
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Sent friend requests (skickade)
// ──────────────────────────────────────────────────────────────────────────────

export function useSentFriendRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['friends', 'sent', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sent_friend_requests')
      if (error) throw error
      return data as SentFriendRequest[]
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Pending friend requests count (with Realtime + social feedback toasts)
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingFriendRequestsCount() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['friends', 'count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { data, error } = await supabase.rpc('get_pending_friend_requests_count')
      if (error) throw error
      return data as number
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!user) return

    // Kanal 1: Ny inkommande vänförfrågan eller statusändring
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
      // Social feedback: min förfrågan accepterades
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
            // Toast: vän accepterade
            const addresseeName = (payload.new as Record<string, unknown>)?.addressee_alias
            toast.success(
              addresseeName ? `Du och ${addresseeName} är nu vänner!` : 'Vänförfrågan accepterad!'
            )
          }
        }
      )
      .subscribe()

    // Kanal 2: Social feedback — min delning accepterades/nekades
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

  return query
}

// ──────────────────────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────────────────────

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: async (recipientEmail: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_recipient_email: recipientEmail,
      })
      if (error) throw error
      return data as { success: boolean; friendship_id?: string; error?: string }
    },
  })
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.rpc('cancel_friend_request', {
        p_friendship_id: friendshipId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'sent'] })
    },
  })
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_friendship_id: friendshipId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.rpc('reject_friend_request', {
        p_friendship_id: friendshipId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'count'] })
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] })
    },
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.rpc('remove_friend', {
        p_friendship_id: friendshipId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] })
    },
  })
}

export function useSetFriendAlias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ friendshipId, alias }: { friendshipId: string; alias: string }) => {
      const { data, error } = await supabase.rpc('set_friend_alias', {
        p_friendship_id: friendshipId,
        p_alias: alias,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] })
    },
  })
}

export function useSendShareInvitationToFriend() {
  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      friendUserId,
    }: {
      itemId: string | null
      itemType: 'food_item' | 'recipe' | 'food_list'
      friendUserId: string
    }) => {
      const { data, error } = await supabase.rpc('send_share_invitation_to_friend', {
        p_item_id: itemId,
        p_item_type: itemType,
        p_friend_user_id: friendUserId,
      })
      if (error) throw error
      return data as { success: boolean; invitation_id?: string; error?: string }
    },
  })
}
