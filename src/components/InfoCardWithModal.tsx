/**
 * Info Card with Modal
 * Compact card that shows a title and "Läs mer" button, opening the
 * shared InfoModal with full content
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { InfoModal } from '@/components/ui/InfoModal'

interface InfoCardWithModalProps {
  title: string
  modalTitle: string
  modalContent: React.ReactNode
}

export default function InfoCardWithModal({
  title,
  modalTitle,
  modalContent,
}: InfoCardWithModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card className="bg-gradient-to-br from-primary-50 to-accent-50 p-4 dark:from-primary-900/30 dark:to-accent-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs text-primary-600 hover:text-primary-700 underline transition-colors whitespace-nowrap ml-2"
          >
            Läs mer →
          </button>
        </div>
      </Card>

      <InfoModal open={isOpen} onClose={() => setIsOpen(false)} title={modalTitle}>
        {modalContent}
      </InfoModal>
    </>
  )
}
