import { useTranslation } from 'react-i18next'
import { EquationGate } from '@/components/premium/EquationGate'

export default function MaxFatMetabolismContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-6 text-neutral-700 dark:text-neutral-200">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3 dark:text-neutral-100">
          {t('maxFatMetabolism.section1Title')}
        </h3>
        <p className="mb-4">{t('maxFatMetabolism.section1P1')}</p>
        <p className="mb-4">{t('maxFatMetabolism.section1P2')}</p>
        <p>{t('maxFatMetabolism.section1P3')}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3 dark:text-neutral-100">
          {t('maxFatMetabolism.formulaTitle')}
        </h3>
        <EquationGate feature="all_tdee_formulas">
          <div className="bg-neutral-50 text-neutral-800 font-mono text-sm px-4 py-3 rounded-lg border border-neutral-200 whitespace-pre-line dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
            {t('maxFatMetabolism.formula')}
          </div>
        </EquationGate>
      </section>

      <section className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/25 dark:border-red-800">
        <h4 className="font-semibold text-red-900 mb-2 dark:text-red-300">
          {t('maxFatMetabolism.notTitle')}
        </h4>
        <ul className="text-sm text-red-800 space-y-1 ml-4 dark:text-red-300">
          <li>{t('maxFatMetabolism.notItem1')}</li>
          <li>{t('maxFatMetabolism.notItem2')}</li>
          <li>{t('maxFatMetabolism.notItem3')}</li>
          <li>{t('maxFatMetabolism.notItem4')}</li>
        </ul>
        <p className="text-sm text-red-800 mt-3 dark:text-red-300">
          <strong>{t('maxFatMetabolism.isLabel')}</strong> {t('maxFatMetabolism.isText')}
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2 dark:text-neutral-100">
          {t('maxFatMetabolism.sourcesTitle')}
        </h4>
        <div className="text-xs text-neutral-600 space-y-2 dark:text-neutral-400">
          <p>
            <strong>{t('maxFatMetabolism.sourcesScientificLabel')}</strong>{' '}
            {t('maxFatMetabolism.sourcesScientificText')}
          </p>
          <p>
            <strong>{t('maxFatMetabolism.sourcesPracticalLabel')}</strong>{' '}
            {t('maxFatMetabolism.sourcesPracticalText')}
          </p>
        </div>
      </section>
    </div>
  )
}
