import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('what-is-tdee')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function VadArTdeePage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('what-is-tdee.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('what-is-tdee.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('what-is-tdee.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('what-is-tdee.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const tStr = t as (key: string) => string
  const bodyS1h3dItems = t('what-is-tdee.body.s1h3d.items', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS2Items = t('what-is-tdee.body.s2.items', {
    returnObjects: true,
  }) as unknown as string[]
  const bodyS3Items = t('what-is-tdee.body.s3.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('what-is-tdee.schema.headline'),
    description: t('what-is-tdee.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.com' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('what-is-tdee.seo.title')}
        description={t('what-is-tdee.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('what-is-tdee.layout.title')}
        intro={t('what-is-tdee.layout.intro')}
        moneyPageHref={t('what-is-tdee.layout.moneyPageHref')}
        moneyPageLabel={t('what-is-tdee.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('what-is-tdee.layout.breadcrumb.hubLabel'),
            href: t('what-is-tdee.layout.breadcrumb.hubPath'),
          },
          { label: t('what-is-tdee.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('what-is-tdee.body.s1.h2')}
        </h2>
        <p>{t('what-is-tdee.body.s1.p1')}</p>
        <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 my-4">
          <p className="text-sm font-mono text-neutral-800">{t('what-is-tdee.body.s1.formula')}</p>
        </div>
        <img
          src="/TDEE.png"
          alt={t('what-is-tdee.body.s1.imgAlt')}
          className="w-full max-w-md rounded-lg my-4"
        />

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('what-is-tdee.body.s1h3a.h3')}
        </h3>
        <p>{t('what-is-tdee.body.s1h3a.p1')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s1h3a.p2')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s1h3a.p3')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s1h3a.p4')}</p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('what-is-tdee.body.s1h3b.h3')}
        </h3>
        <p>{t('what-is-tdee.body.s1h3b.p1')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s1h3b.p2')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s1h3b.p3')}</p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('what-is-tdee.body.s1h3c.h3')}
        </h3>
        <p>{t('what-is-tdee.body.s1h3c.p1')}</p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          {t('what-is-tdee.body.s1h3d.h3')}
        </h3>
        <p>{t('what-is-tdee.body.s1h3d.p1')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s1h3d.p2')}</p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          {bodyS1h3dItems.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`what-is-tdee.body.s1h3d.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^—]+— /, '')}
            </li>
          ))}
        </ul>
        <p className="mt-3">{t('what-is-tdee.body.s1h3d.p3')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-tdee.body.s2.h2')}
        </h2>
        <p>{t('what-is-tdee.body.s2.p1')}</p>
        <ol className="space-y-2 pl-4 list-decimal mt-3">
          {bodyS2Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p className="mt-3">
          {t('what-is-tdee.body.s2.example')}
          <strong>{t('what-is-tdee.body.s2.exampleStrong')}</strong>.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-tdee.body.s3.h2')}
        </h2>
        <p>
          {t('what-is-tdee.body.s3.p1pre')}
          <em>{t('what-is-tdee.body.s3.p1Em')}</em>
          {t('what-is-tdee.body.s3.p1post')}
        </p>
        <ul className="space-y-2 pl-4 list-disc mt-2">
          {bodyS3Items.map((item, i) => (
            <li key={i}>
              <strong>{tStr(`what-is-tdee.body.s3.items${i}strong`)}</strong>{' '}
              {item.replace(/^[^:]+:\s*/, '')}
            </li>
          ))}
        </ul>
        <p className="mt-3">{t('what-is-tdee.body.s3.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-tdee.body.s4.h2')}
        </h2>
        <p>{t('what-is-tdee.body.s4.p1')}</p>
        <p className="mt-3">{t('what-is-tdee.body.s4.p2')}</p>
      </ArticleLayout>
    </>
  )
}
