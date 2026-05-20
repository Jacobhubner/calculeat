import { useTranslation } from 'react-i18next'

interface Props {
  bmr: number
  tdee: number
}

export function TDEEScenarioCard({ bmr, tdee }: Props) {
  const { t } = useTranslation('dashboard')

  const scenarios: { labelKey: string; d: number; atMaxKey?: string }[] = [
    { labelKey: 'tdeeScenarios.walk', d: 210 },
    { labelKey: 'tdeeScenarios.stand', d: 385 },
    {
      labelKey: 'tdeeScenarios.mostActive',
      d: Math.round(bmr * 1.5 + 600 - tdee),
      atMaxKey: 'tdeeScenarios.alreadyAtMax',
    },
    { labelKey: 'tdeeScenarios.leastActive', d: Math.round(bmr + 150 - tdee) },
  ]

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {t('tdeeScenarios.titleBefore')}
        <span className="text-primary-600">{tdee}</span>
        {t('tdeeScenarios.titleAfter')}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {scenarios.map(({ labelKey, d, atMaxKey }) => {
          const positive = d >= 0
          const bgClass = positive ? 'bg-green-50' : 'bg-red-50'
          const textClass = positive ? 'text-green-700' : 'text-red-600'
          const borderClass = positive ? 'border-green-100' : 'border-red-100'
          const arrow = positive ? '⇧' : '⇩'
          return (
            <div
              key={labelKey}
              className={`flex flex-col gap-1.5 rounded-xl border ${borderClass} ${bgClass} px-3 py-3`}
            >
              <p className="text-xs leading-snug text-neutral-500">{t(labelKey)}</p>
              <p className={`text-lg font-bold leading-none ${textClass}`}>
                {arrow} {Math.abs(d)}
                <span className="ml-0.5 text-xs font-medium">kcal</span>
              </p>
              {d === 0 && atMaxKey && <p className="text-xs text-neutral-400">{t(atMaxKey)}</p>}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-right text-xs italic text-neutral-300">{t('tdeeScenarios.source')}</p>
    </div>
  )
}
