import { useState } from 'react'
import { Info } from 'lucide-react'
import { InfoModal } from '@/components/ui/InfoModal'

interface ToolInfoButtonProps {
  title: string
  body: string
  /** aria-label för infoknappen */
  ariaLabel: string
}

/**
 * Liten info-ikon för verktygskorten i dagens logg (Portionsberäknaren,
 * Vad ska jag äta?). Öppnar appens gemensamma InfoModal.
 */
export function ToolInfoButton({ title, body, ariaLabel }: ToolInfoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800 dark:text-neutral-500"
        aria-label={ariaLabel}
      >
        <Info className="h-4 w-4" />
      </button>
      <InfoModal open={open} onClose={() => setOpen(false)} title={title} size="md">
        <p className="text-neutral-700 leading-relaxed whitespace-pre-line dark:text-neutral-200">
          {body}
        </p>
      </InfoModal>
    </>
  )
}
