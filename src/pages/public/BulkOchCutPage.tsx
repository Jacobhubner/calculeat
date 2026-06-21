import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('bulk-and-cut')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BulkOchCutPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bulk-and-cut.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('bulk-and-cut.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('bulk-and-cut.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('bulk-and-cut.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const tStr = t as (key: string) => string
  const bodyS4Items = t('bulk-and-cut.body.s4.items', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS5Items = t('bulk-and-cut.body.s5.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('bulk-and-cut.schema.headline'),
    description: t('bulk-and-cut.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('bulk-and-cut.seo.title')}
        description={t('bulk-and-cut.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('bulk-and-cut.layout.title')}
        intro={t('bulk-and-cut.layout.intro')}
        moneyPageHref={t('bulk-and-cut.layout.moneyPageHref')}
        moneyPageLabel={t('bulk-and-cut.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('bulk-and-cut.layout.breadcrumb.hubLabel'),
            href: t('bulk-and-cut.layout.breadcrumb.hubPath'),
          },
          { label: t('bulk-and-cut.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('bulk-and-cut.body.s1.h2')}
        </h2>
        <p>{t('bulk-and-cut.body.s1.p1')}</p>
        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">
          {t('bulk-and-cut.body.s1.h3a')}
        </h3>
        <p>
          <strong>{t('bulk-and-cut.body.s1.p2Strong')}</strong>
          {t('bulk-and-cut.body.s1.p2')}
        </p>
        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">
          {t('bulk-and-cut.body.s1.h3b')}
        </h3>
        <p>
          <strong>{t('bulk-and-cut.body.s1.p3Strong')}</strong>
          {t('bulk-and-cut.body.s1.p3')}
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bulk-and-cut.body.s2.h2')}
        </h2>
        <p>{t('bulk-and-cut.body.s2.p1')}</p>
        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">
          {t('bulk-and-cut.body.s2.h3a')}
        </h3>
        <p>
          <strong>{t('bulk-and-cut.body.s2.p2Strong')}</strong>
          {t('bulk-and-cut.body.s2.p2')}
        </p>
        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">
          {t('bulk-and-cut.body.s2.h3b')}
        </h3>
        <p>
          <strong>{t('bulk-and-cut.body.s2.p3Strong')}</strong>
          {t('bulk-and-cut.body.s2.p3')}
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bulk-and-cut.body.s3.h2')}
        </h2>
        <p>
          {t('bulk-and-cut.body.s3.p1')
            .split(t('bulk-and-cut.body.s3.p1Em'))
            .map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <em>{t('bulk-and-cut.body.s3.p1Em')}</em>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
        </p>
        <p>{t('bulk-and-cut.body.s3.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bulk-and-cut.body.s4.h2')}
        </h2>
        <ul className="space-y-2 pl-4 list-disc">
          {bodyS4Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`bulk-and-cut.body.s4.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^:]+:\s*/, '')}
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bulk-and-cut.body.s5.h2')}
        </h2>
        <ol className="space-y-2 pl-5 list-decimal">
          {bodyS5Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </ArticleLayout>
    </>
  )
}
