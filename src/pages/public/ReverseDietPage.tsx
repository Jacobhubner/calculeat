import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('reverse-diet')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function ReverseDietPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('reverse-diet.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('reverse-diet.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('reverse-diet.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('reverse-diet.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const tStr = t as (key: string) => string
  const bodyS2Items = t('reverse-diet.body.s2.items', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS3Items = t('reverse-diet.body.s3.items', {
    returnObjects: true,
  }) as unknown as string[]
  type RdPhase = { term: string; def: string; color: string }
  const bodyS4Phases = t('reverse-diet.body.s4.phases', {
    returnObjects: true,
  }) as unknown as RdPhase[]
  const bodyS5Items = t('reverse-diet.body.s5.items', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS6Items = t('reverse-diet.body.s6.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('reverse-diet.schema.headline'),
    description: t('reverse-diet.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('reverse-diet.seo.title')}
        description={t('reverse-diet.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('reverse-diet.layout.title')}
        intro={t('reverse-diet.layout.intro')}
        moneyPageHref={t('reverse-diet.layout.moneyPageHref')}
        moneyPageLabel={t('reverse-diet.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('reverse-diet.layout.breadcrumb.hubLabel'),
            href: t('reverse-diet.layout.breadcrumb.hubPath'),
          },
          { label: t('reverse-diet.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('reverse-diet.body.s1.h2')}
        </h2>
        <p>{t('reverse-diet.body.s1.p1')}</p>
        <p>
          {lng === 'en'
            ? 'The idea is based on a real physiological mechanism: '
            : 'Idén bygger på en verklig fysiologisk mekanism: '}
          <strong>{t('reverse-diet.body.s1.p2Strong')}</strong> {t('reverse-diet.body.s1.p2')}
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('reverse-diet.body.s2.h2')}
        </h2>
        <p>{t('reverse-diet.body.s2.p1')}</p>
        <ul className="space-y-3 pl-4 list-disc">
          {bodyS2Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`reverse-diet.body.s2.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^.]+\.\s*/, '')}
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('reverse-diet.body.s3.h2')}
        </h2>
        <p>
          {lng === 'en' ? 'A reverse diet is ' : 'Reverse diet är '}
          <em>{t('reverse-diet.body.s3.p1Em')}</em> {t('reverse-diet.body.s3.p1')}
        </p>
        <ul className="space-y-2 pl-4 list-disc">
          {bodyS3Items.map((item, i) => (
            <li key={i}>
              {tStr(`reverse-diet.body.s3.items${i}strong`) ? (
                <>
                  <strong>{tStr(`reverse-diet.body.s3.items${i}strong`)}</strong>{' '}
                  {item.replace(tStr(`reverse-diet.body.s3.items${i}strong`) + ' ', '')}
                </>
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
        <p>{t('reverse-diet.body.s3.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('reverse-diet.body.s4.h2')}
        </h2>
        <div className="space-y-4">
          {bodyS4Phases.map(({ term, def, color }) => (
            <div key={term} className={`rounded-xl border p-4 ${color}`}>
              <div className="font-semibold text-neutral-800 mb-1">{term}</div>
              <div className="text-sm text-neutral-700">{def}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('reverse-diet.body.s5.h2')}
        </h2>
        <ol className="space-y-4 pl-4 list-decimal">
          {bodyS5Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`reverse-diet.body.s5.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^.]+\.\s*/, '')}
            </li>
          ))}
        </ol>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('reverse-diet.body.s6.h2')}
        </h2>
        <ul className="space-y-2 pl-4 list-disc">
          {bodyS6Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`reverse-diet.body.s6.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^.]+\.\s*/, '')}
            </li>
          ))}
        </ul>
      </ArticleLayout>
    </>
  )
}
