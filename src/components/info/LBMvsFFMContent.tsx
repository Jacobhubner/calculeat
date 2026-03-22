/**
 * LBM vs FFM Information Content
 */
import { useTranslation } from 'react-i18next'

export default function LBMvsFFMContent() {
  const { t } = useTranslation('content')

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('lbmVsffm.section1Title')}
        </h3>
        <p>
          <strong>LBM</strong> {t('lbmVsffm.section1Intro')}
        </p>
      </section>

      <section>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-medium text-green-900 mb-2">{t('lbmVsffm.lbmTitle')}</p>
          <p className="text-sm text-neutral-700">{t('lbmVsffm.lbmIntro')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-neutral-700">
            <li>{t('lbmVsffm.lbmItem1')}</li>
            <li>{t('lbmVsffm.lbmItem2')}</li>
            <li>{t('lbmVsffm.lbmItem3')}</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-medium text-blue-900 mb-2">{t('lbmVsffm.ffmTitle')}</p>
          <p className="text-sm text-neutral-700">{t('lbmVsffm.ffmIntro')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-neutral-700">
            <li>{t('lbmVsffm.ffmItem1')}</li>
            <li>{t('lbmVsffm.ffmItem2')}</li>
            <li>{t('lbmVsffm.ffmItem3')}</li>
            <li>{t('lbmVsffm.ffmItem4')}</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium text-yellow-900 mb-2">{t('lbmVsffm.diffTitle')}</p>
          <ul className="text-sm space-y-1 text-neutral-700">
            <li>{t('lbmVsffm.diffItem1')}</li>
            <li>{t('lbmVsffm.diffItem2')}</li>
            <li>
              {t('lbmVsffm.diffItem3').replace('3–5%', '')}
              <strong>3–5%</strong>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-700">
            👉 {t('lbmVsffm.practicalText1')}
            <br />
            👉 {t('lbmVsffm.practicalText2')}
          </p>
        </div>
      </section>
    </div>
  )
}
