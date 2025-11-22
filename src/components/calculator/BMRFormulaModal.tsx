import { X } from 'lucide-react'
import { BMR_FORMULA_DESCRIPTIONS } from '@/lib/calculations/bmrDescriptions'
import type { BMRFormula } from '@/lib/types'
import { Button } from '../ui/button'

interface BMRFormulaModalProps {
  formula: BMRFormula
  isOpen: boolean
  onClose: () => void
}

export default function BMRFormulaModal({ formula, isOpen, onClose }: BMRFormulaModalProps) {
  if (!isOpen) return null

  const description = BMR_FORMULA_DESCRIPTIONS[formula]

  if (!description) return null

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
            <h2 className="text-2xl font-bold">{description.name}</h2>
            <p className="text-primary-100 mt-1">Utvecklad {description.year}</p>
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
            <p className="text-neutral-700 leading-relaxed">{description.description}</p>
          </div>

          {/* Pros */}
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span className="text-xl">✓</span>
              Fördelar
            </h3>
            <ul className="space-y-2">
              {description.pros.map((pro, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span className="text-neutral-700 flex-1">{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          {description.cons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠</span>
                Nackdelar / Begränsningar
              </h3>
              <ul className="space-y-2">
                {description.cons.map((con, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-amber-600 font-bold mt-1">•</span>
                    <span className="text-neutral-700 flex-1">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* References */}
          {description.references.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">Referenser</h3>
              <div className="space-y-3">
                {description.references.map((ref, index) => (
                  <div
                    key={index}
                    className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200"
                  >
                    {ref.startsWith('http') ? (
                      <a
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 hover:underline break-all"
                      >
                        {ref}
                      </a>
                    ) : (
                      <p className="leading-relaxed">{ref}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
