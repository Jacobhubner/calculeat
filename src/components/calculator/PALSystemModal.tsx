import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PAL_SYSTEM_DESCRIPTIONS, type PALFormulaVariant } from '@/lib/calculations/palDescriptions'
import type { PALSystem } from '@/lib/types'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

const PAL_KEY_MAP: Record<PALSystem, string> = {
  'FAO/WHO/UNU based PAL values': 'faoWhoUnu',
  'DAMNRIPPED PAL values': 'damnripped',
  'Pro Physique PAL values': 'proPhysique',
  'Fitness Stuff PAL values': 'fitnessStuff',
  'Basic internet PAL values': 'basicInternet',
  'Beräkna din aktivitetsnivå': 'advanced',
  'Custom PAL': 'customPAL',
}

interface PALSystemModalProps {
  system: PALSystem
  isOpen: boolean
  onClose: () => void
}

export default function PALSystemModal({ system, isOpen, onClose }: PALSystemModalProps) {
  const { t } = useTranslation('tools')
  if (!isOpen) return null

  const description = PAL_SYSTEM_DESCRIPTIONS[system]

  if (!description) return null

  const sk = PAL_KEY_MAP[system]
  const tName = t(`palSystems.${sk}.name`, { defaultValue: description.name })
  const tSubtitle = description.subtitle
    ? t(`palSystems.${sk}.subtitle`, { defaultValue: description.subtitle })
    : undefined
  const tDyn = t as unknown as (key: string, opts: object) => unknown
  const tPros = tDyn(`palSystems.${sk}.pros`, {
    returnObjects: true,
    defaultValue: description.pros,
  }) as string[]
  const tCons = tDyn(`palSystems.${sk}.cons`, {
    returnObjects: true,
    defaultValue: description.cons,
  }) as string[]
  const tBestFor = tDyn(`palSystems.${sk}.bestFor`, {
    returnObjects: true,
    defaultValue: description.bestFor,
  }) as string[]

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
              {tSubtitle && <p className="text-primary-100 mt-1">{tSubtitle}</p>}
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
              {description.descriptionBlocks ? (
                <div className="space-y-3">
                  {(() => {
                    const tBlocks = tDyn(`palSystems.${sk}.descriptionBlocks`, {
                      returnObjects: true,
                      defaultValue: [],
                    }) as string[]
                    const tBullets = tDyn(`palSystems.${sk}.descriptionBullets`, {
                      returnObjects: true,
                      defaultValue: [],
                    }) as string[]
                    const tImageAlt = tDyn(`palSystems.${sk}.descriptionImageAlt`, {
                      defaultValue: '',
                    }) as string
                    let textIdx = 0
                    let bulletsUsed = false
                    return description.descriptionBlocks!.map((block, i) =>
                      block.type === 'formula' ? (
                        <div
                          key={i}
                          className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3"
                        >
                          <p className="text-sm font-mono text-neutral-800">{block.text}</p>
                        </div>
                      ) : block.type === 'bullets' ? (
                        <ul key={i} className="space-y-1 pl-1">
                          {(bulletsUsed
                            ? block.items
                            : tBullets.length > 0
                              ? ((bulletsUsed = true), tBullets)
                              : ((bulletsUsed = true), block.items)
                          ).map((item, ii) => (
                            <li key={ii} className="flex gap-3">
                              <span className="text-neutral-400 font-bold mt-0.5">•</span>
                              <span className="text-neutral-700 text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : block.type === 'image' ? (
                        <img
                          key={i}
                          src={block.src}
                          alt={tImageAlt || block.alt}
                          className="w-3/4 rounded-xl border border-neutral-200"
                        />
                      ) : (
                        <p key={i} className="text-neutral-700 leading-relaxed text-sm">
                          {tBlocks[textIdx++] ?? block.text}
                        </p>
                      )
                    )
                  })()}
                </div>
              ) : (
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {t(`palSystems.${sk}.description`, { defaultValue: description.description })}
                </p>
              )}
            </div>

            {/* Best For */}
            {tBestFor && tBestFor.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  {t('tdeeCalc.modal.bestFor')}
                </h3>
                <ul className="space-y-2">
                  {tBestFor.map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <span className="text-neutral-700 flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

            {/* Sections */}
            {description.sections && description.sections.length > 0 && (
              <div className="space-y-6">
                {(() => {
                  const sectionKeys = [
                    'bmr',
                    'neat',
                    'neatSteps',
                    'neatStanding',
                    'neatHousehold',
                    'spa',
                    'eat',
                    'tef',
                  ]
                  return description.sections!.map((section, index) => {
                    const secKey = sectionKeys[index] ?? null
                    const tSecTitle = secKey
                      ? (tDyn(`palSystems.${sk}.sections.${secKey}.title`, {
                          defaultValue: section.title,
                        }) as string)
                      : section.title
                    const tSecBlocks = secKey
                      ? (tDyn(`palSystems.${sk}.sections.${secKey}.blocks`, {
                          returnObjects: true,
                          defaultValue: [],
                        }) as string[])
                      : []
                    const tSecFormula = secKey
                      ? (tDyn(`palSystems.${sk}.sections.${secKey}.formula`, {
                          defaultValue: '',
                        }) as string)
                      : ''
                    const tSecStepsBullets =
                      secKey === 'neatSteps'
                        ? (tDyn(`palSystems.${sk}.sections.${secKey}.stepsBullets`, {
                            returnObjects: true,
                            defaultValue: [],
                          }) as string[])
                        : []
                    const tSecSpaBullets =
                      secKey === 'spa'
                        ? (tDyn(`palSystems.${sk}.sections.${secKey}.spaBullets`, {
                            returnObjects: true,
                            defaultValue: [],
                          }) as string[])
                        : []
                    const tSecTefBullets =
                      secKey === 'tef'
                        ? (tDyn(`palSystems.${sk}.sections.${secKey}.tefBullets`, {
                            returnObjects: true,
                            defaultValue: [],
                          }) as string[])
                        : []
                    const tSecRefs = secKey
                      ? (tDyn(`palSystems.${sk}.sections.${secKey}.refs`, {
                          returnObjects: true,
                          defaultValue: section.references ?? [],
                        }) as string[])
                      : (section.references ?? [])

                    let textIdx = 0
                    let bulletsUsed = false

                    return (
                      <div key={index}>
                        <h3 className="text-lg font-semibold text-neutral-800 mb-3">{tSecTitle}</h3>
                        <div className="space-y-3">
                          {section.blocks.map((block, bi) =>
                            block.type === 'heading' ? (
                              <p key={bi} className="text-sm font-semibold text-neutral-700 mt-1">
                                {block.text}
                              </p>
                            ) : block.type === 'formula' ? (
                              <div
                                key={bi}
                                className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3"
                              >
                                <p className="text-sm font-mono text-neutral-800">
                                  {tSecFormula || block.text}
                                </p>
                              </div>
                            ) : block.type === 'bullets' ? (
                              <ul key={bi} className="space-y-1 pl-1">
                                {(() => {
                                  const bulletItems = bulletsUsed
                                    ? block.items
                                    : (() => {
                                        bulletsUsed = true
                                        if (tSecStepsBullets.length > 0) return tSecStepsBullets
                                        if (tSecSpaBullets.length > 0) return tSecSpaBullets
                                        if (tSecTefBullets.length > 0) return tSecTefBullets
                                        return block.items
                                      })()
                                  return bulletItems.map((item, ii) => (
                                    <li key={ii} className="flex gap-2 text-neutral-700 text-sm">
                                      <span className="text-neutral-400 mt-0.5">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))
                                })()}
                              </ul>
                            ) : block.type === 'image' ? (
                              <img
                                key={bi}
                                src={block.src}
                                alt={block.alt}
                                className="w-3/5 rounded-lg mt-2"
                              />
                            ) : (
                              <p
                                key={bi}
                                className="text-neutral-700 leading-relaxed text-sm whitespace-pre-line"
                              >
                                {tSecBlocks[textIdx++] ?? block.text}
                              </p>
                            )
                          )}
                        </div>
                        {tSecRefs.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              {t('tdeeCalc.modal.references')}
                            </p>
                            {tSecRefs.map((ref, ri) => (
                              <div
                                key={ri}
                                className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200"
                              >
                                <p className="leading-relaxed">{ref}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            )}

            {/* Formula variants */}
            {description.formulaVariants && description.formulaVariants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                  {t('tdeeCalc.modal.palValues')}
                </h3>
                {(() => {
                  const tVariants = tDyn(`palSystems.${sk}.formulaVariants`, {
                    returnObjects: true,
                    defaultValue: [],
                  }) as Array<{
                    name?: string
                    rows?: string[][]
                    equation?: string
                    measurements?: string
                  }>
                  return (
                    <div className="space-y-4">
                      {description.formulaVariants.map((v: PALFormulaVariant, i: number) => {
                        const tv = tVariants[i] ?? {}
                        const tName = tv.name ?? v.name
                        const tRows = tv.rows ?? v.rows
                        const tEquation = tv.equation ?? v.equation
                        const tMeasurements = tv.measurements ?? v.measurements
                        return (
                          <div key={i}>
                            {tName && (
                              <p className="text-sm font-semibold text-neutral-600 mb-1">{tName}</p>
                            )}
                            {tRows ? (
                              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                                <table className="w-full text-sm">
                                  <tbody>
                                    {tRows.map((row, ri) => (
                                      <tr
                                        key={ri}
                                        className={
                                          ri === 0 && row[0] === ''
                                            ? 'bg-neutral-100 text-neutral-500 font-medium'
                                            : ri % 2 === 0
                                              ? 'bg-white'
                                              : 'bg-neutral-50'
                                        }
                                      >
                                        {row.map((cell, ci) => (
                                          <td
                                            key={ci}
                                            className={`px-3 py-1.5 ${ci === 0 ? 'text-neutral-700' : 'text-neutral-800 font-mono text-right'}`}
                                          >
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : tEquation ? (
                              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                                <p className="text-sm font-mono text-neutral-800 whitespace-pre-line">
                                  {tEquation}
                                </p>
                              </div>
                            ) : null}
                            {tMeasurements && (
                              <p className="text-xs text-neutral-500 mt-1 whitespace-pre-line">
                                {tMeasurements}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* References */}
            {description.references && description.references.length > 0 && (
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
                      <p className="leading-relaxed">{ref}</p>
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
