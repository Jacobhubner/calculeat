import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import BMRvsRMRContent from '@/components/info/BMRvsRMRContent'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('bmr-vs-rmr')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BmrVsRmrPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bmr-vs-rmr.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('bmr-vs-rmr.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('bmr-vs-rmr.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('bmr-vs-rmr.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('bmr-vs-rmr.schema.headline'),
    description: t('bmr-vs-rmr.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.com' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('bmr-vs-rmr.seo.title')}
        description={t('bmr-vs-rmr.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('bmr-vs-rmr.layout.title')}
        intro={t('bmr-vs-rmr.layout.intro')}
        moneyPageHref={t('bmr-vs-rmr.layout.moneyPageHref')}
        moneyPageLabel={t('bmr-vs-rmr.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('bmr-vs-rmr.layout.breadcrumb.hubLabel'),
            href: t('bmr-vs-rmr.layout.breadcrumb.hubPath'),
          },
          { label: t('bmr-vs-rmr.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <BMRvsRMRContent />

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmr-vs-rmr.body.s1.h2')}
        </h2>
        <p>{t('bmr-vs-rmr.body.s1.p1')}</p>
        <p className="mt-3">{t('bmr-vs-rmr.body.s1.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('bmr-vs-rmr.body.s2.h2')}
        </h2>
        <p>{t('bmr-vs-rmr.body.s2.p1')}</p>
        <p className="mt-3">{t('bmr-vs-rmr.body.s2.p2')}</p>
      </ArticleLayout>
    </>
  )
}
