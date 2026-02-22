import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PendingInvitation } from '@/lib/types/sharing'
import { usePendingFriendRequestsCount } from './useFriends'

// ──────────────────────────────────────────────────────────────────────────────
// Pending invitation count (with Realtime)
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingInvitationsCount() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['shareInvitations', 'count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { data, error } = await supabase.rpc('get_pending_invitations_count')
      if (error) throw error
      return data as number
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`share-invitations-count:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'share_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        payload => {
          if ((payload.new as Record<string, unknown>)?.status === 'pending') {
            queryClient.invalidateQueries({ queryKey: ['shareInvitations', 'count'] })
            queryClient.invalidateQueries({ queryKey: ['shareInvitations', 'pending'] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'share_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        payload => {
          if ((payload.old as Record<string, unknown>)?.status === 'pending') {
            queryClient.invalidateQueries({ queryKey: ['shareInvitations', 'count'] })
            queryClient.invalidateQueries({ queryKey: ['shareInvitations', 'pending'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return query
}

// ──────────────────────────────────────────────────────────────────────────────
// Pending invitations list
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingInvitations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shareInvitations', 'pending', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_invitations')
      if (error) throw error
      return data as PendingInvitation[]
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Send invitation
// ──────────────────────────────────────────────────────────────────────────────

export function useSendShareInvitation() {
  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      recipientEmail,
    }: {
      itemId: string | null
      itemType: 'food_item' | 'recipe' | 'food_list'
      recipientEmail: string
    }) => {
      const { data, error } = await supabase.rpc('send_share_invitation', {
        p_item_id: itemId,
        p_item_type: itemType,
        p_recipient_email: recipientEmail,
      })
      if (error) throw error
      return data as { success: boolean; invitation_id?: string | null; error?: string }
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Check if a user exists by email (for UI feedback, not for security enforcement)
// ──────────────────────────────────────────────────────────────────────────────

export function useCheckUserExists() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('check_user_exists_by_email', {
        p_email: email,
      })
      if (error) throw error
      return data as { exists: boolean }
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Accept invitation
// ──────────────────────────────────────────────────────────────────────────────

export function useAcceptShareInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('accept_share_invitation', {
        p_invitation_id: invitationId,
      })
      if (error) throw error
      return data as {
        success: boolean
        item_type?: string
        food_item_id?: string
        recipe_id?: string
        imported_count?: number
        skipped_count?: number
        error?: string
        status?: string
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareInvitations'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Reject invitation
// ──────────────────────────────────────────────────────────────────────────────

export function useRejectShareInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('reject_share_invitation', {
        p_invitation_id: invitationId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string; status?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareInvitations'] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Social badge count — summan av delningsinbjudningar + vänförfrågningar
// ──────────────────────────────────────────────────────────────────────────────

export function useSocialBadgeCount() {
  const { data: invitationCount = 0 } = usePendingInvitationsCount()
  const { data: friendCount = 0 } = usePendingFriendRequestsCount()
  return (invitationCount as number) + (friendCount as number)
}
