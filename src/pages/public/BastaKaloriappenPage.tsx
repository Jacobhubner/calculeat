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
type ForWhomItem = { title: string; winner: string; desc: string }
type WhyFailCard = { title: string; desc: string }

// App names and CellType data stay in TSX — not translatable content
const APPS = ['Calculeat', 'MyFitnessPal', 'MacroFactor', 'Lifesum', 'Yazio'] as const
type App = (typeof APPS)[number]

const CELL_DATA: Record<App, CellType>[] = [
  { Calculeat: 'yes', MyFitnessPal: 'yes', MacroFactor: 'yes', Lifesum: 'yes', Yazio: 'yes' },
  { Calculeat: 'yes', MyFitnessPal: 'yes', MacroFactor: 'yes', Lifesum: 'yes', Yazio: 'yes' },
  { Calculeat: 'partial', MyFitnessPal: 'yes', MacroFactor: 'yes', Lifesum: 'yes', Yazio: 'yes' },
  {
    Calculeat: 'yes',
    MyFitnessPal: 'partial',
    MacroFactor: 'yes',
    Lifesum: 'partial',
    Yazio: 'partial',
  },
  { Calculeat: 'yes', MyFitnessPal: 'no', MacroFactor: 'yes', Lifesum: 'no', Yazio: 'no' },
  { Calculeat: 'yes', MyFitnessPal: 'no', MacroFactor: 'partial', Lifesum: 'no', Yazio: 'no' },
  { Calculeat: 'yes', MyFitnessPal: 'no', MacroFactor: 'no', Lifesum: 'no', Yazio: 'no' },
  {
    Calculeat: 'yes',
    MyFitnessPal: 'partial',
    MacroFactor: 'yes',
    Lifesum: 'partial',
    Yazio: 'partial',
  },
  {
    Calculeat: 'yes',
    MyFitnessPal: 'yes',
    MacroFactor: 'yes',
    Lifesum: 'partial',
    Yazio: 'partial',
  },
  { Calculeat: 'yes', MyFitnessPal: 'no', MacroFactor: 'partial', Lifesum: 'no', Yazio: 'no' },
  { Calculeat: 'yes', MyFitnessPal: 'partial', MacroFactor: 'no', Lifesum: 'yes', Yazio: 'yes' },
]

const FOR_WHOM_COLORS = [
  'bg-primary-50 border-primary-200 dark:bg-primary-900/25 dark:border-primary-800',
  'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
  'bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-800',
  'bg-orange-50 border-orange-200 dark:bg-orange-900/25 dark:border-orange-800',
  'bg-neutral-50 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900',
]

const WHY_FAIL_COLORS = [
  'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-800',
  'bg-orange-50 border-orange-200 dark:bg-orange-900/25 dark:border-orange-800',
  'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/25 dark:border-yellow-800',
]

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

