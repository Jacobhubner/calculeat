import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type ArticleItem = { href: string; title: string; description: string; pillar: boolean }

const pageConfig = getPageConfigByKey('articles-hub')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function ArtikelnHubPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-hubs', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const articles = t('articles-hub.articles', { returnObjects: true }) as unknown as ArticleItem[]

  const calcHubHref = lng === 'en' ? '/en/calculators' : '/kalkylatorer'

  return (
    <>
      <Seo
        title={t('articles-hub.seo.title')}
        description={t('articles-hub.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />

      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-white border-b border-neutral-100 py-14 md:py-20 dark:bg-neutral-850">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6 dark:bg-primary-900/25 dark:text-primary-300">
                <BookOpen className="h-4 w-4" />
                {t('articles-hub.badgeLabel')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 dark:text-neutral-100">
                {t('articles-hub.h1')}
              </h1>
              <p className="text-lg text-neutral-600 mb-8 dark:text-neutral-400">
                {t('articles-hub.intro')}
              </p>
              <Link
                to={articles[0]?.href ?? localeEntry.canonical}
                className="inline-flex items-center gap-2 bg-primary-500 text-on-primary font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
              >
                {t('articles-hub.ctaButton')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Article grid */}
          <section className="py-14 md:py-20 bg-neutral-50 dark:bg-neutral-900">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map(article => (
                  <Link
                    key={article.href}
                    to={article.href}
                    className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:border-primary-200 transition-all flex flex-col dark:border-neutral-700 dark:bg-neutral-850"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors leading-snug dark:text-neutral-100">
                        {article.title}
                      </h2>
                      {article.pillar && (
                        <span className="ml-2 flex-shrink-0 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium dark:bg-primary-900/25 dark:text-primary-300">
                          {t('articles-hub.pillarTag')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed flex-1 dark:text-neutral-400">
                      {article.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-primary-600 font-medium dark:text-primary-300">
                      {t('articles-hub.readLabel')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="bg-white border-t border-neutral-100 py-14 dark:bg-neutral-850">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3 dark:text-neutral-100">
                {t('articles-hub.bottomCta.h2')}
              </h2>
              <p className="text-neutral-600 mb-6 dark:text-neutral-400">
                {t('articles-hub.bottomCta.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={calcHubHref}
                  className="inline-flex items-center justify-center gap-2 bg-primary-500 text-on-primary font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
                >
                  {t('articles-hub.bottomCta.primaryButton')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <GuestOnly>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 border border-neutral-300 text-neutral-700 font-medium px-6 py-3 rounded-xl hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200"
                  >
                    {t('articles-hub.bottomCta.secondaryButton')}
                  </Link>
                </GuestOnly>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
