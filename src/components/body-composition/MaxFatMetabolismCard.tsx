import { useTranslation } from 'react-i18next'

interface MaxFatMetabolismCardProps {
  maxFatKcal: number | null
  percentOfTDEE: number | null
}

export function MaxFatMetabolismCard({ maxFatKcal, percentOfTDEE }: MaxFatMetabolismCardProps) {
  const { t } = useTranslation('body')

  if (!maxFatKcal || !percentOfTDEE) {
    return null // Don't render if no data
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          <span className="text-orange-600">{t('maxFat.title')}</span>
        </h3>
      </div>

      <div className="p-6">
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-baseline justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{t('maxFat.deficit', { value: maxFatKcal })}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{t('maxFat.tdeePercent', { value: percentOfTDEE })}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            {t('maxFat.description')}
          </p>
        </div>
      </div>
    </div>
  )
}
