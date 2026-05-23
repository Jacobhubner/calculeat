import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePreviewAwareQuery } from '@/hooks/usePreviewAwareQuery'
import { usePreviewMutation } from '@/hooks/usePreviewMutation'
import type { Friend, FriendRequest, SentFriendRequest } from '@/lib/types/friends'

// ──────────────────────────────────────────────────────────────────────────────
// Friends list
// ──────────────────────────────────────────────────────────────────────────────

export function useFriends() {
  const { user } = useAuth()

  return usePreviewAwareQuery({
    queryKey: ['friends', 'list', user?.id],
    emptyValue: [] as Friend[],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_friends')
      if (error) throw error
      return data as Friend[]
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Pending friend requests (inkommande)
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingFriendRequests() {
  const { user } = useAuth()

  return usePreviewAwareQuery({
    queryKey: ['friends', 'requests', user?.id],
    emptyValue: [] as FriendRequest[],
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

  return usePreviewAwareQuery({
    queryKey: ['friends', 'sent', user?.id],
    emptyValue: [] as SentFriendRequest[],
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

  return usePreviewAwareQuery({
    queryKey: ['friends', 'count', user?.id],
    emptyValue: 0,
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
}

// ──────────────────────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────────────────────

export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
    mutationFn: async (recipientEmail: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_recipient_email: recipientEmail,
      })
      if (error) throw error
      return data as { success: boolean; friendship_id?: string; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'sent'] })
    },
  })
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
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

  return usePreviewMutation({
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

  return usePreviewMutation({
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

  return usePreviewMutation({
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

  return usePreviewMutation({
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
  return usePreviewMutation({
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
