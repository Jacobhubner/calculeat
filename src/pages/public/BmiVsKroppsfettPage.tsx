import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('bmi-vs-bodyfat')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BmiVsKroppsfettPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bmi-vs-bodyfat.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('bmi-vs-bodyfat.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('bmi-vs-bodyfat.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('bmi-vs-bodyfat.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const bodyS3TableHeaders = t('bmi-vs-bodyfat.body.s3.tableHeaders', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS3TableRows = t('bmi-vs-bodyfat.body.s3.tableRows', {
    returnObjects: true,
  }) as unknown as string[][]
  const bodyS4Items = t('bmi-vs-bodyfat.body.s4.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('bmi-vs-bodyfat.schema.headline'),
    description: t('bmi-vs-bodyfat.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('bmi-vs-bodyfat.seo.title')}
        description={t('bmi-vs-bodyfat.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('bmi-vs-bodyfat.layout.title')}
        intro={t('bmi-vs-bodyfat.layout.intro')}
        moneyPageHref={t('bmi-vs-bodyfat.layout.moneyPageHref')}
        moneyPageLabel={t('bmi-vs-bodyfat.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('bmi-vs-bodyfat.layout.breadcrumb.hubLabel'),
            href: t('bmi-vs-bodyfat.layout.breadcrumb.hubPath'),
          },
          { label: t('bmi-vs-bodyfat.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('bmi-vs-bodyfat.body.s1.h2')}
        </h2>
        <p>{t('bmi-vs-bodyfat.body.s1.p1')}</p>
        <p className="mt-3">{t('bmi-vs-bodyfat.body.s1.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmi-vs-bodyfat.body.s2.h2')}
        </h2>
        <p>{t('bmi-vs-bodyfat.body.s2.p1')}</p>
        <p className="mt-3">{t('bmi-vs-bodyfat.body.s2.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmi-vs-bodyfat.body.s3.h2')}
        </h2>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100">
                {bodyS3TableHeaders.map(h => (
                  <th key={h} className="text-left p-3 border border-neutral-200 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyS3TableRows.map(([prop, bmi, bf]) => (
                <tr key={prop} className="even:bg-neutral-50">
                  <td className="p-3 border border-neutral-200 font-medium text-neutral-700">
                    {prop}
                  </td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{bmi}</td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{bf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmi-vs-bodyfat.body.s4.h2')}
        </h2>
        <p>{t('bmi-vs-bodyfat.body.s4.p1')}</p>
        <p className="mt-3">{t('bmi-vs-bodyfat.body.s4.p2')}</p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-neutral-700">
          {bodyS4Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmi-vs-bodyfat.body.s5.h2')}
        </h2>
        <p>{t('bmi-vs-bodyfat.body.s5.p1')}</p>
      </ArticleLayout>
    </>
  )
}
