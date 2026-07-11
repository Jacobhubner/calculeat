import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('bmr-vs-tdee')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BmrVsTdeePage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bmr-vs-tdee.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('bmr-vs-tdee.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('bmr-vs-tdee.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('bmr-vs-tdee.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const bodyS3TableHeaders = t('bmr-vs-tdee.body.s3.tableHeaders', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS3TableRows = t('bmr-vs-tdee.body.s3.tableRows', {
    returnObjects: true,
  }) as unknown as string[][]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('bmr-vs-tdee.schema.headline'),
    description: t('bmr-vs-tdee.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.com' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('bmr-vs-tdee.seo.title')}
        description={t('bmr-vs-tdee.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('bmr-vs-tdee.layout.title')}
        intro={t('bmr-vs-tdee.layout.intro')}
        moneyPageHref={t('bmr-vs-tdee.layout.moneyPageHref')}
        moneyPageLabel={t('bmr-vs-tdee.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('bmr-vs-tdee.layout.breadcrumb.hubLabel'),
            href: t('bmr-vs-tdee.layout.breadcrumb.hubPath'),
          },
          { label: t('bmr-vs-tdee.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('bmr-vs-tdee.body.s1.h2')}
        </h2>
        <p>{t('bmr-vs-tdee.body.s1.p1')}</p>
        <p className="mt-3">{t('bmr-vs-tdee.body.s1.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmr-vs-tdee.body.s2.h2')}
        </h2>
        <p>{t('bmr-vs-tdee.body.s2.p1')}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 text-center font-medium text-neutral-900">
          {t('bmr-vs-tdee.body.s2.formula')}
        </div>
        <p className="mt-3">{t('bmr-vs-tdee.body.s2.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmr-vs-tdee.body.s3.h2')}
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
              {bodyS3TableRows.map(([prop, bmr, tdee]) => (
                <tr key={prop} className="even:bg-neutral-50">
                  <td className="p-3 border border-neutral-200 font-medium text-neutral-700">
                    {prop}
                  </td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{bmr}</td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{tdee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmr-vs-tdee.body.s4.h2')}
        </h2>
        <p>{t('bmr-vs-tdee.body.s4.p1')}</p>
        <p className="mt-3">{t('bmr-vs-tdee.body.s4.p2')}</p>
        <p className="mt-3">
          {t('bmr-vs-tdee.body.s4.p3')
            .split(t('bmr-vs-tdee.body.s4.p3Strong'))
            .map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <strong>{t('bmr-vs-tdee.body.s4.p3Strong')}</strong>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
        </p>
      </ArticleLayout>
    </>
  )
}
