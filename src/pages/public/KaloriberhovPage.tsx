import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('calorie-needs')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function KaloriberhovPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('calorie-needs.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('calorie-needs.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('calorie-needs.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('calorie-needs.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const tStr = t as (key: string) => string
  const bodyS1Items = t('calorie-needs.body.s1.items', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS2TableHeaders = t('calorie-needs.body.s2.tableHeaders', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS2TableRows = t('calorie-needs.body.s2.tableRows', {
    returnObjects: true,
  }) as unknown as string[][]
  const bodyS4Items = t('calorie-needs.body.s4.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('calorie-needs.schema.headline'),
    description: t('calorie-needs.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('calorie-needs.seo.title')}
        description={t('calorie-needs.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('calorie-needs.layout.title')}
        intro={t('calorie-needs.layout.intro')}
        moneyPageHref={t('calorie-needs.layout.moneyPageHref')}
        moneyPageLabel={t('calorie-needs.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('calorie-needs.layout.breadcrumb.hubLabel'),
            href: t('calorie-needs.layout.breadcrumb.hubPath'),
          },
          { label: t('calorie-needs.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('calorie-needs.body.s1.h2')}
        </h2>
        <p>{t('calorie-needs.body.s1.p1')}</p>
        <p>
          {t('calorie-needs.body.s1.p2')} <strong>Mifflin-St Jeor</strong>:
        </p>
        <ul className="space-y-1 pl-4 list-disc">
          {bodyS1Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`calorie-needs.body.s1.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^:]+:\s*/, '')}
            </li>
          ))}
        </ul>
        <p className="text-sm text-neutral-500">{t('calorie-needs.body.s1.note')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-needs.body.s2.h2')}
        </h2>
        <p>{t('calorie-needs.body.s2.p1')}</p>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {bodyS2TableHeaders.map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-neutral-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bodyS2TableRows.map(([name, desc, pal]) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-medium text-neutral-800 whitespace-nowrap">
                    {name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{desc}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{pal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t('calorie-needs.body.s2.example')}
          <br />
          {t('calorie-needs.body.s2.exampleCalc1')}
          <br />
          {t('calorie-needs.body.s2.exampleCalc2')}
          <strong>{t('calorie-needs.body.s2.exampleCalc2Strong')}</strong>
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-needs.body.s3.h2')}
        </h2>
        <h3 className="font-semibold text-neutral-800 mb-2">{t('calorie-needs.body.s3.h3a')}</h3>
        <p>{t('calorie-needs.body.s3.p1')}</p>
        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">
          {t('calorie-needs.body.s3.h3b')}
        </h3>
        <p>{t('calorie-needs.body.s3.p2')}</p>
        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">
          {t('calorie-needs.body.s3.h3c')}
        </h3>
        <p>{t('calorie-needs.body.s3.p3')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-needs.body.s4.h2')}
        </h2>
        <p>{t('calorie-needs.body.s4.p1')}</p>
        <ul className="space-y-1 pl-4 list-disc">
          {bodyS4Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          <strong>{t('calorie-needs.body.s4.tipStrong')}</strong>
          {t('calorie-needs.body.s4.tip')}
        </p>
      </ArticleLayout>
    </>
  )
}