const pageConfig = getPageConfigByKey('best-calorie-app')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BastaKaloriappenPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-compare', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('best-calorie-app.faq', { returnObjects: true }) as unknown as FaqItem[]
  const localeRows = t('best-calorie-app.comparisonRows', {
    returnObjects: true,
  }) as unknown as LocaleRow[]
  const forWhom = t('best-calorie-app.forWhom', { returnObjects: true }) as unknown as ForWhomItem[]
  const whyFailCards = t('best-calorie-app.whyFailCards', {
    returnObjects: true,
  }) as unknown as WhyFailCard[]
  const relatedCalcs = t('best-calorie-app.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('best-calorie-app.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]

  const calcHubHref = lng === 'en' ? '/en/calculators' : '/kalkylatorer'
  const deficitHref =
    lng === 'en' ? '/en/calculators/calorie-deficit-calculator' : '/kalkylatorer/kaloriunderskott'

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t('best-calorie-app.schema.headline'),
      description: t('best-calorie-app.schema.description'),
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
          name: t('best-calorie-app.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-850">
      <Seo
        title={t('best-calorie-app.seo.title')}
        description={t('best-calorie-app.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
        noindex={pageConfig.noindex}
      />
      <JsonLd schema={pageSchema} />
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6 dark:text-neutral-400">
            <Link
              to="/"
              className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
            >
              Calculeat
            </Link>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {t('best-calorie-app.breadcrumb.pageLabel')}
            </span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight dark:text-neutral-100">
            {t('best-calorie-app.h1')}
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-3 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg dark:text-neutral-400">
            {t('best-calorie-app.intro')}
          </p>
          <p className="text-sm text-neutral-500 mb-8 pl-4 dark:text-neutral-400">
            <strong className="text-neutral-700 dark:text-neutral-200">
              {t('best-calorie-app.shortVersion')}
            </strong>{' '}
            {t('best-calorie-app.shortVersionBody')}
          </p>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 dark:text-neutral-100">
              {t('best-calorie-app.comparisonTable.h2')}
            </h2>
            <div className="rounded-2xl border border-neutral-200 overflow-x-auto dark:border-neutral-700">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider min-w-[160px] dark:text-neutral-400">
                      {t('best-calorie-app.comparisonTable.colFeature')}
                    </th>
                    {APPS.map(app => (
                      <th
                        key={app}
                        className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-center w-24 ${app === 'Calculeat' ? 'text-primary-600 dark:text-primary-300' : 'text-neutral-500 dark:text-neutral-400'}`}
                      >
                        {app}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localeRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white dark:bg-neutral-850' : 'bg-neutral-50/50 dark:bg-neutral-900/50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-neutral-800 font-medium dark:text-neutral-200">
                          {row.feature}
                        </div>
                        {row.note && (
                          <div className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">
                            {row.note}
                          </div>
                        )}
                      </td>
                      {APPS.map(app => (
                        <td key={app} className="px-3 py-3 text-center">
                          <div className="flex justify-center">
                            <Cell type={CELL_DATA[i]?.[app] ?? 'no'} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 dark:text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/25">
                  <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
                </span>
                {t('best-calorie-app.comparisonTable.legendYes')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/25">
                  <Minus className="h-3 w-3 text-yellow-600 dark:text-yellow-300" />
                </span>
                {t('best-calorie-app.comparisonTable.legendPartial')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/25">
                  <X className="h-3 w-3 text-red-600 dark:text-red-300" />
                </span>
                {t('best-calorie-app.comparisonTable.legendNo')}
              </span>
            </div>
          </section>

          {/* For whom */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-5 dark:text-neutral-100">
              {t('best-calorie-app.forWhomH2')}
            </h2>
            <div className="space-y-4">
              {forWhom.map((item, i) => (
                <div
                  key={item.title}
                  className={`rounded-xl border p-5 ${FOR_WHOM_COLORS[i] ?? 'bg-neutral-50 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {item.title}
                    </div>
                    <div className="text-xs font-semibold text-neutral-600 bg-white/70 rounded-lg px-2 py-1 whitespace-nowrap shrink-0 dark:text-neutral-400 dark:bg-neutral-800/70">
                      {item.winner}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed dark:text-neutral-200">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Why classic apps fail */}
          <section className="mb-12 space-y-4 text-sm text-neutral-700 leading-relaxed dark:text-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t('best-calorie-app.whyFailH2')}
            </h2>
            <p>{t('best-calorie-app.whyFailIntro')}</p>
            <div className="space-y-3">
              {whyFailCards.map((card, i) => (
                <div
                  key={card.title}
                  className={`rounded-xl border p-4 ${WHY_FAIL_COLORS[i] ?? 'bg-neutral-50 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900'}`}
                >
                  <div className="font-semibold text-neutral-800 mb-1 dark:text-neutral-200">
                    {card.title}
                  </div>
                  <div className="text-neutral-700 dark:text-neutral-200">{card.desc}</div>
                </div>
              ))}
            </div>
            <p>{t('best-calorie-app.whyFailOutro')}</p>
          </section>

          {/* Internal link block */}
          <section className="mb-12 rounded-2xl bg-neutral-50 border border-neutral-200 p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-800 mb-3 dark:text-neutral-200">
              {t('best-calorie-app.internalCtaH2')}
            </h2>
            <p className="text-sm text-neutral-600 mb-4 dark:text-neutral-400">
              {t('best-calorie-app.internalCtaBody')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to={calcHubHref}
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                {t('best-calorie-app.internalCtaPrimary')}
              </Link>
              <Link
                to={deficitHref}
                className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 font-medium px-4 py-2.5 rounded-xl hover:bg-white transition-colors text-sm dark:border-neutral-600 dark:text-neutral-200"
              >
                <ArrowRight className="h-4 w-4" />
                {t('best-calorie-app.internalCtaSecondary')}
              </Link>
            </div>
          </section>

          <FaqBlock items={faqItems} title={t('best-calorie-app.faqTitle')} />

          <GuestOnly>
            <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                {t('best-calorie-app.bottomCta.h2')}
              </h2>
              <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
                {t('best-calorie-app.bottomCta.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm dark:bg-neutral-850"
                >
                  {t('best-calorie-app.bottomCta.primary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={calcHubHref}
                  className="inline-flex items-center justify-center gap-2 border border-primary-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
                >
                  {t('best-calorie-app.bottomCta.secondary')}
                </Link>
              </div>
            </section>
          </GuestOnly>

          <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6 dark:border-neutral-700">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 dark:text-neutral-400">
                {t('best-calorie-app.related.calculatorsTitle')}
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
                {t('best-calorie-app.related.articlesTitle')}
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
