import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ToolInfoButtonProps {
  title: string
  body: string
  /** aria-label för infoknappen */
  ariaLabel: string
}

/**
 * Liten info-ikon för verktygskorten i dagens logg (Portionsberäknaren,
 * Vad ska jag äta?). Öppnar en kompakt dialog som förklarar funktionen.
 */
export function ToolInfoButton({ title, body, ariaLabel }: ToolInfoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
        aria-label={ariaLabel}
      >
        <Info className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-left">
              {body}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
