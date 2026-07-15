import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useSendSupportMessage,
  useCreateSupportThread,
  useDeleteSupportThread,
} from '@/hooks/useSupportChat'
import type { SupportRpcResult } from '@/lib/types/support'

interface Props {
  threadId: string | null
  status: 'open' | 'closed'
}

export function SupportMessageInput({ threadId, status }: Props) {
  const { t } = useTranslation('support')
  const [input, setInput] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { mutateAsync: sendMessage, isPending: isSending } = useSendSupportMessage()
  const { mutateAsync: createThread, isPending: isCreating } = useCreateSupportThread()
  const { mutate: deleteThread, isPending: isDeleting } = useDeleteSupportThread()

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending || isCreating) return
    setInlineError(null)

    const resolvedThreadId = threadId ?? (await createThread())
    const result = await sendMessage({ content: trimmed, threadId: resolvedThreadId })
    const res = result as SupportRpcResult
    if (!res.success) {
      if (res.error === 'rate_limited') {
        setInlineError(t('errorRateLimited'))
      } else if (res.error === 'thread_closed') {
        setInlineError(t('errorThreadClosed'))
      } else {
        setInlineError(t('errorGeneric'))
      }
      return
    }

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="shrink-0 border-t border-neutral-100 px-3 py-3">
      {status === 'closed' && threadId && (
        <div className="mb-3 flex flex-col items-center gap-2 rounded-lg bg-neutral-50 px-3 py-3 text-center">
          <p className="text-xs text-neutral-500">{t('threadClosedNotice')}</p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-500 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('deleteConversation')}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">{t('deleteConfirm')}</span>
              <button
                type="button"
                onClick={() => deleteThread(threadId)}
                disabled={isDeleting}
                className="text-xs text-red-500 font-medium hover:text-red-600 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  t('deleteConfirmYes')
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {t('deleteConfirmNo')}
              </button>
            </div>
          )}
        </div>
      )}
      {inlineError && <p className="text-xs text-red-500 mb-2 px-1">{inlineError}</p>}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            setInlineError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-base md:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="shrink-0 h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
