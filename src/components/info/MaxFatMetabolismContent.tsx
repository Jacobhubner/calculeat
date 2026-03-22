import { useTranslation } from 'react-i18next'

export default function MaxFatMetabolismContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-6 text-neutral-700">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">
          {t('maxFatMetabolism.section1Title')}
        </h3>
        <p className="mb-4">{t('maxFatMetabolism.section1P1')}</p>
        <p className="mb-4">{t('maxFatMetabolism.section1P2')}</p>
        <p>{t('maxFatMetabolism.section1P3')}</p>
      </section>

      <section className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-2">{t('maxFatMetabolism.notTitle')}</h4>
        <ul className="text-sm text-red-800 space-y-1 ml-4">
          <li>{t('maxFatMetabolism.notItem1')}</li>
          <li>{t('maxFatMetabolism.notItem2')}</li>
          <li>{t('maxFatMetabolism.notItem3')}</li>
          <li>{t('maxFatMetabolism.notItem4')}</li>
        </ul>
        <p className="text-sm text-red-800 mt-3">
          <strong>{t('maxFatMetabolism.isLabel')}</strong> {t('maxFatMetabolism.isText')}
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">
          {t('maxFatMetabolism.sourcesTitle')}
        </h4>
        <div className="text-xs text-neutral-600 space-y-2">
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
