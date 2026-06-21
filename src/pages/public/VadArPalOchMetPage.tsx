import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import PALvsMETContent from '@/components/info/PALvsMETContent'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('what-is-pal-and-met')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function VadArPalOchMetPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('what-is-pal-and-met.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('what-is-pal-and-met.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('what-is-pal-and-met.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('what-is-pal-and-met.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('what-is-pal-and-met.schema.headline'),
    description: t('what-is-pal-and-met.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('what-is-pal-and-met.seo.title')}
        description={t('what-is-pal-and-met.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('what-is-pal-and-met.layout.title')}
        intro={t('what-is-pal-and-met.layout.intro')}
        moneyPageHref={t('what-is-pal-and-met.layout.moneyPageHref')}
        moneyPageLabel={t('what-is-pal-and-met.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('what-is-pal-and-met.layout.breadcrumb.hubLabel'),
            href: t('what-is-pal-and-met.layout.breadcrumb.hubPath'),
          },
          {
            label: t('what-is-pal-and-met.layout.breadcrumb.pageLabel'),
            href: localeEntry.canonical,
          },
        ]}
      >
        <PALvsMETContent />

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-pal-and-met.body.s1.h2')}
        </h2>
        <p>{t('what-is-pal-and-met.body.s1.p1')}</p>
        <p className="mt-3">{t('what-is-pal-and-met.body.s1.p2')}</p>
        <p className="mt-3">{t('what-is-pal-and-met.body.s1.p3')}</p>
      </ArticleLayout>
    </>
  )
}
