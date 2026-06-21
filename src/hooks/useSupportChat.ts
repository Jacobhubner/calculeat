import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { usePreviewAwareQuery } from '@/hooks/usePreviewAwareQuery'
import { usePreviewMutation } from '@/hooks/usePreviewMutation'
import type { SupportMessage, SupportInboxEntry, SupportRpcResult } from '@/lib/types/support'

// ──────────────────────────────────────────────────────────────────────────────
// Query key factory
// ──────────────────────────────────────────────────────────────────────────────

export const supportKeys = {
  thread: ['support', 'thread'] as const,
  messages: (id: string) => ['support', 'messages', id] as const,
  unread: ['support', 'unread'] as const,
  inbox: ['support', 'inbox'] as const,
}

// ──────────────────────────────────────────────────────────────────────────────
// useGetSupportThreadId — READ-only, runs at DashboardLayout mount
// Returns null if thread doesn't exist yet (no DB write)
// ──────────────────────────────────────────────────────────────────────────────

export function useGetSupportThreadId() {
  const { user } = useAuth()

  return usePreviewAwareQuery({
    queryKey: supportKeys.thread,
    emptyValue: null as string | null,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_support_thread_id')
      if (error) throw error
      return data as string | null
    },
    enabled: !!user,
    staleTime: Infinity,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useCreateSupportThread — runs once when user opens the panel for the first time
// ──────────────────────────────────────────────────────────────────────────────

export function useCreateSupportThread() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_support_thread')
      if (error) throw error
      return data as string
    },
    onSuccess: threadId => {
      queryClient.setQueryData(supportKeys.thread, threadId)
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useSupportMessages — infinite scroll, cursor-based, with Realtime
// isPanelOpen: controls whether a toast is shown on new admin message
// ──────────────────────────────────────────────────────────────────────────────

export function useSupportMessages(threadId: string | null, isPanelOpen: boolean) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user || !threadId) return

    const channel = supabase
      .channel(`support-thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `support_thread_id=eq.${threadId}`,
        },
        payload => {
          const newMsg = payload.new as Record<string, unknown>
          queryClient.invalidateQueries({ queryKey: supportKeys.messages(threadId) })
          if (newMsg?.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: supportKeys.unread })
            if (!isPanelOpen) {
              toast.info('Support svarade', {
                description: 'Öppna chatten för att läsa.',
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_messages',
          filter: `support_thread_id=eq.${threadId}`,
        },
        payload => {
          queryClient.invalidateQueries({ queryKey: supportKeys.messages(threadId) })
          const newMsg = payload.new as Record<string, unknown>
          const oldMsg = payload.old as Record<string, unknown>
          if (newMsg?.deleted_at && !oldMsg?.deleted_at) {
            queryClient.invalidateQueries({ queryKey: supportKeys.unread })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'support_threads',
          filter: `id=eq.${threadId}`,
        },
        () => {
          queryClient.setQueryData(supportKeys.thread, null)
          queryClient.invalidateQueries({ queryKey: supportKeys.unread })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, threadId, isPanelOpen, queryClient])

  return useInfiniteQuery({
    queryKey: supportKeys.messages(threadId ?? ''),
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const { data, error } = await supabase.rpc('get_support_messages', {
        p_thread_id: threadId,
        p_limit: 50,
        p_before: pageParam ?? undefined,
      })
      if (error) throw error
      return data as SupportMessage[]
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: SupportMessage[]) => {
      if (lastPage.length < 50) return undefined
      return lastPage[lastPage.length - 1].created_at
    },
    enabled: !!user && !!threadId,
    staleTime: 10_000,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useSendSupportMessage
// ──────────────────────────────────────────────────────────────────────────────

export function useSendSupportMessage() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
    mutationFn: async ({ content, threadId }: { content: string; threadId: string | null }) => {
      const { data, error } = await supabase.rpc('send_support_message', {
        p_content: content,
        p_thread_id: threadId ?? undefined,
      })
      if (error) throw error
      return data as SupportRpcResult
    },
    onSuccess: (data, variables) => {
      if (data.success && variables.threadId) {
        queryClient.invalidateQueries({ queryKey: supportKeys.messages(variables.threadId) })
      }
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useReplySupportMessage — admin only
// ──────────────────────────────────────────────────────────────────────────────

export function useReplySupportMessage() {
  const queryClient = useQueryClient()
  const { data: isAdmin } = useIsAdmin()

  return usePreviewMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      if (!isAdmin) throw new Error('forbidden')
      const { data, error } = await supabase.rpc('reply_support_message', {
        p_thread_id: threadId,
        p_content: content,
      })
      if (error) throw error
      return data as SupportRpcResult
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: supportKeys.messages(variables.threadId) })
        queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
      }
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useMarkSupportMessagesRead — useRef guard, runs on mount + window focus
// ──────────────────────────────────────────────────────────────────────────────

export function useMarkSupportMessagesRead(threadId: string | null, isPanelOpen = true) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const markedRef = useRef(false)

  useEffect(() => {
    markedRef.current = false
    if (!user || !threadId || !isPanelOpen) return

    const mark = async () => {
      if (markedRef.current) return
      markedRef.current = true
      await supabase.rpc('mark_support_messages_read', { p_thread_id: threadId })
      queryClient.invalidateQueries({ queryKey: supportKeys.unread })
      queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
    }

    mark()

    const onFocus = () => {
      markedRef.current = false
      mark()
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, threadId, isPanelOpen, queryClient])
}

// ──────────────────────────────────────────────────────────────────────────────
// useSupportUnreadCount — for regular users, no threadId needed
// Has its own Realtime channel (panel may be closed when message arrives)
// ──────────────────────────────────────────────────────────────────────────────

export function useSupportUnreadCount(): number {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data = 0 } = usePreviewAwareQuery({
    queryKey: supportKeys.unread,
    emptyValue: 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_support_unread_count')
      if (error) throw error
      return data as number
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`support-unread:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        payload => {
          const newMsg = payload.new as Record<string, unknown>
          if (newMsg?.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: supportKeys.unread })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: supportKeys.unread })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'support_threads' },
        () => {
          queryClient.setQueryData(supportKeys.thread, null)
          queryClient.invalidateQueries({ queryKey: supportKeys.unread })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return data
}

