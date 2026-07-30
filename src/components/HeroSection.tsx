import { Link } from 'react-router'
import {
  ArrowRight,
  Calculator,
  Scan,
  ChefHat,
  Users,
  Scale,
  LayoutGrid,
  Database,
  Activity,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'

export function HeroSection() {
  const { t } = useTranslation('marketing')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-white pt-20 pb-48 md:pt-32 md:pb-56">
      {/* Bold gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,189,0,0.15),transparent_60%)] mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(14,165,233,0.1),transparent_60%)] mix-blend-screen" />

      <div className="container relative mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">
                {t('home.hero.tagline')}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-950 leading-tight">
                {t('home.hero.h1')}{' '}
                <span className="block mt-4">
                  <span className="inline-flex items-center gap-4 align-middle flex-wrap justify-center lg:justify-start">
                    <span>Enkelt med</span>
                    <img
                      src="/calculeat-logo-full.svg"
                      alt="Calculeat"
                      className="h-40 md:h-56 lg:h-72 object-contain"
                    />
                  </span>
                </span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-700 max-w-2xl mx-auto lg:mx-0">
                {t('home.hero.body')}
              </p>
              <p className="text-sm text-neutral-500 max-w-2xl mx-auto lg:mx-0">
                {t('home.hero.subtext')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                variant="accent"
                className="text-base font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                <Link to="/register">
                  {t('home.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base font-semibold bg-white border-neutral-300 hover:bg-neutral-50 text-neutral-900"
              >
                <Link to="/kalkylatorer/tdee-kalkylator">
                  <Calculator className="mr-2 h-5 w-5" />
                  {t('home.hero.ctaSecondary')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column - Feature tiles preview */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                {/* Card header */}
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-neutral-100">
                  <LayoutGrid className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-neutral-700">
                    {t('home.hero.cardHeader')}
                  </span>
                </div>

                {/* 3x2 feature tile grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-primary-50 border border-primary-200 p-4 flex flex-col gap-2">
                    <Scan className="h-5 w-5 text-primary-600" strokeWidth={2} />
                    <p className="text-sm font-medium text-neutral-700">{t('home.hero.tile1')}</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 border border-accent-200 p-4 flex flex-col gap-2">
                    <Database className="h-5 w-5 text-accent-600" strokeWidth={2} />
                    <p className="text-sm font-medium text-neutral-700">{t('home.hero.tile2')}</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 border border-primary-200 p-4 flex flex-col gap-2">
                    <Activity className="h-5 w-5 text-primary-600" strokeWidth={2} />
                    <p className="text-sm font-medium text-neutral-700">{t('home.hero.tile3')}</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 border border-accent-200 p-4 flex flex-col gap-2">
                    <Users className="h-5 w-5 text-accent-600" strokeWidth={2} />
                    <p className="text-sm font-medium text-neutral-700">{t('home.hero.tile4')}</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 border border-primary-200 p-4 flex flex-col gap-2">
                    <ChefHat className="h-5 w-5 text-primary-600" strokeWidth={2} />
                    <p className="text-sm font-medium text-neutral-700">{t('home.hero.tile5')}</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 border border-accent-200 p-4 flex flex-col gap-2">
                    <Scale className="h-5 w-5 text-accent-600" strokeWidth={2} />
                    <p className="text-sm font-medium text-neutral-700">{t('home.hero.tile6')}</p>
                  </div>
                </div>

                {/* Footer line */}
                <div className="text-xs text-neutral-400">{t('home.hero.cardFooter')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
