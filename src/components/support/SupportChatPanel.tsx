import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGetSupportThreadId } from '@/hooks/useSupportChat'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import { SupportMessageThread } from './SupportMessageThread'
import { SupportMessageInput } from './SupportMessageInput'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function useSupportThreadStatus(threadId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!threadId) return
    const channel = supabase
      .channel(`support-thread-status:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_threads',
          filter: `id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['support', 'threadStatus', threadId] })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, queryClient])

  return useQuery({
    queryKey: ['support', 'threadStatus', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_threads')
        .select('status')
        .eq('id', threadId!)
        .single()
      if (error) throw error
      return data.status as 'open' | 'closed'
    },
    enabled: !!threadId,
    staleTime: 30_000,
  })
}

export function SupportChatPanel({ isOpen, onClose }: Props) {
  const { t } = useTranslation('support')
  const { data: threadId } = useGetSupportThreadId()
  const { data: threadStatus = 'open' } = useSupportThreadStatus(threadId ?? null)
  const { data: notifications = [] } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  // Markera olästa support-notiser som lästa när panelen öppnas
  useEffect(() => {
    if (!isOpen) return
    notifications
      .filter(n => n.type === 'support_message_received' && n.read_at === null)
      .forEach(n => markRead(n.id))
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  return (
    <div className="fixed bottom-24 md:bottom-20 right-4 md:right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)] h-[500px] flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-neutral-100 bg-white">
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-900">{t('panelTitle')}</p>
          <p className="text-xs text-neutral-500">{t('panelSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          aria-label={t('close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <>
        <SupportMessageThread threadId={threadId ?? null} isPanelOpen={isOpen} />
        <SupportMessageInput threadId={threadId ?? null} status={threadStatus} />
      </>
    </div>
  )
}
