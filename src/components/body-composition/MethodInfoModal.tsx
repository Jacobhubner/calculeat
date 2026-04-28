/**
 * MethodInfoModal - Modal för att visa information om beräkningsmetoder
 */

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { getMethodInfo, siriInfo, brozekInfo } from '@/lib/constants/methodInfo'
import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

interface MethodInfoModalProps {
  method: BodyCompositionMethod | 'siri' | 'brozek' | null
  variation?: MethodVariation
  open: boolean
  onClose: () => void
}

const methodLocaleKeyMap: Record<string, string> = {
  siri: 'siri',
  brozek: 'brozek',
  'Jackson/Pollock 3 Caliper Method (Male)': 'jp3',
  'Jackson/Pollock 3 Caliper Method (Female)': 'jp3',
  'Jackson/Pollock 4 Caliper Method': 'jp4',
  'Jackson/Pollock 7 Caliper Method': 'jp7',
  'Durnin/Womersley Caliper Method': 'durninWomersley',
  'Parillo Caliper Method': 'parillo',
  'Covert Bailey Measuring Tape Method': 'covertBailey',
  'U.S. Navy Body Fat Formula': 'usNavy',
  'YMCA Measuring Tape Method': 'ymca',
  'Modified YMCA Measuring Tape Method': 'ymcaModified',
  'Heritage BMI to Body Fat Method': 'heritage',
  'Reversed Cunningham equation': 'cunningham',
}

const genderLocaleKeyMap: Record<string, string> = {
  Män: 'male',
  Kvinnor: 'female',
  Båda: 'both',
}

export default function MethodInfoModal({
  method,
  variation,
  open,
  onClose,
}: MethodInfoModalProps) {
  const { t } = useTranslation('body')

  if (!open || !method) return null

  // Special handling for Siri and Brozek
  const info =
    method === 'siri'
      ? siriInfo
      : method === 'brozek'
        ? brozekInfo
        : getMethodInfo(method as BodyCompositionMethod, variation)

  if (!info) return null

  const localeKey = methodLocaleKeyMap[method] ?? null

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
              <h2 className="text-2xl font-bold">
                {localeKey
                  ? t(`methodInfo.${localeKey}.title`, { defaultValue: info.title })
                  : info.title}
              </h2>
              {info.year && <p className="text-primary-100 mt-1 text-sm">{info.year}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label={t('methodModal.closeAriaLabel')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Beskrivning */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                {t('methodModal.description')}
              </h3>
              <div className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {localeKey
                  ? t(`methodInfo.${localeKey}.description`, { defaultValue: info.description })
                  : info.description}
              </div>
            </div>

            {/* Returnerar densitet? */}
            {info.returnsDensity !== undefined && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  {info.returnsDensity ? (
                    <>
                      <span className="font-semibold">{t('methodModal.returnsDensityLabel')}</span>{' '}
                      {t('methodModal.returnsDensityNote')}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {t('methodModal.returnsFatDirectLabel')}
                      </span>{' '}
                      {t('methodModal.returnsFatDirectNote')}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Denna metod är bättre för */}
            {info.betterFor && info.betterFor.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  {t('methodModal.betterFor')}
                </h3>
                <ul className="space-y-2">
                  {info.betterFor.map((item, index) => {
                    const translated = localeKey
                      ? t(`methodInfo.${localeKey}.betterFor.${index}`, { defaultValue: item })
                      : item
                    return (
                      <li key={index} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1">•</span>
                        <span className="text-neutral-700 flex-1">{translated}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Viktigt att veta (för Siri och Brozek) */}
            {info.pros && info.pros.length > 0 && !info.betterFor && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">
                  {t('methodModal.importantToKnow')}
                </h3>
                <ul className="space-y-2">
                  {info.pros.map((item, index) => {
                    const translated = localeKey
                      ? t(`methodInfo.${localeKey}.pros.${index}`, { defaultValue: item })
                      : item
                    return (
                      <li key={index} className="flex gap-3">
                        <span className="text-amber-600 font-bold mt-1">•</span>
                        <span className="text-amber-900 flex-1">{translated}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Formelvariantar (strukturerade) */}
            {info.formulaVariants &&
              info.formulaVariants.length > 0 &&
              (() => {
                let maleCount = 0
                let femaleCount = 0
                return info.formulaVariants!.map((v, i) => {
                  if (v.gender === 'Män') ++maleCount
                  else if (v.gender === 'Kvinnor') ++femaleCount
                  const isFirstOfGender =
                    (v.gender === 'Män' && maleCount === 1) ||
                    (v.gender === 'Kvinnor' && femaleCount === 1)
                  return (
                    <div key={i}>
                      {isFirstOfGender && (
                        <h3 className="text-lg font-semibold text-neutral-800 mb-3 mt-2">
                          {t(`genderLabel.${genderLocaleKeyMap[v.gender] ?? 'both'}`, {
                            defaultValue: v.gender,
                          })}
                        </h3>
                      )}
                      <div className="mb-4">
                        {v.name && (
                          <p className="text-sm font-semibold text-neutral-600 mb-1">{v.name}</p>
                        )}
                        <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
                          <p className="font-mono text-sm text-neutral-800 whitespace-pre-line">
                            {v.equation}
                          </p>
                          <p className="font-mono text-xs text-neutral-500 mt-2 whitespace-pre-line">
                            {v.measurements}
                          </p>
                          {v.reference && (
                            <p className="text-xs text-neutral-400 mt-2 italic">
                              {t('methodModal.source')} {v.reference}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}

            {/* Formel (enkel, för Siri/Brozek) */}
            {info.formula && !info.formulaVariants && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  {t('methodModal.formula')}
                </h3>
                <div className="bg-neutral-50 text-neutral-800 font-mono text-sm px-4 py-3 rounded-lg border border-neutral-200 whitespace-pre-line">
                  {info.formula}
                </div>
              </div>
            )}

            {/* Referenser */}
            {info.references && info.references.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                  {t('methodModal.references')}
                </h3>
                <div className="space-y-3">
                  {info.references.map((ref, index) => (
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

            {/* Anteckningar (fallback för äldre metoder som inte använder nya strukturen) */}
            {info.notes && !info.pros && !info.cons && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <h4 className="font-semibold mb-1 text-amber-900 text-sm">
                  {t('methodModal.importantToKnow')}
                </h4>
                <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">
                  {info.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
            <Button onClick={onClose} className="w-full">
              {t('methodModal.close')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