// ──────────────────────────────────────────────────────────────────────────────
// useSupportAdminUnreadCount — for admins, total unread across all threads
// ──────────────────────────────────────────────────────────────────────────────

export function useSupportAdminUnreadCount(): number {
  const { user } = useAuth()
  const { data: isAdmin } = useIsAdmin()
  const queryClient = useQueryClient()

  const { data = 0 } = usePreviewAwareQuery({
    queryKey: ['support', 'adminUnread'] as const,
    emptyValue: 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_support_admin_unread_count')
      if (error) throw error
      return data as number
    },
    enabled: !!user && !!isAdmin,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!user || !isAdmin) return

    const channel = supabase
      .channel(`support-admin-unread:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        payload => {
          const newMsg = payload.new as Record<string, unknown>
          if (newMsg?.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['support', 'adminUnread'] })
            queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['support', 'adminUnread'] })
          queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isAdmin, queryClient])

  return data
}

// ──────────────────────────────────────────────────────────────────────────────
// useSupportInbox — admin inbox, no Realtime (consistent with useConversations)
// ──────────────────────────────────────────────────────────────────────────────

export function useSupportInbox() {
  const { user } = useAuth()
  const { data: isAdmin } = useIsAdmin()

  return usePreviewAwareQuery({
    queryKey: supportKeys.inbox,
    emptyValue: [] as SupportInboxEntry[],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_support_thread_inbox')
      if (error) throw error
      return data as SupportInboxEntry[]
    },
    enabled: !!user && !!isAdmin,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useUserReopenSupportThread — för inloggad användare (inte admin)
// Verifierar ägandeskapet i RPC via user_id = auth.uid()
// ──────────────────────────────────────────────────────────────────────────────

export function useUserReopenSupportThread() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase.rpc('user_reopen_support_thread', { p_thread_id: threadId })
      if (error) throw error
    },
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'threadStatus', threadId] })
      queryClient.invalidateQueries({ queryKey: supportKeys.messages(threadId) })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useDeleteSupportThread — användaren raderar sin stängda tråd (cascade)
// ──────────────────────────────────────────────────────────────────────────────

export function useDeleteSupportThread() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase.rpc('delete_support_thread', { p_thread_id: threadId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData(supportKeys.thread, null)
      queryClient.invalidateQueries({ queryKey: supportKeys.unread })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useAssignSupportThread — admin tilldelar ärende till sig själv eller annan admin
// ──────────────────────────────────────────────────────────────────────────────

export function useAssignSupportThread() {
  const queryClient = useQueryClient()

  return usePreviewMutation({
    mutationFn: async ({ threadId, adminId }: { threadId: string; adminId: string | null }) => {
      const { error } = await supabase.rpc('assign_support_thread', {
        p_thread_id: threadId,
        p_admin_id: adminId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useAdminDeleteSupportThread — admin raderar valfri stängd tråd
// ──────────────────────────────────────────────────────────────────────────────

export function useAdminDeleteSupportThread() {
  const queryClient = useQueryClient()
  const { data: isAdmin } = useIsAdmin()

  return usePreviewMutation({
    mutationFn: async (threadId: string) => {
      if (!isAdmin) throw new Error('forbidden')
      const { error } = await supabase.rpc('admin_delete_support_thread', { p_thread_id: threadId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useCloseSupportThread — admin only
// ──────────────────────────────────────────────────────────────────────────────

export function useCloseSupportThread() {
  const queryClient = useQueryClient()
  const { data: isAdmin } = useIsAdmin()

  return usePreviewMutation({
    mutationFn: async (threadId: string) => {
      if (!isAdmin) throw new Error('forbidden')
      const { error } = await supabase.rpc('close_support_thread', { p_thread_id: threadId })
      if (error) throw error
    },
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
      queryClient.invalidateQueries({ queryKey: supportKeys.messages(threadId) })
      queryClient.invalidateQueries({ queryKey: ['support', 'threadStatus', threadId] })
      queryClient.invalidateQueries({ queryKey: ['support', 'adminThreadStatus', threadId] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useReopenSupportThread — admin only
// ──────────────────────────────────────────────────────────────────────────────

export function useReopenSupportThread() {
  const queryClient = useQueryClient()
  const { data: isAdmin } = useIsAdmin()

  return usePreviewMutation({
    mutationFn: async (threadId: string) => {
      if (!isAdmin) throw new Error('forbidden')
      const { error } = await supabase.rpc('reopen_support_thread', { p_thread_id: threadId })
      if (error) throw error
    },
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.inbox })
      queryClient.invalidateQueries({ queryKey: supportKeys.messages(threadId) })
      queryClient.invalidateQueries({ queryKey: ['support', 'threadStatus', threadId] })
      queryClient.invalidateQueries({ queryKey: ['support', 'adminThreadStatus', threadId] })
    },
  })
}
