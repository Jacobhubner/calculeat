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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <span className="text-orange-600">Fat Fri Mass Index</span> (FFMI)
        </h3>
        <p className="text-sm text-gray-600">
          {t('ffmiCard.noHeightMessage')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          <span className="text-orange-600">Fat Fri Mass Index</span> (FFMI)
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {/* FFMI and Normalized FFMI */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-600 font-medium mb-1">FFMI:</div>
            <div className="text-3xl font-bold text-green-900">{ffmi.toFixed(1)}</div>
          </div>

          <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-600 font-medium mb-1">{t('ffmiCard.normalized')}</div>
            <div className="text-3xl font-bold text-green-900">{normalizedFFMI.toFixed(1)}</div>
          </div>
        </div>

        {/* Lean Body Mass */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-600 font-medium mb-1">{t('ffmiCard.leanBodyMass')}</div>
          <div className="text-2xl font-bold text-gray-900">{leanBodyMass.toFixed(1)} kg</div>
        </div>

        {/* Category */}
        {category && category !== 'Unknown' && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('ffmiCard.category')} <span className="font-semibold text-gray-900">{category}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
