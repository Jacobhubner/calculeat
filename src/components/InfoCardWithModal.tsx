/**
 * Info Card with Modal
 * Compact card that shows a title and "Läs mer" button, opening a modal with full content
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import { X } from 'lucide-react'

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
      <Card className="bg-gradient-to-br from-primary-50 to-accent-50 p-4">
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

      {/* Modal */}
      {isOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{modalTitle}</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  aria-label="Stäng"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">{modalContent}</div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
                <Button onClick={() => setIsOpen(false)} className="w-full">
                  Stäng
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
