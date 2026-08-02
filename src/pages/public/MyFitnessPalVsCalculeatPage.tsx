import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type CellType = 'yes' | 'no' | 'partial'
type RelatedLink = { href: string; label: string }
type LocaleRow = { feature: string; note: string | null }

// Cell logic stays in TSX — pure UI
function Cell({ type }: { type: CellType }) {
  if (type === 'yes')
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/25">
        <Check className="h-3.5 w-3.5 text-green-700 dark:text-green-300" />
      </span>
    )
  if (type === 'no')
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/25">
        <X className="h-3.5 w-3.5 text-red-600 dark:text-red-300" />
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/25">
      <Minus className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-300" />
    </span>
  )
}

// CellType values stay in TSX — not translatable content
const CELL_DATA: { mfp: CellType; ce: CellType }[] = [
  { mfp: 'yes', ce: 'yes' },
  { mfp: 'yes', ce: 'partial' },
  { mfp: 'partial', ce: 'yes' },
  { mfp: 'no', ce: 'yes' },
  { mfp: 'no', ce: 'yes' },
  { mfp: 'no', ce: 'yes' },
  { mfp: 'no', ce: 'yes' },
  { mfp: 'partial', ce: 'yes' },
  { mfp: 'yes', ce: 'yes' },
  { mfp: 'yes', ce: 'yes' },
  { mfp: 'yes', ce: 'yes' },
  { mfp: 'yes', ce: 'no' },
]

