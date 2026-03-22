/**
 * PAL vs MET Information Content
 */
import { useTranslation } from 'react-i18next'

export default function PALvsMETContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section1Title')}
        </h3>
        <p>
          <strong>PAL och MET</strong> {t('palVsMet.section1Intro')}
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section2Title')}
        </h3>
        <p>
          <strong>PAL</strong> {t('palVsMet.section2Intro')}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center">{t('palVsMet.section2Formula')}</p>
        </div>
        <p className="mt-3">{t('palVsMet.section2Note')}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section3Title')}
        </h3>
        <p>
          <strong>MET</strong> {t('palVsMet.section3Intro')}
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
          <p className="font-medium">{t('palVsMet.section3Formula')}</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section4Title')}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-2">{t('palVsMet.palTitle')}</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>{t('palVsMet.palItem1')}</li>
              <li>{t('palVsMet.palItem2')}</li>
              <li>{t('palVsMet.palItem3')}</li>
              <li>{t('palVsMet.palItem4')}</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900 mb-2">{t('palVsMet.metTitle')}</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>{t('palVsMet.metItem1')}</li>
              <li>{t('palVsMet.metItem2')}</li>
              <li>{t('palVsMet.metItem3')}</li>
              <li>{t('palVsMet.metItem4')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section5Title')}
        </h3>
        <p className="text-neutral-700 mb-3">{t('palVsMet.section5Intro')}</p>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 rounded-lg text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-neutral-900">
                  {t('palVsMet.tableColSteps')}
                </th>
                <th className="px-4 py-2 text-left font-medium text-neutral-900">
                  {t('palVsMet.tableColPal')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">{t('palVsMet.tableRow1Steps')}</td>
                <td className="px-4 py-2">{t('palVsMet.tableRow1Pal')}</td>
              </tr>
              <tr className="border-t bg-neutral-50">
                <td className="px-4 py-2">{t('palVsMet.tableRow2Steps')}</td>
                <td className="px-4 py-2">{t('palVsMet.tableRow2Pal')}</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">{t('palVsMet.tableRow3Steps')}</td>
                <td className="px-4 py-2">{t('palVsMet.tableRow3Pal')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-neutral-600 mt-2">{t('palVsMet.tableNote')}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section6Title')}
        </h3>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            {t('palVsMet.whenItem1')} <strong>{t('palVsMet.whenItem1Formula')}</strong>
          </li>
          <li>
            {t('palVsMet.whenItem2')} <strong>{t('palVsMet.whenItem2Formula')}</strong>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('palVsMet.section7Title')}
        </h3>
        <p>{t('palVsMet.section7Intro')}</p>
        <div className="space-y-3 mt-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900">{t('palVsMet.palIncludesTitle')}</p>
            <p className="font-mono text-sm text-neutral-700 mt-2">
              {t('palVsMet.palIncludesFormula')}
            </p>
            <p className="text-xs text-neutral-600 mt-2">{t('palVsMet.palIncludesNote')}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900">{t('palVsMet.palExcludesTitle')}</p>
            <p className="font-mono text-sm text-neutral-700 mt-2">
              {t('palVsMet.palExcludesFormula')}
            </p>
            <p className="text-xs text-neutral-600 mt-2">{t('palVsMet.palExcludesNote')}</p>
          </div>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mt-3 space-y-1">
          <p className="text-sm font-semibold text-neutral-700 mb-2">
            {t('palVsMet.summaryTitle')}
          </p>
          <div className="flex gap-2 text-sm text-neutral-700">
            <span className="text-neutral-400 mt-0.5">•</span>
            <span>{t('palVsMet.summaryItem1')}</span>
          </div>
          <div className="flex gap-2 text-sm text-neutral-700">
            <span className="text-neutral-400 mt-0.5">•</span>
            <span>{t('palVsMet.summaryItem2')}</span>
          </div>
          <div className="flex gap-2 text-sm text-neutral-700">
            <span className="text-neutral-400 mt-0.5">•</span>
            <span>{t('palVsMet.summaryItem3')}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
