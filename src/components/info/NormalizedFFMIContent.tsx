import { useTranslation } from 'react-i18next'

export default function NormalizedFFMIContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-6 text-neutral-700">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">
          {t('normalizedFFMI.section1Title')}
        </h3>
        <p>
          <strong>Normaliserad FFMI</strong> {t('normalizedFFMI.section1Intro')}
        </p>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">{t('normalizedFFMI.section2Title')}</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="bg-neutral-50 border border-blue-200 rounded-lg p-3">
            <code className="text-sm">{t('normalizedFFMI.section2Formula')}</code>
          </div>
          <p>{t('normalizedFFMI.section2Note')}</p>
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">{t('normalizedFFMI.section3Title')}</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              <strong>{t('normalizedFFMI.section3Item1Label')}</strong>{' '}
              {t('normalizedFFMI.section3Item1Text')}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              <strong>{t('normalizedFFMI.section3Item2Label')}</strong>{' '}
              {t('normalizedFFMI.section3Item2Text')}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              {t('normalizedFFMI.section3Item3Text')}{' '}
              <strong>{t('normalizedFFMI.section3Item3Bold')}</strong>{' '}
              {t('normalizedFFMI.section3Item3Suffix')}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">{t('normalizedFFMI.section4Title')}</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>{t('normalizedFFMI.section4Item1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>{t('normalizedFFMI.section4Item2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>{t('normalizedFFMI.section4Item3')}</span>
          </li>
        </ul>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">{t('normalizedFFMI.section5Title')}</h4>
        <p className="text-sm text-amber-800">{t('normalizedFFMI.section5Text')}</p>
      </section>
    </div>
  )
}
