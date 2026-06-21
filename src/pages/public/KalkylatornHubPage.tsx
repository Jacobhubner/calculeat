import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calculator, ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type CalcItem = { href: string; title: string; description: string; popular: boolean }

const pageConfig = getPageConfigByKey('calculators-hub')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function KalkylatornHubPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-hubs', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const calculators = t('calculators-hub.calculators', {
    returnObjects: true,
  }) as unknown as CalcItem[]

  return (
    <>
      <Seo
        title={t('calculators-hub.seo.title')}
        description={t('calculators-hub.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />

      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-white border-b border-neutral-100 py-14 md:py-20">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Calculator className="h-4 w-4" />
                {t('calculators-hub.badgeLabel')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                {t('calculators-hub.h1')}
              </h1>
              <p className="text-lg text-neutral-600 mb-8">{t('calculators-hub.intro')}</p>
              <Link
                to={calculators[0]?.href ?? localeEntry.canonical}
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
              >
                {t('calculators-hub.ctaButton')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Calculator grid */}
          <section className="py-14 md:py-20 bg-neutral-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {calculators.map(calc => (
                  <Link
                    key={calc.href}
                    to={calc.href}
                    className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:border-primary-200 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors leading-snug">
                        {calc.title}
                      </h2>
                      {calc.popular && (
                        <span className="ml-2 flex-shrink-0 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          {t('calculators-hub.popularTag')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed flex-1">
                      {calc.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-primary-600 font-medium">
                      {t('calculators-hub.openLabel')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="bg-white border-t border-neutral-100 py-14">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                {t('calculators-hub.bottomCta.h2')}
              </h2>
              <p className="text-neutral-600 mb-6">{t('calculators-hub.bottomCta.body')}</p>
              <GuestOnly>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
                >
                  {t('calculators-hub.bottomCta.button')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </GuestOnly>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
