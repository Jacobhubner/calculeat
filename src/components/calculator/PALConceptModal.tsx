import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

interface PALConceptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PALConceptModal({ isOpen, onClose }: PALConceptModalProps) {
  if (!isOpen) return null

  return (
    <Portal>
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
              <h2 className="text-2xl font-bold">Vad är PAL?</h2>
              <p className="text-primary-100 mt-1">Physical Activity Level</p>
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
                PAL står för Physical Activity Level och beskriver din genomsnittliga
                energiförbrukning relativt din basala ämnesomsättning (BMR). Ju högre PAL, desto mer
                aktiv har du antagits vara, och desto högre blir ditt beräknade kaloribehov (TDEE).
              </p>
            </div>

            {/* How it works */}
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Hur fungerar PAL?
              </h3>
              <div className="space-y-3">
                <p className="text-neutral-700 leading-relaxed">
                  PAL-värdet multipliceras med din BMR för att få fram ditt totala dagliga
                  energibehov (TDEE). Olika PAL-system använder olika metoder för att beräkna detta
                  värde baserat på din aktivitetsnivå.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-neutral-800 font-medium text-center">TDEE = BMR × PAL</p>
                </div>
              </div>
            </div>

            {/* Why choose different systems */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                Varför finns det olika PAL-system?
              </h3>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Olika PAL-system är utvecklade för olika ändamål och målgrupper. Vissa är
                forskningsbaserade och konservativa, medan andra är mer detaljerade och tar hänsyn
                till specifika träningsformer och vardagsaktivitet.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                Välj det PAL-system som bäst matchar din livsstil och träningsnivå. Klicka på
                info-ikonen vid varje system för att läsa mer om dess fördelar och begränsningar.
              </p>
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
    </Portal>
  )
}
