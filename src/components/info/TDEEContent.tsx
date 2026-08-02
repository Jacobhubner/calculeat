/**
 * TDEE Information Content
 */
import { useTranslation } from 'react-i18next'

export default function TDEEContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('tdee.section1Title')}
        </h3>
        <p>
          <strong>TDEE (Total Daily Energy Expenditure)</strong> {t('tdee.section1Intro')}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 dark:bg-blue-900/25 dark:border-blue-800">
          <p className="font-medium text-center text-lg">{t('tdee.section1Formula')}</p>
        </div>
        <p className="mt-3">{t('tdee.section1Outro')}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('tdee.section2Title')}
        </h3>
        <p className="mb-3">{t('tdee.section2Intro')}</p>

        <div className="space-y-3">
          <div className="bg-neutral-50 border-l-4 border-primary-500 p-4 dark:bg-neutral-900">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {t('tdee.comp1Title')}
            </p>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
              <strong>{t('tdee.comp1Label')}</strong> {t('tdee.comp1Text')}
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-orange-500 p-4 dark:bg-neutral-900">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {t('tdee.comp2Title')}
            </p>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
              <strong>{t('tdee.comp2Label')}</strong> {t('tdee.comp2Text')}
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-success-500 p-4 dark:bg-neutral-900">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {t('tdee.comp3Title')}
            </p>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
              <strong>{t('tdee.comp3Label')}</strong> {t('tdee.comp3Text')}
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-accent-500 p-4 dark:bg-neutral-900">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {t('tdee.comp4Title')}
            </p>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
              <strong>{t('tdee.comp4Label')}</strong> {t('tdee.comp4Text')}
            </p>
          </div>
        </div>
        <img src="/TDEE.png" alt={t('tdee.tdeeImageAlt')} className="w-3/5 rounded-lg mt-4" />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('tdee.section3Title')}
        </h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/25 dark:border-green-800">
            <p className="font-medium text-green-900 dark:text-green-300">
              {t('tdee.maintainTitle')}
            </p>
            <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-200">
              {t('tdee.maintainText')}
            </p>
            <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
              {t('tdee.maintainNote')}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 dark:bg-orange-900/25 dark:border-orange-800">
            <p className="font-medium text-orange-900 dark:text-orange-300">
              {t('tdee.cuttingTitle')}
            </p>
            <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-200">
              {t('tdee.cuttingText')}
            </p>
            <ul className="text-sm text-neutral-600 mt-2 space-y-1 list-disc list-inside dark:text-neutral-400">
              <li>{t('tdee.cuttingItem1')}</li>
              <li>{t('tdee.cuttingItem2')}</li>
              <li>{t('tdee.cuttingItem3')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/25 dark:border-blue-800">
            <p className="font-medium text-blue-900 dark:text-blue-300">{t('tdee.bulkingTitle')}</p>
            <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-200">
              {t('tdee.bulkingText')}
            </p>
            <ul className="text-sm text-neutral-600 mt-2 space-y-1 list-disc list-inside dark:text-neutral-400">
              <li>{t('tdee.bulkingItem1')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('tdee.section4Title')}
        </h3>
        <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-200">
          <li>
            <strong>{t('tdee.tip1Label')}</strong> {t('tdee.tip1Text')}
          </li>
          <li>
            <strong>{t('tdee.tip2Label')}</strong> {t('tdee.tip2Text')}
          </li>
          <li>
            <strong>{t('tdee.tip3Label')}</strong> {t('tdee.tip3Text')}
          </li>
          <li>
            <strong>{t('tdee.tip4Label')}</strong> {t('tdee.tip4Text')}
          </li>
        </ul>
      </section>
    </div>
  )
}
