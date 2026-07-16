import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { sv, enUS } from 'date-fns/locale'
import {
  Loader2,
  Send,
  X,
  Lock,
  Unlock,
  InboxIcon,
  Trash2,
  UserCheck,
  UserMinus,
  ImagePlus,
} from 'lucide-react'
import i18n from '@/i18n'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import {
  useSupportInbox,
  useReplySupportMessage,
  useMarkSupportMessagesRead,
  useCloseSupportThread,
  useReopenSupportThread,
  useAdminDeleteSupportThread,
  useAssignSupportThread,
} from '@/hooks/useSupportChat'
import { useSupportMessages, useAdminDeleteSupportMessage } from '@/hooks/useSupportChat'
import { useSupportImageUpload } from '@/hooks/useSupportImageUpload'
import { useAuth } from '@/contexts/AuthContext'
import type { SupportInboxEntry, SupportMessage, SupportRpcResult } from '@/lib/types/support'
import { MessageBubble } from '@/components/support/SupportMessageThread'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEffect, useRef } from 'react'

function getDateLocale() {
  return i18n.language === 'sv' ? sv : enUS
}

// ──────────────────────────────────────────────────────────────────────────────
// AdminSupportThread — right panel / full view
// ──────────────────────────────────────────────────────────────────────────────

function useAdminThreadStatus(threadId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`admin-support-thread-status:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_threads',
          filter: `id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['support', 'adminThreadStatus', threadId] })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, queryClient])

  return useQuery({
    queryKey: ['support', 'adminThreadStatus', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_threads')
        .select('status')
        .eq('id', threadId)
        .single()
      if (error) throw error
      return data.status as 'open' | 'closed'
    },
    staleTime: 30_000,
  })
}

