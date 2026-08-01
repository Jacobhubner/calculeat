import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Portal } from '@/components/ui/portal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InfoModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Rad under titeln (t.ex. årtal, kort undertext) */
  subtitle?: string
  children: ReactNode
  /** 'md' för korta texter, '2xl' (default) för rikt innehåll, '5xl' för kortgrids */
  size?: 'md' | '2xl' | '5xl'
}

const SIZE_CLASSES = {
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
  '5xl': 'max-w-5xl',
} as const

/**
 * Gemensamt skal för ALLA informationsmodaler i appen — en stil överallt:
 * Portal-overlay, vit rundad panel, sticky header (titel + X), innehåll,
 * sticky footer med Stäng i full bredd. Bygg aldrig egna info-modal-skal;
 * använd denna (design fryst 2026-07-18, baserad på det etablerade mönstret).
 */
export function InfoModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = '2xl',
}: InfoModalProps) {
  const { t } = useTranslation('common')

  if (!open) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      >
        <div
          className={cn(
            'bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto',
            'dark:bg-neutral-850 dark:text-neutral-100 dark:shadow-black/50',
            SIZE_CLASSES[size]
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-700 p-6 rounded-t-2xl flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
              {subtitle && (
                <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label={t('actions.close')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-neutral-50 dark:bg-neutral-900 p-6 rounded-b-2xl border-t border-neutral-200 dark:border-neutral-700">
            <Button onClick={onClose} className="w-full">
              {t('actions.close')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
