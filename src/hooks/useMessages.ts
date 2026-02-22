import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Message, Conversation } from '@/lib/types/messages'

// ──────────────────────────────────────────────────────────────────────────────
// Query key factory
// ──────────────────────────────────────────────────────────────────────────────

export const messageKeys = {
  all: ['messages'] as const,
  conversations: () => ['messages', 'conversations'] as const,
  thread: (id: string) => ['messages', 'thread', id] as const,
  unread: () => ['messages', 'unread'] as const,
}

// ──────────────────────────────────────────────────────────────────────────────
// useConversations
// ──────────────────────────────────────────────────────────────────────────────

export function useConversations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_conversations')
      if (error) throw error
      return data as Conversation[]
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useMessages (infinite scroll, cursor-based)
// ──────────────────────────────────────────────────────────────────────────────

export function useMessages(friendshipId: string | null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user || !friendshipId) return

    const channel = supabase
      .channel(`messages-thread:${friendshipId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: messageKeys.thread(friendshipId) })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, friendshipId, queryClient])

  return useInfiniteQuery({
    queryKey: messageKeys.thread(friendshipId ?? ''),
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const { data, error } = await supabase.rpc('get_messages', {
        p_friendship_id: friendshipId,
        p_limit: 50,
        p_before: pageParam ?? undefined,
      })
      if (error) throw error
      return data as Message[]
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: Message[]) => {
      if (lastPage.length < 50) return undefined
      return lastPage[lastPage.length - 1].created_at
    },
    enabled: !!user && !!friendshipId,
    staleTime: 10_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useSendMessage
// ──────────────────────────────────────────────────────────────────────────────

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ friendshipId, content }: { friendshipId: string; content: string }) => {
      const { data, error } = await supabase.rpc('send_message', {
        p_friendship_id: friendshipId,
        p_content: content,
      })
      if (error) throw error
      return data as { success: boolean; message_id?: string; error?: string }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(variables.friendshipId) })
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useEditMessage
// ──────────────────────────────────────────────────────────────────────────────

export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      friendshipId: _friendshipId,
      content,
    }: {
      messageId: string
      friendshipId: string
      content: string
    }) => {
      const { data, error } = await supabase.rpc('edit_message', {
        p_message_id: messageId,
        p_new_content: content,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(variables.friendshipId) })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useDeleteMessage
// ──────────────────────────────────────────────────────────────────────────────

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      friendshipId: _friendshipId,
    }: {
      messageId: string
      friendshipId: string
    }) => {
      const { data, error } = await supabase.rpc('delete_message', {
        p_message_id: messageId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(variables.friendshipId) })
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useDeleteConversation
// ──────────────────────────────────────────────────────────────────────────────

export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.rpc('delete_conversation', {
        p_friendship_id: friendshipId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useMarkMessagesRead — kallar RPC på mount + window focus, useRef-guard
// ──────────────────────────────────────────────────────────────────────────────

export function useMarkMessagesRead(friendshipId: string | null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const markedRef = useRef(false)

  useEffect(() => {
    if (!user || !friendshipId) return

    const mark = async () => {
      if (markedRef.current) return
      markedRef.current = true
      await supabase.rpc('mark_messages_read', { p_friendship_id: friendshipId })
      queryClient.invalidateQueries({ queryKey: messageKeys.unread() })
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
    }

    mark()

    const onFocus = () => {
      markedRef.current = false
      mark()
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, friendshipId, queryClient])
}

// ──────────────────────────────────────────────────────────────────────────────
// useUnreadMessageCount — useQuery + Realtime
// ──────────────────────────────────────────────────────────────────────────────

export function useUnreadMessageCount(): number {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data = 0 } = useQuery({
    queryKey: messageKeys.unread(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_message_count')
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
      .channel(`messages-unread:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        // Bara olästa inkommande meddelanden räknas
        if ((payload.new as Record<string, unknown>)?.sender_id !== user.id) {
          queryClient.invalidateQueries({ queryKey: messageKeys.unread() })
          queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        // read_at uppdateras när mark_messages_read körs
        queryClient.invalidateQueries({ queryKey: messageKeys.unread() })
        queryClient.invalidateQueries({ queryKey: messageKeys.conversations() })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return data
}
