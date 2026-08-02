import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BMR_FORMULA_DESCRIPTIONS,
  type BMRFormulaVariant,
} from '@/lib/calculations/bmrDescriptions'
import type { BMRFormula } from '@/lib/types'
import { InfoModal } from '@/components/ui/InfoModal'
import { EquationGate } from '@/components/premium/EquationGate'
import { PUBLIC_EQUATION_BMR_FORMULAS } from '@/lib/constants/entitlements'

// Ekvationer som är publika på hemsidan (artiklarnas FAQ) låses aldrig i
// appen — det som framgår gratis publikt ska framgå gratis här (2026-07-18)
function MaybeEquationGate({ locked, children }: { locked: boolean; children: ReactNode }) {
  if (!locked) return <>{children}</>
  return <EquationGate feature="all_tdee_formulas">{children}</EquationGate>
}

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
    <InfoModal
      open
      onClose={onClose}
      title={tName}
      subtitle={t('tdeeCalc.modal.developed', { year: description.year, type: description.type })}
    >
      <div className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2 dark:text-neutral-200">
            {t('tdeeCalc.modal.description')}
          </h3>
          <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">{tDescription}</p>
        </div>

        {/* Pros */}
        <div>
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2 dark:text-green-300">
            <span className="text-xl">✓</span>
            {t('tdeeCalc.modal.pros')}
          </h3>
          <ul className="space-y-2">
            {tPros.map((pro, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-green-600 font-bold mt-1 dark:text-green-300">•</span>
                <span className="text-neutral-700 flex-1 dark:text-neutral-200">{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        {tCons.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2 dark:text-amber-300">
              <span className="text-xl">⚠</span>
              {t('tdeeCalc.modal.cons')}
            </h3>
            <ul className="space-y-2">
              {tCons.map((con, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-amber-600 font-bold mt-1 dark:text-amber-300">•</span>
                  <span className="text-neutral-700 flex-1 dark:text-neutral-200">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formula variants — exakta ekvationer är premium (EquationGate) */}
        {description.formulaVariants && description.formulaVariants.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 dark:text-neutral-200">
              {t('tdeeCalc.modal.formula')}
            </h3>
            <MaybeEquationGate locked={!PUBLIC_EQUATION_BMR_FORMULAS.includes(formula)}>
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
                          <h3 className="text-lg font-semibold text-neutral-800 mb-3 mt-2 dark:text-neutral-200">
                            {genderLabel}
                          </h3>
                        )}
                        <div className="mb-4">
                          {v.name && (
                            <p className="text-sm font-semibold text-neutral-600 mb-1 dark:text-neutral-400">
                              {v.name}
                            </p>
                          )}
                          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 dark:border-neutral-700 dark:bg-neutral-900">
                            <p className="text-sm font-mono text-neutral-800 whitespace-pre-line dark:text-neutral-200">
                              {v.equation}
                            </p>
                          </div>
                          {measurements && (
                            <p className="text-xs text-neutral-500 mt-1 whitespace-pre-line dark:text-neutral-400">
                              {measurements}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </MaybeEquationGate>
          </div>
        )}

        {/* References */}
        {description.references.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 dark:text-neutral-200">
              {t('tdeeCalc.modal.references')}
            </h3>
            <div className="space-y-3">
              {description.references.map((ref, index) => (
                <div
                  key={index}
                  className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  <p className="leading-relaxed break-all">{ref}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </InfoModal>
  )
}
