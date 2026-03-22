import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SmartCalculator from '@/components/SmartCalculator'
import { HeroSection } from '@/components/HeroSection'
import { HowItWorks } from '@/components/HowItWorks'
import { Button } from '@/components/ui/button'
import { Scan, Share2, ChefHat, Scale, Target } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const { t, ready } = useTranslation(['marketing', 'common'])

  // Redirect logged-in users to the app
  if (user) {
    return <Navigate to="/app" replace />
  }

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
              <p className="text-lg text-neutral-600">
                {t('home.hero.featuresSubtitle')}
              </p>
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

        {/* Calculator Section */}
        <section id="calculator" className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4">
                {t('home.calculator.title')}
              </h2>
              <p className="text-lg md:text-xl text-neutral-600">
                {t('home.calculator.subtitle')}
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SmartCalculator />
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
