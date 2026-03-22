import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Button } from '@/components/ui/button'
import { FeatureShowcase } from '@/components/FeatureShowcase'
import FeatureCard from '@/components/FeatureCard'
import {
  Apple,
  Calculator,
  Target,
  BarChart3,
  Shield,
  ArrowRight,
  TrendingUp,
  Activity,
  Dumbbell,
  Database,
  Lightbulb,
  BookOpen,
} from 'lucide-react'

export default function FeaturesPage() {
  const { t, ready } = useTranslation(['marketing', 'common'])
  if (!ready) return null

  // Feature overview cards for the hero grid
  const featureOverview = [
    { icon: Calculator, title: t('features.overview.smart'), accentColor: 'primary' as const },
    { icon: Apple, title: t('features.overview.logging'), accentColor: 'accent' as const },
    { icon: Target, title: t('features.overview.goals'), accentColor: 'primary' as const },
    { icon: TrendingUp, title: t('features.overview.progress'), accentColor: 'accent' as const },
    { icon: Dumbbell, title: t('features.overview.macros'), accentColor: 'primary' as const },
    { icon: Activity, title: t('features.overview.body'), accentColor: 'accent' as const },
    { icon: BarChart3, title: t('features.overview.dashboard'), accentColor: 'primary' as const },
    { icon: Database, title: t('features.overview.database'), accentColor: 'accent' as const },
  ]

  // Detailed features with screenshots
  const detailedFeatures = [
    {
      title: t('features.detailed.calculators.title'),
      description: t('features.detailed.calculators.description'),
      screenshotDescription: 'Calculator dashboard med BMR/TDEE resultat och formelval',
      screenshotFilename: 'feature-calculator-dashboard.png',
      imagePosition: 'right' as const,
      highlights: [
        t('features.detailed.calculators.highlight1'),
        t('features.detailed.calculators.highlight2'),
        t('features.detailed.calculators.highlight3'),
        t('features.detailed.calculators.highlight4'),
      ],
    },
    {
      title: t('features.detailed.logging.title'),
      description: t('features.detailed.logging.description'),
      screenshotDescription: 'Kostloggning vy med sökfunktion och makro-översikt',
      screenshotFilename: 'feature-food-logging.png',
      imagePosition: 'left' as const,
      highlights: [
        t('features.detailed.logging.highlight1'),
        t('features.detailed.logging.highlight2'),
        t('features.detailed.logging.highlight3'),
        t('features.detailed.logging.highlight4'),
      ],
    },
    {
      title: t('features.detailed.macros.title'),
      description: t('features.detailed.macros.description'),
      screenshotDescription: 'Makro-program val med NNR, Off-Season och On-Season lägen',
      screenshotFilename: 'feature-macro-modes.png',
      imagePosition: 'right' as const,
      highlights: [
        t('features.detailed.macros.highlight1'),
        t('features.detailed.macros.highlight2'),
        t('features.detailed.macros.highlight3'),
        t('features.detailed.macros.highlight4'),
      ],
    },
    {
      title: t('features.detailed.goals.title'),
      description: t('features.detailed.goals.description'),
      screenshotDescription: 'Målsättning dashboard med viktmål och progress graf',
      screenshotFilename: 'feature-goals-tracking.png',
      imagePosition: 'left' as const,
      highlights: [
        t('features.detailed.goals.highlight1'),
        t('features.detailed.goals.highlight2'),
        t('features.detailed.goals.highlight3'),
        t('features.detailed.goals.highlight4'),
      ],
    },
    {
      title: t('features.detailed.body.title'),
      description: t('features.detailed.body.description'),
      screenshotDescription: 'Kroppskomposition mätningar med olika formler',
      screenshotFilename: 'feature-body-composition.png',
      imagePosition: 'right' as const,
      highlights: [
        t('features.detailed.body.highlight1'),
        t('features.detailed.body.highlight2'),
        t('features.detailed.body.highlight3'),
        t('features.detailed.body.highlight4'),
      ],
    },
    {
      title: t('features.detailed.dashboard.title'),
      description: t('features.detailed.dashboard.description'),
      screenshotDescription: 'Dashboard med kalori-ring, makro-bar och statistik',
      screenshotFilename: 'feature-dashboard.png',
      imagePosition: 'left' as const,
      highlights: [
        t('features.detailed.dashboard.highlight1'),
        t('features.detailed.dashboard.highlight2'),
        t('features.detailed.dashboard.highlight3'),
        t('features.detailed.dashboard.highlight4'),
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
              {t('features.hero.title').replace(t('features.hero.titleHighlight'), '')}<span className="text-primary-600">{t('features.hero.titleHighlight')}</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto mb-12">
              {t('features.hero.subtitle')}
            </p>

            {/* Feature Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {featureOverview.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div
                    className={`inline-flex rounded-xl ${
                      feature.accentColor === 'primary' ? 'bg-primary-100' : 'bg-accent-100'
                    } p-3 ${
                      feature.accentColor === 'primary' ? 'text-primary-600' : 'text-accent-600'
                    } mb-3`}
                  >
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Feature Showcases */}
        <div className="bg-white">
          {detailedFeatures.map((feature, index) => (
            <FeatureShowcase key={index} {...feature} />
          ))}
        </div>

        {/* Additional Features - Quick Grid */}
        <section className="py-20 md:py-28 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
                {t('features.more.title')}
              </h2>
              <p className="text-lg md:text-xl text-neutral-600">
                {t('features.more.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                icon={Lightbulb}
                title={t('features.more.density.title')}
                description={t('features.more.density.description')}
                accentColor="primary"
              />
              <FeatureCard
                icon={BookOpen}
                title={t('features.more.recipes.title')}
                description={t('features.more.recipes.description')}
                accentColor="accent"
              />
              <FeatureCard
                icon={Shield}
                title={t('features.more.security.title')}
                description={t('features.more.security.description')}
                accentColor="primary"
              />
            </div>
          </div>
        </section>

        {/* Get Started CTA */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-20 md:py-28 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,139,0,0.15),transparent_50%)]" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('features.cta.title')}
            </h2>
            <p className="text-lg md:text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
              {t('features.cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="accent" className="shadow-2xl" asChild>
                <Link to="/register">
                  {t('features.cta.button')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                asChild
              >
                <Link to="/">{t('features.cta.back')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
