import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('lbm-vs-ffm')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function LbmVsFfmPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('lbm-vs-ffm.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('lbm-vs-ffm.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('lbm-vs-ffm.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('lbm-vs-ffm.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const bodyS1Items = t('lbm-vs-ffm.body.s1.items', { returnObjects: true }) as unknown as string[]
  const bodyS2Items = t('lbm-vs-ffm.body.s2.items', { returnObjects: true }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('lbm-vs-ffm.schema.headline'),
    description: t('lbm-vs-ffm.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.com' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('lbm-vs-ffm.seo.title')}
        description={t('lbm-vs-ffm.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('lbm-vs-ffm.layout.title')}
        intro={t('lbm-vs-ffm.layout.intro')}
        moneyPageHref={t('lbm-vs-ffm.layout.moneyPageHref')}
        moneyPageLabel={t('lbm-vs-ffm.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('lbm-vs-ffm.layout.breadcrumb.hubLabel'),
            href: t('lbm-vs-ffm.layout.breadcrumb.hubPath'),
          },
          { label: t('lbm-vs-ffm.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('lbm-vs-ffm.body.s1.h2')}
        </h2>
        <p>
          {t('lbm-vs-ffm.body.s1.p1')
            .split(t('lbm-vs-ffm.body.s1.p1Em'))
            .map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <em>{t('lbm-vs-ffm.body.s1.p1Em')}</em>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
        </p>
        <p className="mt-3">{t('lbm-vs-ffm.body.s1.p2')}</p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          {bodyS1Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3">{t('lbm-vs-ffm.body.s1.p3')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('lbm-vs-ffm.body.s2.h2')}
        </h2>
        <p>{t('lbm-vs-ffm.body.s2.p1')}</p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          {bodyS2Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3">{t('lbm-vs-ffm.body.s2.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('lbm-vs-ffm.body.s3.h2')}
        </h2>
        <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 my-4 space-y-1 text-sm">
          <p>
            <strong>{t('lbm-vs-ffm.body.s3.boxLBMStrong')}</strong> —{' '}
            {t('lbm-vs-ffm.body.s3.boxLBM')
              .replace(/^LBM — /, '')
              .replace(/^LBM — /, '')}
          </p>
          <p>
            <strong>{t('lbm-vs-ffm.body.s3.boxFFMStrong')}</strong> —{' '}
            {t('lbm-vs-ffm.body.s3.boxFFM').replace(/^FFM — /, '')}
          </p>
          <p className="text-neutral-600">{t('lbm-vs-ffm.body.s3.boxDiff')}</p>
        </div>
        <p>{t('lbm-vs-ffm.body.s3.p1')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('lbm-vs-ffm.body.s4.h2')}
        </h2>
        <p>{t('lbm-vs-ffm.body.s4.p1')}</p>
        <p className="mt-3">{t('lbm-vs-ffm.body.s4.p2')}</p>
        <p className="mt-3">{t('lbm-vs-ffm.body.s4.p3')}</p>
      </ArticleLayout>
    </>
  )
}
