import { useEffect, useRef, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { sv, enUS } from 'date-fns/locale'
import { Loader2, Check, CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useSupportMessages, useMarkSupportMessagesRead } from '@/hooks/useSupportChat'
import type { SupportMessage } from '@/lib/types/support'

function getDateLocale() {
  return i18n.language === 'sv' ? sv : enUS
}

interface Props {
  threadId: string
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

  // Scroll to bottom when new messages arrive
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

      {messages.map(msg => {
        const isOwn = msg.sender_id === user?.id
        const isDeleted = !!msg.deleted_at

        return (
          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
              {!isOwn && (
                <p className="text-[10px] text-neutral-400 px-1 mb-0.5">
                  {msg.sender_username} · admin
                </p>
              )}
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
              <div
                className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isDeleted && (
                  <span className="text-[9px] text-neutral-400">
                    {format(parseISO(msg.created_at), 'HH:mm', { locale: getDateLocale() })}
                  </span>
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
