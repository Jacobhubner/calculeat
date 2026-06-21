import { useEffect, useRef, useCallback, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { sv, enUS } from 'date-fns/locale'
import { Loader2, Check, CheckCheck, Pencil, X, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useAuth } from '@/contexts/AuthContext'
import {
  useSupportMessages,
  useMarkSupportMessagesRead,
  useEditSupportMessage,
} from '@/hooks/useSupportChat'
import type { SupportMessage } from '@/lib/types/support'

function getDateLocale() {
  return i18n.language === 'sv' ? sv : enUS
}

interface MessageBubbleProps {
  msg: SupportMessage
  isOwn: boolean
  threadId: string
  /** Admin-only delete action — undefined in user chat panel */
  onAdminDelete?: (messageId: string) => void
}

export function MessageBubble({ msg, isOwn, threadId, onAdminDelete }: MessageBubbleProps) {
  const { t } = useTranslation('support')
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(msg.content ?? '')
  const [showMenu, setShowMenu] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: editMessage, isPending: isEditing } = useEditSupportMessage(threadId)
  const isDeleted = !!msg.deleted_at

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  // Auto-resize textarea
  useEffect(() => {
    if (!editing || !textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    textareaRef.current.focus()
  }, [editing, editValue])

  const handleEditSubmit = () => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === msg.content) {
      setEditing(false)
      return
    }
    editMessage({ messageId: msg.id, content: trimmed }, { onSuccess: () => setEditing(false) })
  }

  const canEdit = isOwn && !isDeleted
  const canDelete = !!onAdminDelete && !isDeleted

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <p className="text-[10px] text-neutral-400 px-1 mb-0.5">{msg.sender_username} · admin</p>
        )}

        <div
          className={`relative group flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Bubble */}
          {editing ? (
            <div className="flex flex-col gap-1 min-w-[180px]">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleEditSubmit()
                  }
                  if (e.key === 'Escape') {
                    setEditing(false)
                    setEditValue(msg.content ?? '')
                  }
                }}
                rows={1}
                className="resize-none rounded-xl border border-primary-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setEditValue(msg.content ?? '')
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={isEditing || !editValue.trim()}
                  className="h-6 w-6 flex items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
                >
                  {isEditing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl px-3 py-2 text-sm ${
                isDeleted
                  ? 'bg-neutral-50 text-neutral-400 italic border border-neutral-100'
                  : isOwn
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
              }`}
            >
              {isDeleted ? t('deletedMessage') : msg.content}
            </div>
          )}

          {/* Hover-meny — visas vid hover om man kan redigera eller radera */}
          {!editing && (canEdit || canDelete) && (
            <div
              ref={menuRef}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
            >
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(msg.content ?? '')
                    setEditing(true)
                    setShowMenu(false)
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                  title="Redigera"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onAdminDelete!(msg.id)}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50"
                  title="Radera"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp + read receipt */}
        {!editing && (
          <div
            className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            {!isDeleted && (
              <span className="text-[9px] text-neutral-400">
                {format(parseISO(msg.created_at), 'HH:mm', { locale: getDateLocale() })}
                {msg.edited_at && msg.original_content && (
                  <button
                    type="button"
                    onClick={() => setShowOriginal(v => !v)}
                    className="ml-1 italic underline underline-offset-2 hover:text-neutral-600 transition-colors"
                  >
                    redigerad
                  </button>
                )}
              </span>
            )}
            {showOriginal && msg.original_content && (
              <div
                className={`mt-1 px-2 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-500 max-w-[240px] ${isOwn ? 'text-right' : 'text-left'}`}
              >
                <p className="text-[10px] font-medium text-neutral-400 mb-0.5">
                  Originalmeddelande
                </p>
                <p className="italic">{msg.original_content}</p>
              </div>
            )}
            {isOwn && !isDeleted && (
              <span className="text-[9px] text-neutral-400">
                {msg.read_at ? (
                  <CheckCheck className="h-3 w-3 inline text-primary-400" />
                ) : (
                  <Check className="h-3 w-3 inline text-neutral-300" />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  threadId: string | null
  isPanelOpen: boolean
}

export function SupportMessageThread({ threadId, isPanelOpen }: Props) {
  const { t } = useTranslation('support')
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)
  const didInitialScroll = useRef(false)
  const rafRef = useRef<number | null>(null)
  const pinScrollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSupportMessages(
    threadId,
    isPanelOpen
  )
  useMarkSupportMessagesRead(threadId, isPanelOpen)

  const messages: SupportMessage[] = data
    ? data.pages
        .slice()
        .reverse()
        .flatMap(page => [...page].reverse())
    : []

  const scrollToBottom = useCallback((pin = false) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    if (pinScrollRef.current !== null) {
      clearTimeout(pinScrollRef.current)
      pinScrollRef.current = null
    }
    const attempt = (remaining: number) => {
      const el = scrollRef.current
      if (!el) return
      const target = el.scrollHeight - el.clientHeight
      if (target > 0) {
        el.scrollTop = target
        if (pin) {
          pinScrollRef.current = setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop =
                scrollRef.current.scrollHeight - scrollRef.current.clientHeight
            }
            pinScrollRef.current = null
          }, 100)
        }
      } else if (remaining > 0) {
        rafRef.current = requestAnimationFrame(() => attempt(remaining - 1))
      }
    }
    rafRef.current = requestAnimationFrame(() => attempt(10))
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (pinScrollRef.current !== null) clearTimeout(pinScrollRef.current)
    }
  }, [])

  useEffect(() => {
    scrollToBottom(true)
  }, [])

  useEffect(() => {
    if (!didInitialScroll.current && messages.length > 0) {
      didInitialScroll.current = true
      scrollToBottom(true)
    }
  }, [messages.length, scrollToBottom])

  const prevLengthRef = useRef(0)
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      prevLengthRef.current = messages.length
      scrollToBottom(false)
    }
  }, [messages.length, scrollToBottom])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <p className="text-sm text-neutral-500">{t('emptyThread')}</p>
          <p className="text-xs text-neutral-400 mt-1">{t('emptyThreadSub')}</p>
        </div>
      )}

      {threadId &&
        messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.sender_id === user?.id}
            threadId={threadId}
          />
        ))}
    </div>
  )
}
