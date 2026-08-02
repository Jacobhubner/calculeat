import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { InfoModal } from '@/components/ui/InfoModal'
import { EquationGate } from '@/components/premium/EquationGate'

interface Props {
  bmr: number
  tdee: number
}

export function TDEEScenarioCard({ bmr, tdee }: Props) {
  const { t } = useTranslation('dashboard')
  const [showModal, setShowModal] = useState(false)

  const scenarios: { labelKey: string; d: number; atMaxKey?: string; formulaKey: string }[] = [
    { labelKey: 'tdeeScenarios.walk', d: 210, formulaKey: 'walk' },
    { labelKey: 'tdeeScenarios.stand', d: 385, formulaKey: 'stand' },
    {
      labelKey: 'tdeeScenarios.mostActive',
      d: Math.round(bmr * 1.5 + 600 - tdee),
      atMaxKey: 'tdeeScenarios.alreadyAtMax',
      formulaKey: 'mostActive',
    },
    {
      labelKey: 'tdeeScenarios.leastActive',
      d: Math.round(bmr + 150 - tdee),
      formulaKey: 'leastActive',
    },
  ]

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 px-5 py-4 shadow-sm dark:shadow-black/30 relative">
      <button
        onClick={() => setShowModal(true)}
        className="absolute top-4 right-4 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        aria-label={t('tdeeScenarios.infoTitle')}
      >
        <Info className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
      </button>

      <p className="mb-4 pr-6 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {t('tdeeScenarios.titleBefore')}
        <span className="font-bold text-primary-600 dark:text-primary-300">{tdee} kcal</span>
        {t('tdeeScenarios.titleAfterShort')}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {scenarios.map(({ labelKey, d, atMaxKey }) => {
          const positive = d >= 0
          const bgClass = positive
            ? 'bg-green-50 dark:bg-green-900/25'
            : 'bg-red-50 dark:bg-red-900/25'
          const textClass = positive
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-600 dark:text-red-300'
          const borderClass = positive
            ? 'border-green-100 dark:border-green-800'
            : 'border-red-100 dark:border-red-800'
          const arrow = positive ? '⇧' : '⇩'
          return (
            <div
              key={labelKey}
              className={`flex flex-col gap-1.5 rounded-xl border ${borderClass} ${bgClass} px-3 py-3`}
            >
              <p className="text-xs leading-snug text-neutral-500 dark:text-neutral-400">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t(labelKey as any)}
              </p>
              <p className={`text-lg font-bold leading-none ${textClass}`}>
                {arrow} {Math.abs(d)}
                <span className="ml-0.5 text-xs font-medium">kcal</span>
              </p>
              {d === 0 && atMaxKey && (
                <p className="text-xs text-neutral-400 dark:text-neutral-400">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(atMaxKey as any)}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-right text-xs italic text-neutral-300 dark:text-neutral-500">
        {t('tdeeScenarios.source')}
      </p>

      <InfoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('tdeeScenarios.infoModalTitle')}
      >
        <div className="space-y-6">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('tdeeScenarios.infoIntro')}
          </p>

          {(
            [
              ['formulaWalkTitle', 'formulaWalk'],
              ['formulaStandTitle', 'formulaStand'],
              ['formulaMostActiveTitle', 'formulaMostActive'],
              ['formulaLeastActiveTitle', 'formulaLeastActive'],
            ] as const
          ).map(([titleKey, formulaKey]) => (
            <section key={formulaKey}>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t(`tdeeScenarios.${titleKey}` as any)}
              </h3>
              <EquationGate feature="all_tdee_formulas">
                <div className="bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-mono text-sm px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 whitespace-pre-line">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`tdeeScenarios.${formulaKey}` as any)}
                </div>
              </EquationGate>
            </section>
          ))}
        </div>
      </InfoModal>
    </div>
  )
}
