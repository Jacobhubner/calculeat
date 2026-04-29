import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  BMR_FORMULA_DESCRIPTIONS,
  type BMRFormulaVariant,
} from '@/lib/calculations/bmrDescriptions'
import type { BMRFormula } from '@/lib/types'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

interface BMRFormulaModalProps {
  formula: BMRFormula
  isOpen: boolean
  onClose: () => void
}

export default function BMRFormulaModal({ formula, isOpen, onClose }: BMRFormulaModalProps) {
  const { t } = useTranslation('tools')
  if (!isOpen) return null

  const description = BMR_FORMULA_DESCRIPTIONS[formula]

  if (!description) return null

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
              <h2 className="text-2xl font-bold">{description.name}</h2>
              <p className="text-primary-100 mt-1">
                {t('tdeeCalc.modal.developed', { year: description.year, type: description.type })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label={t('tdeeCalc.modal.closeAriaLabel')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                {t('tdeeCalc.modal.description')}
              </h3>
              <p className="text-neutral-700 leading-relaxed">{description.description}</p>
            </div>

            {/* Pros */}
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <span className="text-xl">✓</span>
                {t('tdeeCalc.modal.pros')}
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
                  {t('tdeeCalc.modal.cons')}
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

            {/* Formula variants */}
            {description.formulaVariants && description.formulaVariants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                  {t('tdeeCalc.modal.formula')}
                </h3>
                <div className="space-y-4">
                  {(() => {
                    let maleCount = 0
                    let femaleCount = 0
                    return description.formulaVariants!.map((v: BMRFormulaVariant, i: number) => {
                      if (v.gender === 'Män') ++maleCount
                      else if (v.gender === 'Kvinnor') ++femaleCount
                      const isFirstOfGender =
                        (v.gender === 'Män' && maleCount === 1) ||
                        (v.gender === 'Kvinnor' && femaleCount === 1)
                      return (
                        <div key={i}>
                          {isFirstOfGender && (
                            <h3 className="text-lg font-semibold text-neutral-800 mb-3 mt-2">
                              {v.gender}
                            </h3>
                          )}
                          <div className="mb-4">
                            {v.name && (
                              <p className="text-sm font-semibold text-neutral-600 mb-1">
                                {v.name}
                              </p>
                            )}
                            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                              <p className="text-sm font-mono text-neutral-800 whitespace-pre-line">
                                {v.equation}
                              </p>
                            </div>
                            {v.measurements && (
                              <p className="text-xs text-neutral-500 mt-1 whitespace-pre-line">
                                {v.measurements}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {/* References */}
            {description.references.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                  {t('tdeeCalc.modal.references')}
                </h3>
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
              {t('tdeeCalc.modal.close')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