const pageConfig = getPageConfigByKey('myfitnesspal-vs-calculeat')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function MyFitnessPalVsCalculeatPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-compare', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('myfitnesspal-vs-calculeat.faq', {
    returnObjects: true,
  }) as unknown as FaqItem[]
  const localeRows = t('myfitnesspal-vs-calculeat.comparisonRows', {
    returnObjects: true,
  }) as unknown as LocaleRow[]
  const relatedCalcs = t('myfitnesspal-vs-calculeat.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('myfitnesspal-vs-calculeat.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const quickPoints = t('myfitnesspal-vs-calculeat.quickAnswer.points', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t('myfitnesspal-vs-calculeat.schema.headline'),
      description: t('myfitnesspal-vs-calculeat.schema.description'),
      url: localeEntry.canonical,
      publisher: { '@type': 'Organization', name: 'Calculeat', url: 'https://calculeat.com' },
      inLanguage: lng === 'en' ? 'en' : 'sv-SE',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Calculeat', item: 'https://calculeat.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('myfitnesspal-vs-calculeat.breadcrumb.comparisons'),
          item: `https://calculeat.com/${lng === 'en' ? 'en/compare' : 'jamfor'}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('myfitnesspal-vs-calculeat.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const calcHubHref = lng === 'en' ? '/en/calculators' : '/kalkylatorer'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-850">
      <Seo
        title={t('myfitnesspal-vs-calculeat.seo.title')}
        description={t('myfitnesspal-vs-calculeat.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
        noindex={pageConfig.noindex}
      />
      <JsonLd schema={pageSchema} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6 dark:text-neutral-400">
            <Link
              to="/"
              className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
            >
              Calculeat
            </Link>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {t('myfitnesspal-vs-calculeat.breadcrumb.comparisons')}
            </span>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {t('myfitnesspal-vs-calculeat.breadcrumb.pageLabel')}
            </span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight dark:text-neutral-100">
            {t('myfitnesspal-vs-calculeat.h1')}
          </h1>

          {/* Quick answer box */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6 dark:bg-primary-900/25 dark:border-primary-800">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">
              {t('myfitnesspal-vs-calculeat.quickAnswer.label')}
            </p>
            <p className="text-sm font-semibold text-primary-900 mb-3 dark:text-primary-300">
              {t('myfitnesspal-vs-calculeat.quickAnswer.verdict')}
            </p>
            <ul className="space-y-1.5 text-sm text-primary-800 dark:text-primary-300">
              {quickPoints.map(pt => (
                <li key={pt} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0 dark:text-primary-300" />{' '}
                  {pt}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                to={calcHubHref}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                {t('myfitnesspal-vs-calculeat.quickAnswer.ctaCalc')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <GuestOnly>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 border border-primary-300 text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-100 transition-colors text-sm dark:text-primary-300 dark:border-primary-800"
                >
                  {t('myfitnesspal-vs-calculeat.quickAnswer.ctaRegister')}
                </Link>
              </GuestOnly>
            </div>
          </div>

          <p className="text-base text-neutral-600 leading-relaxed mb-8 dark:text-neutral-400">
            {t('myfitnesspal-vs-calculeat.intro')}
          </p>

          {/* Comparison table */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 dark:text-neutral-100">
              {t('myfitnesspal-vs-calculeat.comparisonTable.h2')}
            </h2>
            <div className="rounded-2xl border border-neutral-200 overflow-hidden dark:border-neutral-700">
              <div className="grid grid-cols-[1fr_auto_auto] gap-0 bg-neutral-50 border-b border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                  {t('myfitnesspal-vs-calculeat.comparisonTable.colFeature')}
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center w-28 dark:text-neutral-400">
                  {t('myfitnesspal-vs-calculeat.comparisonTable.colOther')}
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-primary-600 uppercase tracking-wider text-center w-28 dark:text-primary-300">
                  {t('myfitnesspal-vs-calculeat.comparisonTable.colCalculEat')}
                </div>
              </div>
              {localeRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_auto_auto] gap-0 border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white dark:bg-neutral-850' : 'bg-neutral-50/50 dark:bg-neutral-900/50'}`}
                >
                  <div className="px-4 py-3">
                    <div className="text-sm text-neutral-800 font-medium dark:text-neutral-200">
                      {row.feature}
                    </div>
                    {row.note && (
                      <div className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">
                        {row.note}
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center w-28">
                    <Cell type={CELL_DATA[i]?.mfp ?? 'no'} />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center w-28">
                    <Cell type={CELL_DATA[i]?.ce ?? 'no'} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 dark:text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/25">
                  <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
                </span>
                {t('myfitnesspal-vs-calculeat.comparisonTable.legendYes')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/25">
                  <Minus className="h-3 w-3 text-yellow-600 dark:text-yellow-300" />
                </span>
                {t('myfitnesspal-vs-calculeat.comparisonTable.legendPartial')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/25">
                  <X className="h-3 w-3 text-red-600 dark:text-red-300" />
                </span>
                {t('myfitnesspal-vs-calculeat.comparisonTable.legendNo')}
              </span>
            </div>
          </section>

          {/* Article prose */}
          <section className="space-y-5 text-neutral-700 text-sm leading-relaxed mb-8 dark:text-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t('myfitnesspal-vs-calculeat.explanation.for_whom_mfp_h2')}
            </h2>
            <p>{t('myfitnesspal-vs-calculeat.explanation.for_whom_mfp_p')}</p>
            <ul className="space-y-1.5 pl-4 list-disc">
              {(
                t('myfitnesspal-vs-calculeat.explanation.for_whom_mfp_list', {
                  returnObjects: true,
                }) as string[]
              ).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p>
              <strong>
                {t('myfitnesspal-vs-calculeat.explanation.for_whom_mfp_limitation')
                  .split(': ')[0]
                  .replace(/\*\*/g, '')}
                :
              </strong>{' '}
              {t('myfitnesspal-vs-calculeat.explanation.for_whom_mfp_limitation')
                .split(': ')
                .slice(1)
                .join(': ')}
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2 dark:text-neutral-100">
              {t('myfitnesspal-vs-calculeat.explanation.for_whom_ce_h2')}
            </h2>
            <p>{t('myfitnesspal-vs-calculeat.explanation.for_whom_ce_p')}</p>
            <ul className="space-y-1.5 pl-4 list-disc">
              {(
                t('myfitnesspal-vs-calculeat.explanation.for_whom_ce_list', {
                  returnObjects: true,
                }) as string[]
              ).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4 dark:text-neutral-100">
              {t('myfitnesspal-vs-calculeat.explanation.diff_h2')}
            </h2>
            <p>{t('myfitnesspal-vs-calculeat.explanation.diff_p1')}</p>
            <p>{t('myfitnesspal-vs-calculeat.explanation.diff_p2')}</p>
            <p>{t('myfitnesspal-vs-calculeat.explanation.diff_p3')}</p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4 dark:text-neutral-100">
              {t('myfitnesspal-vs-calculeat.explanation.why_h2')}
            </h2>
            <p>{t('myfitnesspal-vs-calculeat.explanation.why_p')}</p>
            <div className="space-y-3 mt-3">
              {(
                t('myfitnesspal-vs-calculeat.explanation.why_cards', {
                  returnObjects: true,
                }) as { title: string; desc: string }[]
              ).map(({ title, desc }, i) => {
                const colors = [
                  'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-800',
                  'bg-orange-50 border-orange-200 dark:bg-orange-900/25 dark:border-orange-800',
                  'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/25 dark:border-yellow-800',
                ]
                return (
                  <div key={i} className={`rounded-xl border p-4 ${colors[i]}`}>
                    <div className="font-semibold text-neutral-800 mb-1 text-sm dark:text-neutral-200">
                      {title}
                    </div>
                    <div className="text-sm text-neutral-700 dark:text-neutral-200">{desc}</div>
                  </div>
                )
              })}
            </div>
            <p className="mt-4">{t('myfitnesspal-vs-calculeat.explanation.why_outro')}</p>
          </section>

          {/* Mid-page CTA */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 dark:bg-primary-900/25 dark:border-primary-800">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900 mb-0.5 dark:text-primary-300">
                {t('myfitnesspal-vs-calculeat.midPageCta.title')}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300">
                {t('myfitnesspal-vs-calculeat.midPageCta.body')}
              </p>
            </div>
            <Link
              to={calcHubHref}
              className="shrink-0 inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {t('myfitnesspal-vs-calculeat.midPageCta.button')}
            </Link>
          </div>

          <FaqBlock items={faqItems} title={t('myfitnesspal-vs-calculeat.faqTitle')} />

          {/* Bottom CTA */}
          <GuestOnly>
            <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                {t('myfitnesspal-vs-calculeat.bottomCta.h2')}
              </h2>
              <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
                {t('myfitnesspal-vs-calculeat.bottomCta.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm dark:bg-neutral-850"
                >
                  {t('myfitnesspal-vs-calculeat.bottomCta.primary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={calcHubHref}
                  className="inline-flex items-center justify-center gap-2 border border-primary-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
                >
                  {t('myfitnesspal-vs-calculeat.bottomCta.secondary')}
                </Link>
              </div>
            </section>
          </GuestOnly>

          {/* Related */}
          <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6 dark:border-neutral-700">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 dark:text-neutral-400">
                {t('myfitnesspal-vs-calculeat.related.calculatorsTitle')}
              </h3>
              <ul className="space-y-2">
                {relatedCalcs.map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-300"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 dark:text-neutral-400">
                {t('myfitnesspal-vs-calculeat.related.articlesTitle')}
              </h3>
              <ul className="space-y-2">
                {relatedArticles.map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-300"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
