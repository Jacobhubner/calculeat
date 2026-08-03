import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Trash2, ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useSendSupportMessage,
  useCreateSupportThread,
  useDeleteSupportThread,
} from '@/hooks/useSupportChat'
import { useSupportImageUpload } from '@/hooks/useSupportImageUpload'
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: sendMessage, isPending: isSending } = useSendSupportMessage()
  const { mutateAsync: createThread, isPending: isCreating } = useCreateSupportThread()
  const { mutate: deleteThread, isPending: isDeleting } = useDeleteSupportThread()
  const { uploadImage, removeImage, isUploading } = useSupportImageUpload()

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

  const isBusy = isSending || isCreating || isUploading

  const handleSend = async () => {
    const trimmed = input.trim()
    if ((!trimmed && !attachedFile) || isBusy) return
    setInlineError(null)

    // Ladda upp ev. bilaga först — RPC:n validerar att pathen finns i bucketen
    let imagePath: string | null = null
    if (attachedFile) {
      const { path, error } = await uploadImage(attachedFile)
      if (error || !path) {
        setInlineError(error ?? t('errorGeneric'))
        return
      }
      imagePath = path
    }

    const resolvedThreadId = threadId ?? (await createThread())
    const result = await sendMessage({ content: trimmed, threadId: resolvedThreadId, imagePath })
    const res = result as SupportRpcResult
    if (!res.success) {
      // Meddelandet gick inte iväg — städa bort den uppladdade bilagan
      if (imagePath) void removeImage(imagePath)
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
    clearAttachment()
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
    <div className="shrink-0 border-t border-neutral-100 dark:border-neutral-700 px-3 py-3">
      {status === 'closed' && threadId && (
        <div className="mb-3 flex flex-col items-center gap-2 rounded-lg bg-neutral-50 px-3 py-3 text-center dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('threadClosedNotice')}
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-500 disabled:opacity-50 transition-colors dark:text-neutral-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('deleteConversation')}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('deleteConfirm')}
              </span>
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
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors dark:text-neutral-500"
              >
                {t('deleteConfirmNo')}
              </button>
            </div>
          )}
        </div>
      )}
      {inlineError && <p className="text-xs text-red-500 mb-2 px-1">{inlineError}</p>}
      {previewUrl && (
        <div className="mb-2 px-1">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt={t('attachedImageAlt')}
              className="h-16 w-16 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
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
          disabled={isBusy || status === 'closed'}
          className="shrink-0 h-9 w-9 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:text-neutral-500"
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
          placeholder={t('inputPlaceholder')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-base md:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={(!input.trim() && !attachedFile) || isBusy}
          className="shrink-0 h-9 w-9 rounded-xl bg-primary-500 text-on-primary flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
