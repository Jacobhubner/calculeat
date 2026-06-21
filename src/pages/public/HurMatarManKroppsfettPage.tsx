import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('how-to-measure-bodyfat')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function HurMatarManKroppsfettPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('how-to-measure-bodyfat.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('how-to-measure-bodyfat.sources', {
    returnObjects: true,
  }) as unknown as Source[]
  const relatedCalcs = t('how-to-measure-bodyfat.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('how-to-measure-bodyfat.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const tStr = t as (key: string) => string
  const bodyS2MenRows = t('how-to-measure-bodyfat.body.s2.menRows', {
    returnObjects: true,
  }) as unknown as string[][]
  const bodyS2WomenRows = t('how-to-measure-bodyfat.body.s2.womenRows', {
    returnObjects: true,
  }) as unknown as string[][]
  const bodyS4Items = t('how-to-measure-bodyfat.body.s4.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('how-to-measure-bodyfat.schema.headline'),
    description: t('how-to-measure-bodyfat.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('how-to-measure-bodyfat.seo.title')}
        description={t('how-to-measure-bodyfat.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('how-to-measure-bodyfat.layout.title')}
        intro={t('how-to-measure-bodyfat.layout.intro')}
        moneyPageHref={t('how-to-measure-bodyfat.layout.moneyPageHref')}
        moneyPageLabel={t('how-to-measure-bodyfat.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('how-to-measure-bodyfat.layout.breadcrumb.hubLabel'),
            href: t('how-to-measure-bodyfat.layout.breadcrumb.hubPath'),
          },
          {
            label: t('how-to-measure-bodyfat.layout.breadcrumb.pageLabel'),
            href: localeEntry.canonical,
          },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('how-to-measure-bodyfat.body.s1.h2')}
        </h2>
        <p>{t('how-to-measure-bodyfat.body.s1.p1')}</p>
        <p className="mt-3">{t('how-to-measure-bodyfat.body.s1.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('how-to-measure-bodyfat.body.s2.h2')}
        </h2>
        <p>{t('how-to-measure-bodyfat.body.s2.p1')}</p>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
              {t('how-to-measure-bodyfat.body.s2.menHeader')}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {bodyS2MenRows.map(([label, range]) => (
                  <tr key={label} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-700">{label}</td>
                    <td className="px-4 py-2 text-neutral-500 text-right">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
              {t('how-to-measure-bodyfat.body.s2.womenHeader')}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {bodyS2WomenRows.map(([label, range]) => (
                  <tr key={label} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-700">{label}</td>
                    <td className="px-4 py-2 text-neutral-500 text-right">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600">{t('how-to-measure-bodyfat.body.s2.note')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('how-to-measure-bodyfat.body.s3.h2')}
        </h2>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('how-to-measure-bodyfat.body.s3.h3a')}
        </h3>
        <p>{t('how-to-measure-bodyfat.body.s3.p1')}</p>
        <p className="mt-3">
          <strong>{t('how-to-measure-bodyfat.body.s3.p1bStrong')}</strong>
          {t('how-to-measure-bodyfat.body.s3.p1b')}
          <br />
          <strong>{t('how-to-measure-bodyfat.body.s3.p1cStrong')}</strong>
          {t('how-to-measure-bodyfat.body.s3.p1c')}
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('how-to-measure-bodyfat.body.s3.h3b')}
        </h3>
        <p>{t('how-to-measure-bodyfat.body.s3.p2')}</p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('how-to-measure-bodyfat.body.s3.h3c')}
        </h3>
        <p>{t('how-to-measure-bodyfat.body.s3.p3')}</p>
        <p className="mt-3">{t('how-to-measure-bodyfat.body.s3.p4')}</p>
        <p className="mt-3">
          <strong>{t('how-to-measure-bodyfat.body.s3.p4bStrong')}</strong>
          {t('how-to-measure-bodyfat.body.s3.p4b')}
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('how-to-measure-bodyfat.body.s3.h3d')}
        </h3>
        <p>{t('how-to-measure-bodyfat.body.s3.p5')}</p>
        <p className="mt-3">{t('how-to-measure-bodyfat.body.s3.p6')}</p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('how-to-measure-bodyfat.body.s3.h3e')}
        </h3>
        <p>{t('how-to-measure-bodyfat.body.s3.p7')}</p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('how-to-measure-bodyfat.body.s3.h3f')}
        </h3>
        <p>{t('how-to-measure-bodyfat.body.s3.p8')}</p>
        <p className="mt-3">{t('how-to-measure-bodyfat.body.s3.p9')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('how-to-measure-bodyfat.body.s4.h2')}
        </h2>
        <p>{t('how-to-measure-bodyfat.body.s4.p1')}</p>
        <ul className="space-y-2 pl-4 list-disc mt-3">
          {bodyS4Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`how-to-measure-bodyfat.body.s4.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^:]+:\s*/, '')}
            </li>
          ))}
        </ul>
        <p className="mt-3">{t('how-to-measure-bodyfat.body.s4.p2')}</p>
        <p className="mt-3">{t('how-to-measure-bodyfat.body.s4.p3')}</p>
      </ArticleLayout>
    </>
  )
}
