import { X } from 'lucide-react'
import { Button } from '../ui/button'

interface BMRConceptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BMRConceptModal({ isOpen, onClose }: BMRConceptModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Vad är BMR?</h2>
            <p className="text-primary-100 mt-1">Basal Metabolic Rate</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Stäng"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Beskrivning</h3>
            <p className="text-neutral-700 leading-relaxed">
              BMR (Basal Metabolic Rate) är den mängd energi kroppen behöver i vila för att
              upprätthålla alla livsnödvändiga funktioner som andning, cirkulation, organens arbete
              och cellernas grundläggande processer. Det är kroppens &ldquo;grundförbrukning&rdquo;.
            </p>
          </div>

          {/* Factors that increase BMR */}
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span className="text-xl">✓</span>
              Faktorer som kan höja BMR
            </h3>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span className="text-neutral-700 flex-1">
                  <strong>Mer muskelmassa</strong> – muskler kräver mer energi än fett även i vila.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span className="text-neutral-700 flex-1">
                  <strong>Högre kroppsvikt</strong> – större kroppar behöver mer energi för att
                  driva grundfunktioner.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span className="text-neutral-700 flex-1">
                  <strong>Högre kroppstemperatur och aktiv metabolism</strong> – exempelvis vid
                  feber eller snabb cellomsättning.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span className="text-neutral-700 flex-1">
                  <strong>Yngre ålder</strong> – barn och unga har ofta högre BMR.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span className="text-neutral-700 flex-1">
                  <strong>Genetik</strong> – vissa har naturligt snabbare eller långsammare basal
                  energiförbrukning.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span className="text-neutral-700 flex-1">
                  <strong>Hormonella faktorer</strong> – t.ex. högre nivåer av tyroideahormon ökar
                  BMR.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
          <Button onClick={onClose} className="w-full">
            Stäng
          </Button>
        </div>
      </div>
    </div>
  )
}
