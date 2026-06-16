import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useSupportUnreadCount } from '@/hooks/useSupportChat'
import { SupportChatPanel } from './SupportChatPanel'

const HIDDEN_KEY = 'calculeat_support_fab_hidden'

export function SupportChatButton() {
  const { t } = useTranslation('support')
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === 'true')
  const unreadCount = useSupportUnreadCount()
  const [searchParams, setSearchParams] = useSearchParams()

  // Återkommer automatiskt vid oläst meddelande
  useEffect(() => {
    if (unreadCount > 0 && isHidden) {
      setIsHidden(false)
      localStorage.removeItem(HIDDEN_KEY)
    }
  }, [unreadCount, isHidden])

  useEffect(() => {
    if (searchParams.get('support') === 'open') {
      setIsHidden(false)
      localStorage.removeItem(HIDDEN_KEY)
      setIsOpen(true)
      setSearchParams(
        prev => {
          prev.delete('support')
          return prev
        },
        { replace: true }
      )
    }
  }, [searchParams, setSearchParams])

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    setIsHidden(true)
    localStorage.setItem(HIDDEN_KEY, 'true')
  }

  if (isHidden) return null

  return (
    <>
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 flex items-end gap-1">
        {/* Minimera-knapp */}
        <button
          type="button"
          onClick={handleHide}
          aria-label="Dölj support"
          className="mb-0.5 h-5 w-5 rounded-full bg-neutral-200 text-neutral-500 hover:bg-neutral-300 flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={t('openChat')}
          className="relative h-12 w-12 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <SupportChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
