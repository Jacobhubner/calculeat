import { useTranslation } from 'react-i18next'

interface FFMIMetricsCardProps {
  ffmi: number | null
  normalizedFFMI: number | null
  leanBodyMass: number
  category: string
}

export function FFMIMetricsCard({
  ffmi,
  normalizedFFMI,
  leanBodyMass,
  category,
}: FFMIMetricsCardProps) {
  const { t } = useTranslation('body')

  if (!ffmi || !normalizedFFMI) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-neutral-850 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-neutral-100">
          <span className="text-orange-600 dark:text-orange-300">Fat Fri Mass Index</span> (FFMI)
        </h3>
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          {t('ffmiCard.noHeightMessage')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:bg-neutral-850 dark:border-neutral-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
          <span className="text-orange-600 dark:text-orange-300">Fat Fri Mass Index</span> (FFMI)
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {/* FFMI and Normalized FFMI */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 text-center dark:bg-green-900/25">
            <div className="text-xs text-gray-600 font-medium mb-1 dark:text-neutral-400">
              FFMI:
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-300">
              {ffmi.toFixed(1)}
            </div>
          </div>

          <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 text-center dark:bg-green-900/25">
            <div className="text-xs text-gray-600 font-medium mb-1 dark:text-neutral-400">
              {t('ffmiCard.normalized')}
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-300">
              {normalizedFFMI.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Lean Body Mass */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center dark:bg-neutral-800 dark:border-neutral-600">
          <div className="text-xs text-gray-600 font-medium mb-1 dark:text-neutral-400">
            {t('ffmiCard.leanBodyMass')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            {leanBodyMass.toFixed(1)} kg
          </div>
        </div>

        {/* Category */}
        {category && category !== 'Unknown' && (
          <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              {t('ffmiCard.category')}{' '}
              <span className="font-semibold text-gray-900 dark:text-neutral-100">{category}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
