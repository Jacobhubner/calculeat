import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import FFMIContent from '@/components/info/FFMIContent'
import NormalizedFFMIContent from '@/components/info/NormalizedFFMIContent'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('what-is-ffmi')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function VadArFfmiPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('what-is-ffmi.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('what-is-ffmi.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('what-is-ffmi.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('what-is-ffmi.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('what-is-ffmi.schema.headline'),
    description: t('what-is-ffmi.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('what-is-ffmi.seo.title')}
        description={t('what-is-ffmi.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('what-is-ffmi.layout.title')}
        intro={t('what-is-ffmi.layout.intro')}
        moneyPageHref={t('what-is-ffmi.layout.moneyPageHref')}
        moneyPageLabel={t('what-is-ffmi.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('what-is-ffmi.layout.breadcrumb.hubLabel'),
            href: t('what-is-ffmi.layout.breadcrumb.hubPath'),
          },
          { label: t('what-is-ffmi.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <FFMIContent />

        <div className="mt-8">
          <NormalizedFFMIContent />
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('what-is-ffmi.body.s1.h2')}
        </h2>
        <p>{t('what-is-ffmi.body.s1.p1')}</p>
        <p className="mt-3">{t('what-is-ffmi.body.s1.p2')}</p>
        <p className="mt-3">{t('what-is-ffmi.body.s1.p3')}</p>
      </ArticleLayout>
    </>
  )
}
