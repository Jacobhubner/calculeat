/**
 * BMR vs RMR Information Content
 */
import { useTranslation } from 'react-i18next'

export default function BMRvsRMRContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('bmrVsRmr.section1Title')}
        </h3>
        <p>
          <strong>BMR och RMR</strong> {t('bmrVsRmr.section1Intro')}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 dark:bg-blue-900/25 dark:border-blue-800">
          <p className="font-medium text-center text-neutral-900 dark:text-neutral-100">
            {t('bmrVsRmr.section1Box')}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('bmrVsRmr.section2Title')}
        </h3>
        <p>
          <strong>BMR</strong> {t('bmrVsRmr.section2Intro')}
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3 space-y-2 dark:bg-green-900/25 dark:border-green-800">
          <p className="font-medium text-neutral-800 dark:text-neutral-200">
            {t('bmrVsRmr.section2BoxTitle')}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700 dark:text-neutral-200">
            <li>{t('bmrVsRmr.section2Item1')}</li>
            <li>{t('bmrVsRmr.section2Item2')}</li>
            <li>{t('bmrVsRmr.section2Item3')}</li>
            <li>{t('bmrVsRmr.section2Item4')}</li>
            <li>{t('bmrVsRmr.section2Item5')}</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('bmrVsRmr.section3Title')}
        </h3>
        <p>
          <strong>RMR</strong> {t('bmrVsRmr.section3Intro')}
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mt-3 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="font-medium text-center text-neutral-900 dark:text-neutral-100">
            {t('bmrVsRmr.section3Box')}
          </p>
        </div>
        <p className="mt-3 text-neutral-900 dark:text-neutral-100">
          {t('bmrVsRmr.section3UsedIn')}
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-200">
          <li>{t('bmrVsRmr.section3Item1')}</li>
          <li>{t('bmrVsRmr.section3Item2')}</li>
          <li>{t('bmrVsRmr.section3Item3')}</li>
          <li>{t('bmrVsRmr.section3Item4')}</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('bmrVsRmr.section4Title')}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/25 dark:border-blue-800">
            <p className="font-medium text-blue-900 mb-2 dark:text-blue-300">
              {t('bmrVsRmr.section4RmrTitle')}
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-neutral-700 dark:text-neutral-200">
              <li>Mifflin–St Jeor</li>
              <li>Cunningham</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/25 dark:border-green-800">
            <p className="font-medium text-neutral-900 mb-2 dark:text-neutral-100">
              {t('bmrVsRmr.section4BmrTitle')}
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-neutral-700 dark:text-neutral-200">
              <li>Harris–Benedict (original &amp; revised)</li>
              <li>Schofield</li>
              <li>Henry (Oxford)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