function AdminSupportThread({
  entry,
  onClose,
}: {
  entry: SupportInboxEntry
  onClose?: () => void
}) {
  const { t } = useTranslation('support')
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const didInitialScroll = useRef(false)
  const rafRef = useRef<number | null>(null)

  const { data: threadStatus = 'open' } = useAdminThreadStatus(entry.thread_id)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSupportMessages(
    entry.thread_id,
    true
  )
  const { mutateAsync: reply, isPending: isReplying } = useReplySupportMessage()
  const { mutate: closeThread, isPending: isClosing } = useCloseSupportThread()
  const { mutate: reopenThread, isPending: isReopening } = useReopenSupportThread()
  const { mutate: deleteThread, isPending: isDeleting } = useAdminDeleteSupportThread()
  const { mutate: assignThread, isPending: isAssigning } = useAssignSupportThread()
  const { mutate: deleteMessage } = useAdminDeleteSupportMessage(entry.thread_id)
  const { uploadImage, removeImage, isUploading } = useSupportImageUpload()
  useMarkSupportMessagesRead(entry.thread_id)

  const isAssignedToMe = entry.assigned_admin_id === user?.id

  const messages: SupportMessage[] = data
    ? data.pages
        .slice()
        .reverse()
        .flatMap(page => [...page].reverse())
    : []

  const scrollToBottom = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const attempt = (remaining: number) => {
      const el = scrollRef.current
      if (!el) return
      const target = el.scrollHeight - el.clientHeight
      if (target > 0) {
        el.scrollTop = target
      } else if (remaining > 0) {
        rafRef.current = requestAnimationFrame(() => attempt(remaining - 1))
      }
    }
    rafRef.current = requestAnimationFrame(() => attempt(10))
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [])

  useEffect(() => {
    if (!didInitialScroll.current && messages.length > 0) {
      didInitialScroll.current = true
      scrollToBottom()
    }
  }, [messages.length])

  const prevLengthRef = useRef(0)
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      prevLengthRef.current = messages.length
      scrollToBottom()
    }
  }, [messages.length])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  // Städa object-URL när bilagan byts/tas bort eller komponenten avmonteras
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setInlineError(t('errorNotAnImage'))
      return
    }
    setInlineError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearAttachment = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isBusy = isReplying || isUploading

  const handleSend = async () => {
    const trimmed = input.trim()
    if ((!trimmed && !attachedFile) || isBusy) return
    setInlineError(null)

    let imagePath: string | null = null
    if (attachedFile) {
      const { path, error } = await uploadImage(attachedFile)
      if (error || !path) {
        setInlineError(error ?? t('errorGeneric'))
        return
      }
      imagePath = path
    }

    const result = await reply({ threadId: entry.thread_id, content: trimmed, imagePath })
    const res = result as SupportRpcResult
    if (!res.success) {
      if (imagePath) void removeImage(imagePath)
      setInlineError(res.error === 'thread_closed' ? t('errorThreadClosed') : t('errorGeneric'))
      return
    }
    setInput('')
    clearAttachment()
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {entry.username || entry.email}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-neutral-500 truncate">{entry.email}</p>
            {entry.assigned_admin_id && (
              <span className="shrink-0 text-[10px] bg-primary-50 text-primary-700 rounded px-1.5 py-0.5 leading-none font-medium">
                {isAssignedToMe ? 'Du hanterar' : `@${entry.assigned_admin_username ?? '...'}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Ta / Lämna ärendet */}
          {isAssignedToMe ? (
            <button
              type="button"
              onClick={() => assignThread({ threadId: entry.thread_id, adminId: null })}
              disabled={isAssigning}
              className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {isAssigning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserMinus className="h-3 w-3" />
              )}
              Lämna
            </button>
          ) : (
            <button
              type="button"
              onClick={() => assignThread({ threadId: entry.thread_id, adminId: user?.id ?? null })}
              disabled={isAssigning}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {isAssigning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserCheck className="h-3 w-3" />
              )}
              Ta ärendet
            </button>
          )}

          {threadStatus === 'open' ? (
            <button
              type="button"
              onClick={() => closeThread(entry.thread_id)}
              disabled={isClosing}
              className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {isClosing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {t('closeThread')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => reopenThread(entry.thread_id)}
                disabled={isReopening || isDeleting}
                className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {isReopening ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
                {t('reopenThread')}
              </button>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isReopening || isDeleting}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {t('deleteConversation')}
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      deleteThread(entry.thread_id)
                      onClose?.()
                    }}
                    disabled={isDeleting}
                    className="text-xs text-red-600 font-medium hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      t('deleteConfirmYes')
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg transition-colors"
                  >
                    {t('deleteConfirmNo')}
                  </button>
                </div>
              )}
            </>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden h-7 w-7 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        )}
        {hasNextPage && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-primary-600 hover:underline disabled:opacity-50"
            >
              {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
              {t('loadMore')}
            </button>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.sender_id === user?.id}
            threadId={entry.thread_id}
            onAdminDelete={deleteMessage}
          />
        ))}
      </div>

      {/* Reply input */}
      {threadStatus === 'open' ? (
        <div className="shrink-0 border-t border-neutral-100 px-3 py-3">
          {inlineError && <p className="text-xs text-red-500 mb-2 px-1">{inlineError}</p>}
          {previewUrl && (
            <div className="mb-2 px-1">
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt={t('attachedImageAlt')}
                  className="h-16 w-16 rounded-lg object-cover border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={clearAttachment}
                  disabled={isBusy}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-neutral-700 text-white flex items-center justify-center hover:bg-neutral-900 transition-colors disabled:opacity-50"
                  title={t('removeImage')}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFileSelected(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="shrink-0 h-9 w-9 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('attachImage')}
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                setInlineError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('adminReplyPlaceholder')}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isBusy}
              className="shrink-0 h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-neutral-100 px-4 py-3 bg-neutral-50 text-center">
          <p className="text-xs text-neutral-500">{t('threadClosedAdmin')}</p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// AdminSupportInbox — left panel list
// ──────────────────────────────────────────────────────────────────────────────

function AdminSupportInbox({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (entry: SupportInboxEntry) => void
}) {
  const { t } = useTranslation('support')
  const { data: entries = [], isLoading } = useSupportInbox()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <InboxIcon className="h-10 w-10 text-neutral-300 mb-3" />
        <p className="text-sm text-neutral-500">{t('inboxEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100">
      {entries.map(entry => (
        <button
          key={entry.thread_id}
          type="button"
          onClick={() => onSelect(entry)}
          className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors ${
            selectedId === entry.thread_id ? 'bg-primary-50 border-l-2 border-primary-600' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {entry.username || entry.email}
                </p>
                {entry.status === 'closed' && (
                  <span className="shrink-0 text-[10px] bg-neutral-100 text-neutral-500 rounded px-1 py-0.5 leading-none">
                    {t('closed')}
                  </span>
                )}
                {entry.assigned_admin_id && (
                  <span className="shrink-0 text-[10px] bg-primary-50 text-primary-700 rounded px-1 py-0.5 leading-none">
                    @{entry.assigned_admin_username ?? '...'}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 truncate">
                {/* Tom sträng = bildmeddelande utan text */}
                {entry.last_message === ''
                  ? t('imageAttachment')
                  : (entry.last_message ?? t('noMessages'))}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {entry.last_message_at && (
                <p className="text-[10px] text-neutral-400">
                  {format(parseISO(entry.last_message_at), 'HH:mm', { locale: getDateLocale() })}
                </p>
              )}
              {entry.unread_count > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white px-1">
                  {entry.unread_count > 9 ? '9+' : entry.unread_count}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// AdminSupportPage
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const { t } = useTranslation('support')
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin()
  const [selectedEntry, setSelectedEntry] = useState<SupportInboxEntry | null>(null)

  if (adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-neutral-500">{t('noAccess')}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout fullHeight>
      <div className="flex h-full overflow-hidden">
        {/* Inbox list */}
        <div
          className={`${
            selectedEntry ? 'hidden md:flex' : 'flex'
          } flex-col w-full md:w-80 lg:w-96 shrink-0 border-r border-neutral-200 overflow-y-auto`}
        >
          <div className="shrink-0 px-4 py-3 border-b border-neutral-100">
            <h1 className="text-base font-semibold text-neutral-900">{t('adminPageTitle')}</h1>
          </div>
          <AdminSupportInbox
            selectedId={selectedEntry?.thread_id ?? null}
            onSelect={setSelectedEntry}
          />
        </div>

        {/* Thread view */}
        {selectedEntry ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminSupportThread entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-neutral-400">
            <div className="text-center">
              <InboxIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('selectThread')}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
