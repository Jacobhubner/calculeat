import { useTranslation } from 'react-i18next'

export default function FFMIContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-6 text-neutral-700">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">{t('ffmi.section1Title')}</h3>
        <p>
          <strong>Fat Free Mass Index (FFMI)</strong> {t('ffmi.section1Intro')}
        </p>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">{t('ffmi.section2Title')}</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="bg-neutral-50 border border-blue-200 rounded-lg p-3">
            <code className="text-sm">{t('ffmi.section2Formula')}</code>
          </div>
          <p>
            {t('ffmi.section2Note')} <code>{t('ffmi.section2NoteCode')}</code>
          </p>
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">{t('ffmi.section3Title')}</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>{t('ffmi.section3Item1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>{t('ffmi.section3Item2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>{t('ffmi.section3Item3')}</span>
          </li>
        </ul>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">{t('ffmi.section4Title')}</h4>
        <p className="text-sm text-amber-800">{t('ffmi.section4Text')}</p>
      </section>
    </div>
  )
}
