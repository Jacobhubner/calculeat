import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Seo } from '@/components/seo/Seo'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { HeroSection } from '@/components/HeroSection'
import { HowItWorks } from '@/components/HowItWorks'
import { Button } from '@/components/ui/button'
import {
  Scan,
  Share2,
  ChefHat,
  Scale,
  Target,
  ArrowRight,
  Database,
  Activity,
  Calculator,
  Bookmark,
} from 'lucide-react'

const homeConfig = getPageConfigByKey('home')!
const hreflangAlternates = getHreflangAlternates(homeConfig)

export default function HomePage() {
  const { t, ready } = useTranslation(['marketing', 'common'])
  const { user } = useAuth()
  const { pathname } = useLocation()
  const lng = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'sv'
  const localeEntry = homeConfig.locales[lng] ?? homeConfig.locales.sv!

  // Anonyma gästsessioner (supportchatt) ska stanna på publika sidor
  if (user && !user.is_anonymous) return <Navigate to="/app" replace />

  if (!ready) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={t('marketing:home.seo.title')}
        description={t('marketing:home.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Feature Showcase Section — 4 stora kort */}
        <section
          id="features"
          className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50 border-t border-neutral-100 dark:from-neutral-900 dark:to-neutral-950 dark:border-neutral-800"
        >
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              {/* Gradienttexten klipps mot bakgrunden — mot mörk botten behöver
                  stoppen ljusare toner för att inte falla ihop till en grumlig
                  klump. */}
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-950 mb-4 bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent dark:from-primary-300 dark:to-emerald-300">
                {t('home.hero.featuresTitle')}
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed dark:text-neutral-300">
                {t('home.hero.featuresSubtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Row 1: Top priority features for new users */}
              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50/80 to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-green-900/20 dark:to-emerald-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-600/10 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300">
                  <Scan className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.scan.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.scan.description')}
                  </p>
                </div>
              </div>

              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 p-6 dark:border-neutral-800 dark:from-blue-900/20 dark:to-cyan-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-600/10 text-accent-700 dark:bg-accent-900/25 dark:text-accent-300">
                  <Database className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.database.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.database.description')}
                  </p>
                </div>
              </div>

              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50/80 to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-green-900/20 dark:to-emerald-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-600/10 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300">
                  <Bookmark className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.savedMeals.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.savedMeals.description')}
                  </p>
                </div>
              </div>

              {/* Row 2: Core features */}
              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 p-6 dark:border-neutral-800 dark:from-blue-900/20 dark:to-cyan-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-600/10 text-accent-700 dark:bg-accent-900/25 dark:text-accent-300">
                  <ChefHat className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.recipes.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.recipes.description')}
                  </p>
                </div>
              </div>

              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50/80 to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-green-900/20 dark:to-emerald-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-600/10 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300">
                  <Target className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.goals.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.goals.description')}
                  </p>
                </div>
              </div>

              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 p-6 dark:border-neutral-800 dark:from-blue-900/20 dark:to-cyan-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-600/10 text-accent-700 dark:bg-accent-900/25 dark:text-accent-300">
                  <Share2 className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.share.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.share.description')}
                  </p>
                </div>
              </div>

              {/* Row 3: Advanced features */}
              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50/80 to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-green-900/20 dark:to-emerald-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-600/10 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300">
                  <Calculator className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.portions.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.portions.description')}
                  </p>
                </div>
              </div>

              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 p-6 dark:border-neutral-800 dark:from-blue-900/20 dark:to-cyan-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-600/10 text-accent-700 dark:bg-accent-900/25 dark:text-accent-300">
                  <Scale className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.body.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.body.description')}
                  </p>
                </div>
              </div>

              <div className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-green-50/80 to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-green-900/20 dark:to-emerald-900/10 flex gap-5 items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-600/10 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300">
                  <Activity className="h-8 w-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950 text-lg mb-2 dark:text-neutral-50">
                    {t('home.features.calibration.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {t('home.features.calibration.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Tools Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white border-t border-neutral-100 dark:from-neutral-950 dark:to-neutral-900 dark:border-neutral-800">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-950 mb-2 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-300 dark:to-blue-300">
                    {t('popularTools.title')}
                  </h2>
                  <p className="text-neutral-600 text-base dark:text-neutral-300">
                    {t('popularTools.subtitle')}
                  </p>
                </div>
                <Link
                  to="/kalkylatorer"
                  className="hidden sm:flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors dark:text-primary-300 dark:hover:text-primary-200"
                >
                  {t('popularTools.allCalculators')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Link
                  to="/kalkylatorer/tdee-kalkylator"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-primary-700"
                >
                  <p className="text-xs text-primary-600 font-medium mb-1 dark:text-primary-300">
                    {t('popularTools.typeCalculator')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-primary-300">
                    {t('popularTools.tools.tdee.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularTools.tools.tdee.description')}
                  </p>
                </Link>

                <Link
                  to="/kalkylatorer/kaloriunderskott"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-primary-700"
                >
                  <p className="text-xs text-primary-600 font-medium mb-1 dark:text-primary-300">
                    {t('popularTools.typeCalculator')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-primary-300">
                    {t('popularTools.tools.deficit.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularTools.tools.deficit.description')}
                  </p>
                </Link>

                <Link
                  to="/kalkylatorer/bmi-kalkylator"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-primary-700"
                >
                  <p className="text-xs text-primary-600 font-medium mb-1 dark:text-primary-300">
                    {t('popularTools.typeCalculator')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-primary-300">
                    {t('popularTools.tools.bmi.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularTools.tools.bmi.description')}
                  </p>
                </Link>

                <Link
                  to="/artiklar/kaloribehov"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-primary-700"
                >
                  <p className="text-xs text-accent-600 font-medium mb-1 dark:text-accent-300">
                    {t('popularTools.typeArticle')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-primary-300">
                    {t('popularTools.tools.calorieneeds.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularTools.tools.calorieneeds.description')}
                  </p>
                </Link>
              </div>

              <div className="flex sm:hidden justify-center">
                <Link
                  to="/kalkylatorer"
                  className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors dark:text-primary-300 dark:hover:text-primary-200"
                >
                  {t('popularTools.allCalculators')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Articles Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50 border-t border-neutral-100 dark:from-neutral-900 dark:to-neutral-950 dark:border-neutral-800">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-950 mb-2 bg-gradient-to-r from-accent-600 to-green-600 bg-clip-text text-transparent dark:from-accent-300 dark:to-green-300">
                    {t('popularArticles.title')}
                  </h2>
                  <p className="text-neutral-600 text-base dark:text-neutral-300">
                    {t('popularArticles.subtitle')}
                  </p>
                </div>
                <Link
                  to="/artiklar"
                  className="hidden sm:flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors dark:text-primary-300 dark:hover:text-primary-200"
                >
                  {t('popularArticles.allArticles')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Link
                  to="/artiklar/kaloribehov"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-accent-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-accent-700"
                >
                  <p className="text-xs text-accent-600 font-medium mb-1 dark:text-accent-300">
                    {t('popularArticles.typeArticle')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-accent-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-accent-300">
                    {t('popularArticles.articles.calorieneeds.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularArticles.articles.calorieneeds.description')}
                  </p>
                </Link>

                <Link
                  to="/artiklar/vad-ar-tdee"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-accent-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-accent-700"
                >
                  <p className="text-xs text-accent-600 font-medium mb-1 dark:text-accent-300">
                    {t('popularArticles.typeArticle')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-accent-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-accent-300">
                    {t('popularArticles.articles.tdee.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularArticles.articles.tdee.description')}
                  </p>
                </Link>

                <Link
                  to="/artiklar/kaloribrist"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-accent-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-accent-700"
                >
                  <p className="text-xs text-accent-600 font-medium mb-1 dark:text-accent-300">
                    {t('popularArticles.typeArticle')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-accent-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-accent-300">
                    {t('popularArticles.articles.caloriedeficit.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularArticles.articles.caloriedeficit.description')}
                  </p>
                </Link>

                <Link
                  to="/artiklar/bulk-och-cut"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-accent-200 transition-all dark:bg-neutral-850 dark:border-neutral-800 dark:hover:border-accent-700"
                >
                  <p className="text-xs text-accent-600 font-medium mb-1 dark:text-accent-300">
                    {t('popularArticles.typeArticle')}
                  </p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-accent-700 transition-colors mb-1.5 dark:text-neutral-100 dark:group-hover:text-accent-300">
                    {t('popularArticles.articles.bulkandcut.title')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
                    {t('popularArticles.articles.bulkandcut.description')}
                  </p>
                </Link>
              </div>

              <div className="flex sm:hidden justify-center">
                <Link
                  to="/artiklar"
                  className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors dark:text-primary-300 dark:hover:text-primary-200"
                >
                  {t('popularArticles.allArticles')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Process section */}
        <HowItWorks />

        {/* CTA Footer */}
        {/* Redan mörk i ljust läge. I mörkt läge ligger den mot en nästan lika
            mörk sida, så den tappar sin avgränsning — en toppram återger kanten
            utan att sektionen behöver byta karaktär. */}
        <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-24 md:py-32 relative overflow-hidden dark:border-t dark:border-neutral-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(87,134,29,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.08),transparent_50%)]" />

          <div className="container relative mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              {t('home.cta.title')}
            </h2>
            <p className="text-lg md:text-xl text-neutral-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('home.cta.description')}
            </p>

            <Button
              size="lg"
              variant="accent"
              className="shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all mb-8"
              asChild
            >
              <Link to="/register">{t('home.cta.createAccount')}</Link>
            </Button>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-sm text-neutral-400">
              <span>{t('home.cta.noPaid')}</span>
              <span>{t('home.cta.secure')}</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
