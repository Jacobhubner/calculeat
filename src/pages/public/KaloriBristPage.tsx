import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type Source = { text: string; url?: string }
type RelatedLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('calorie-deficit')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function KaloriBristPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-articles', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('calorie-deficit.faq', { returnObjects: true }) as unknown as FaqItem[]
  const sources = t('calorie-deficit.sources', { returnObjects: true }) as unknown as Source[]
  const relatedCalcs = t('calorie-deficit.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('calorie-deficit.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  type DeficitLevel = { title: string; tempo: string; desc: string; color: string }
  const deficitLevels = t('calorie-deficit.body.s2.deficitLevels', {
    returnObjects: true,
  }) as unknown as DeficitLevel[]
  const bodyS5Items = t('calorie-deficit.body.s5.items', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('calorie-deficit.schema.headline'),
    description: t('calorie-deficit.schema.description'),
    url: localeEntry.canonical,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.com' },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
  }

  return (
    <>
      <Seo
        title={t('calorie-deficit.seo.title')}
        description={t('calorie-deficit.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <ArticleLayout
        title={t('calorie-deficit.layout.title')}
        intro={t('calorie-deficit.layout.intro')}
        moneyPageHref={t('calorie-deficit.layout.moneyPageHref')}
        moneyPageLabel={t('calorie-deficit.layout.moneyPageLabel')}
        faqItems={faqItems}
        sources={sources}
        relatedCalculators={relatedCalcs}
        relatedArticles={relatedArticles}
        breadcrumb={[
          {
            label: t('calorie-deficit.layout.breadcrumb.hubLabel'),
            href: t('calorie-deficit.layout.breadcrumb.hubPath'),
          },
          { label: t('calorie-deficit.layout.breadcrumb.pageLabel'), href: localeEntry.canonical },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          {t('calorie-deficit.body.s1.h2')}
        </h2>
        <p>{t('calorie-deficit.body.s1.p1')}</p>
        <p>
          <strong>{t('calorie-deficit.body.s1.p2Strong')}</strong>
          {t('calorie-deficit.body.s1.p2')}
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-deficit.body.s2.h2')}
        </h2>
        <div className="space-y-4">
          {deficitLevels.map(({ title, tempo, desc, color }) => (
            <div key={title} className={`rounded-xl border p-4 ${color}`}>
              <div className="font-semibold text-neutral-800 mb-1">{title}</div>
              <div className="text-xs text-neutral-500 mb-2">
                {t('calorie-deficit.body.s2.tempoLabel')} {tempo}
              </div>
              <div className="text-sm text-neutral-700">{desc}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-deficit.body.s3.h2')}
        </h2>
        <p>{t('calorie-deficit.body.s3.p1')}</p>
        <p>{t('calorie-deficit.body.s3.p2')}</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-deficit.body.s4.h2')}
        </h2>
        <p>{t('calorie-deficit.body.s4.p1')}</p>
        <p>
          <strong>{t('calorie-deficit.body.s4.p2Strong')}</strong>
          {t('calorie-deficit.body.s4.p2')}
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          {t('calorie-deficit.body.s5.h2')}
        </h2>
        <ul className="space-y-2 pl-4 list-disc">
          {bodyS5Items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ArticleLayout>
    </>
  )
}
