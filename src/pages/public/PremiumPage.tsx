import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Check } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

const pageConfig = getPageConfigByKey('premium')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

// Samma rader som UpgradeModal — jämförelsedata bor i premium-namespacet
// (enda källan i UI:t, se docs/PREMIUM_SPEC.md)
const COMPARE_ROWS = [
  'barcode',
  'labelScan',
  'suggestions',
  'history',
  'recipes',
  'meals',
  'tdee',
  'dietModes',
  'calibration',
  'bodyComp',
  'equations',
  'trends',
] as const

export default function PremiumPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-other', { lng })
  const { t: tPremium } = useTranslation('premium', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!

  // Calculeat Premium är en mjukvaruprenumeration (SaaS), inte en fysisk produkt.
  // Product-schema triggade Googles merchant-listing-krav (image/shipping/retur/
  // review) som är irrelevanta här. SoftwareApplication är Googles rätta typ för
  // appar och undviker de kraven helt medan priserna behålls i offers.
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Calculeat Premium',
    description: t('premium.schema.pageDescription'),
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    url: localeEntry.canonical,
    image: `https://calculeat.com/og/premium-${lng}.png`,
    publisher: { '@type': 'Organization', name: 'Calculeat', url: 'https://calculeat.com' },
    offers: [
      {
        '@type': 'Offer',
        price: '45',
        priceCurrency: 'SEK',
        url: localeEntry.canonical,
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        price: '399',
        priceCurrency: 'SEK',
        url: localeEntry.canonical,
        availability: 'https://schema.org/InStock',
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-850">
      <Seo
        title={t('premium.seo.title')}
        description={t('premium.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <JsonLd schema={[softwareSchema]} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8 dark:text-neutral-400">
            <Link
              to="/"
              className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
            >
              Calculeat
            </Link>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {t('premium.breadcrumb')}
            </span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 flex items-center gap-3 dark:text-neutral-100">
            <Sparkles className="h-8 w-8 text-amber-500" aria-hidden="true" />
            {t('premium.h1')}
          </h1>

          <p className="text-lg text-neutral-600 leading-relaxed mb-10 dark:text-neutral-400">
            {t('premium.intro')}
          </p>

          {/* Priskort */}
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div className="rounded-2xl border-2 border-neutral-200 p-6 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {t('premium.plans.monthlyName')}
              </p>
              <p className="mt-2 text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                {t('premium.plans.monthlyPrice')}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('premium.plans.monthlyPeriod')}
              </p>
            </div>
            <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-900/30 dark:to-orange-900/20">
              <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-white">
                {t('premium.plans.yearlyBadge')}
              </span>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {t('premium.plans.yearlyName')}
              </p>
              <p className="mt-2 text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                {t('premium.plans.yearlyPrice')}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('premium.plans.yearlyPeriod')}
              </p>
            </div>
          </div>

          <p className="flex items-center gap-2 text-sm text-neutral-600 mb-8 dark:text-neutral-400">
            <Check className="h-4 w-4 text-success-600 dark:text-success-300" aria-hidden="true" />
            {t('premium.plans.trial')}
          </p>

          {/* CTA */}
          <div className="mb-12">
            <Link
              to="/register"
              className="inline-flex h-12 items-center rounded-xl bg-primary-600 px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              {t('premium.plans.cta')}
            </Link>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('premium.plans.ctaHint')}
            </p>
            <p className="mt-1 text-sm">
              <Link to="/login" className="text-primary-600 hover:underline dark:text-primary-300">
                {t('premium.plans.login')}
              </Link>
            </p>
          </div>

          {/* Jämförelsetabell — samma innehåll som appens UpgradeModal */}
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 dark:text-neutral-100">
            {t('premium.tableTitle')}
          </h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200 mb-6 dark:border-neutral-700">
            <div className="grid grid-cols-[1.2fr_0.9fr_1.2fr] bg-neutral-50 text-sm font-semibold dark:bg-neutral-900">
              <div className="px-4 py-3" />
              <div className="px-3 py-3 text-center text-neutral-500 dark:text-neutral-400">
                {tPremium('upgradeModal.compare.freeHeader')}
              </div>
              <div className="flex items-center justify-center gap-1 bg-amber-100 px-3 py-3 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {tPremium('upgradeModal.compare.premiumHeader')}
              </div>
            </div>
            {COMPARE_ROWS.map(row => (
              <div
                key={row}
                className="grid grid-cols-[1.2fr_0.9fr_1.2fr] border-t border-neutral-100 dark:border-neutral-700 text-sm"
              >
                <div className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-200">
                  {tPremium(`upgradeModal.compare.rows.${row}.label`)}
                </div>
                <div className="px-3 py-3 text-center text-neutral-500 dark:text-neutral-400">
                  {tPremium(`upgradeModal.compare.rows.${row}.free`)}
                </div>
                <div className="bg-amber-50 px-3 py-3 text-center font-medium text-amber-800 dark:bg-amber-900/25 dark:text-amber-300">
                  {tPremium(`upgradeModal.compare.rows.${row}.premium`)}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('premium.dataPromise')}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
