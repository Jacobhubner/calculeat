import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { HeroSection } from '@/components/HeroSection'
import { HowItWorks } from '@/components/HowItWorks'
import { Button } from '@/components/ui/button'
import { Scan, Share2, ChefHat, Scale, Target, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const { t, ready } = useTranslation(['marketing', 'common'])
  const { user } = useAuth()

  if (user) return <Navigate to="/app" replace />

  if (!ready) return null

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Feature Showcase Section — 4 stora kort */}
        <section id="features" className="py-16 md:py-20 bg-white border-t border-neutral-100">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3">
                {t('home.hero.featuresTitle')}
              </h2>
              <p className="text-lg text-neutral-600">{t('home.hero.featuresSubtitle')}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-100 text-primary-600">
                  <Scan className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    {t('home.features.scan.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t('home.features.scan.description')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-100 text-accent-600">
                  <ChefHat className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    {t('home.features.recipes.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t('home.features.recipes.description')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-100 text-primary-600">
                  <Share2 className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    {t('home.features.share.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t('home.features.share.description')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-100 text-accent-600">
                  <Scale className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    {t('home.features.body.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t('home.features.body.description')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-100 text-primary-600">
                  <Target className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    {t('home.features.goals.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t('home.features.goals.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Tools Section */}
        <section className="py-14 md:py-20 bg-neutral-50 border-t border-neutral-100">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
                    Populära verktyg
                  </h2>
                  <p className="text-neutral-600 text-sm">Gratis kalkylatorer och guider</p>
                </div>
                <Link
                  to="/kalkylatorer"
                  className="hidden sm:flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  Alla kalkylatorer
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Link
                  to="/kalkylatorer/tdee-kalkylator"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <p className="text-xs text-primary-600 font-medium mb-1">Kalkylator</p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5">
                    TDEE-kalkylator
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Beräkna ditt totala dagliga energibehov
                  </p>
                </Link>

                <Link
                  to="/kalkylatorer/kaloriunderskott"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <p className="text-xs text-primary-600 font-medium mb-1">Kalkylator</p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5">
                    Kaloriunderskott
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Hur stort underskott behöver du?
                  </p>
                </Link>

                <Link
                  to="/kalkylatorer/bmi-kalkylator"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <p className="text-xs text-primary-600 font-medium mb-1">Kalkylator</p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5">
                    BMI-kalkylator
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Räkna ut ditt body mass index
                  </p>
                </Link>

                <Link
                  to="/artiklar/kaloribehov"
                  className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <p className="text-xs text-accent-600 font-medium mb-1">Artikel</p>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-1.5">
                    Kaloribehov
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Hur mycket ska du äta egentligen?
                  </p>
                </Link>
              </div>

              <div className="flex sm:hidden justify-center">
                <Link
                  to="/kalkylatorer"
                  className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  Alla kalkylatorer
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Process section */}
        <HowItWorks />

        {/* CTA Footer */}
        <section className="bg-neutral-900 py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              {t('home.cta.title')}
            </h2>
            <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto">
              {t('home.cta.description')}
            </p>

            <Button size="lg" variant="accent" className="shadow-lg hover:shadow-xl mb-8" asChild>
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
