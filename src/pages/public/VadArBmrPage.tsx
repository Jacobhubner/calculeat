import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('what-is-bmr')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function VadArBmrPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('what-is-bmr.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('what-is-bmr.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('what-is-bmr.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('what-is-bmr.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const tStr = t as (key: string) => string
  const bodyS2Items = t('what-is-bmr.body.s2.items', { returnObjects: true }) as unknown as string[]
  const bodyS4Items = t('what-is-bmr.body.s4.items', { returnObjects: true }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('what-is-bmr.schema.headline'),
    description: t('what-is-bmr.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('what-is-bmr.seo.title')}
        description={t('what-is-bmr.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('what-is-bmr.layout.title')}
        intro={t('what-is-bmr.layout.intro')}
        moneyPageHref={t('what-is-bmr.layout.moneyPageHref')}
        moneyPageLabel={t('what-is-bmr.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('what-is-bmr.layout.breadcrumb.hubLabel'),
            href: t('what-is-bmr.layout.breadcrumb.hubPath'),
          },
          { label: t('what-is-bmr.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('what-is-bmr.body.s1.h2')}
        </h2>
        <p>{t('what-is-bmr.body.s1.p1')}</p>
        <p className="mt-3">{t('what-is-bmr.body.s1.p2')}</p>
        <p className="mt-3">{t('what-is-bmr.body.s1.p3')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-bmr.body.s2.h2')}
        </h2>
        <p>{t('what-is-bmr.body.s2.p1')}</p>
        <p className="mt-3">{t('what-is-bmr.body.s2.p2')}</p>
        <p className="mt-3">{t('what-is-bmr.body.s2.p3')}</p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          {bodyS2Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`what-is-bmr.body.s2.items${i}strong`)}</strong> —{' '}
              {item.replace(/^.+— /, '')}
            </li>
          ))}
        </ul>
        <p className="mt-3">{t('what-is-bmr.body.s2.p4')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-bmr.body.s3.h2')}
        </h2>
        <p>{t('what-is-bmr.body.s3.p1')}</p>
        <p className="mt-3">{t('what-is-bmr.body.s3.p2')}</p>
        <p className="mt-3">
          {t('what-is-bmr.body.s3.p3pre')}
          <strong>{t('what-is-bmr.body.s3.p3Strong')}</strong> {t('what-is-bmr.body.s3.p3')}
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-bmr.body.s4.h2')}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-neutral-800">
          {bodyS4Items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </ArticleLayout>
    </>
  )
}
