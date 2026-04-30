import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  BMR_FORMULA_DESCRIPTIONS,
  type BMRFormulaVariant,
} from '@/lib/calculations/bmrDescriptions'
import type { BMRFormula } from '@/lib/types'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

const FORMULA_KEY_MAP: Record<BMRFormula, string> = {
  'Mifflin-St Jeor equation': 'mifflinStJeor',
  'Cunningham equation': 'cunningham',
  'Oxford/Henry equation': 'oxfordHenry',
  'Schofield equation': 'schofield',
  'Revised Harris-Benedict equation': 'revisedHarrisBenedict',
  'Original Harris-Benedict equation': 'originalHarrisBenedict',
  'MacroFactor standard equation': 'macroFactorStandard',
  'MacroFactor FFM equation': 'macroFactorFFM',
  'MacroFactor athlete equation': 'macroFactorAthlete',
  'Fitness Stuff Podcast equation': 'fitnessStuffPodcast',
}

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

  const fk = FORMULA_KEY_MAP[formula]
  const tName = t(`bmrFormulas.${fk}.name`, { defaultValue: description.name })
  const tDescription = t(`bmrFormulas.${fk}.description`, { defaultValue: description.description })
  const tDyn = t as unknown as (key: string, opts: object) => unknown
  const tPros = tDyn(`bmrFormulas.${fk}.pros`, {
    returnObjects: true,
    defaultValue: description.pros,
  }) as string[]
  const tCons = tDyn(`bmrFormulas.${fk}.cons`, {
    returnObjects: true,
    defaultValue: description.cons,
  }) as string[]

  const getMeasurements = (v: BMRFormulaVariant, index: number): string => {
    if (v.gender === 'Män')
      return t(`bmrFormulas.${fk}.measurements_male`, { defaultValue: v.measurements ?? '' })
    if (v.gender === 'Kvinnor') {
      const key =
        description.formulaVariants &&
        description.formulaVariants.filter(fv => fv.gender === 'Kvinnor').indexOf(v) === 0
          ? 'measurements_female'
          : `measurements_female_${index}`
      return t(`bmrFormulas.${fk}.${key}`, { defaultValue: v.measurements ?? '' })
    }
    return t(`bmrFormulas.${fk}.measurements`, { defaultValue: v.measurements ?? '' })
  }

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
              <h2 className="text-2xl font-bold">{tName}</h2>
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
              <p className="text-neutral-700 leading-relaxed">{tDescription}</p>
            </div>

            {/* Pros */}
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <span className="text-xl">✓</span>
                {t('tdeeCalc.modal.pros')}
              </h3>
              <ul className="space-y-2">
                {tPros.map((pro, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-green-600 font-bold mt-1">•</span>
                    <span className="text-neutral-700 flex-1">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            {tCons.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠</span>
                  {t('tdeeCalc.modal.cons')}
                </h3>
                <ul className="space-y-2">
                  {tCons.map((con, index) => (
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
                      const genderLabel =
                        v.gender === 'Män'
                          ? t('bmrFormulas.genderMale')
                          : v.gender === 'Kvinnor'
                            ? t('bmrFormulas.genderFemale')
                            : t('bmrFormulas.genderBoth')
                      const measurements = getMeasurements(v, i)
                      return (
                        <div key={i}>
                          {isFirstOfGender && (
                            <h3 className="text-lg font-semibold text-neutral-800 mb-3 mt-2">
                              {genderLabel}
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
                            {measurements && (
                              <p className="text-xs text-neutral-500 mt-1 whitespace-pre-line">
                                {measurements}
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
