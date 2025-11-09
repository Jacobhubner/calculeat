import { Link } from 'react-router-dom'
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
  // Feature overview cards for the hero grid
  const featureOverview = [
    { icon: Calculator, title: 'Smart Kalkyler', accentColor: 'primary' as const },
    { icon: Apple, title: 'Kostloggning', accentColor: 'accent' as const },
    { icon: Target, title: 'Målsättning', accentColor: 'primary' as const },
    { icon: TrendingUp, title: 'Progress Tracking', accentColor: 'accent' as const },
    { icon: Dumbbell, title: 'Makro-program', accentColor: 'primary' as const },
    { icon: Activity, title: 'Kroppskomposition', accentColor: 'accent' as const },
    { icon: BarChart3, title: 'Dashboard', accentColor: 'primary' as const },
    { icon: Database, title: 'Livsmedelsdatabas', accentColor: 'accent' as const },
  ]

  // Detailed features with screenshots
  const detailedFeatures = [
    {
      title: 'Vetenskapliga Kalkyler',
      description:
        'Välj mellan 10 olika BMR-formler och 6 PAL-system för maximalt exakta beräkningar anpassade efter din situation. Från Mifflin-St Jeor till Cunningham och Oxford/Henry - vi har alla formler du behöver.',
      screenshotDescription: 'Calculator dashboard med BMR/TDEE resultat och formelval',
      screenshotFilename: 'feature-calculator-dashboard.png',
      imagePosition: 'right' as const,
      highlights: [
        '10 BMR-formler för olika situationer',
        '6 PAL-system för exakt TDEE',
        'BMI och idealviktsberäkningar',
        'Personaliserade kalorimål baserat på dina mål',
      ],
    },
    {
      title: 'Enkel Kostloggning',
      description:
        'Logga dina måltider snabbt och enkelt med vår omfattande livsmedelsdatabas. Spara favoritmåltider, recept och få automatisk makroberäkning. Kaloritäthetssystemet hjälper dig göra smartare matval.',
      screenshotDescription: 'Kostloggning vy med sökfunktion och makro-översikt',
      screenshotFilename: 'feature-food-logging.png',
      imagePosition: 'left' as const,
      highlights: [
        'Omfattande livsmedelsdatabas',
        'Automatisk makroberäkning',
        'Spara favoritmåltider och recept',
        'Kaloritäthetssystem med färgkodning',
      ],
    },
    {
      title: 'Professionella Makro-program',
      description:
        'Förinställda makroprogram för olika mål - från hälsosam kost enligt NNR (Nordiska näringsrekommendationer) till bodybuilding-specifika lägen för bulk och cut. Anpassa efter dina behov.',
      screenshotDescription: 'Makro-program val med NNR, Off-Season och On-Season lägen',
      screenshotFilename: 'feature-macro-modes.png',
      imagePosition: 'right' as const,
      highlights: [
        'NNR-läge för hälsosam kost',
        'Off-Season läge för muskeltillväxt',
        'On-Season läge för fettförbränning',
        'Anpassade makromallar',
      ],
    },
    {
      title: 'Målsättning & Tracking',
      description:
        'Sätt personliga mål för vikt, kalorier och makron. Få daglig feedback på din progress och se trender över tid. Avancerade proteinberäkningar tar hänsyn till din aktivitetsnivå och mål.',
      screenshotDescription: 'Målsättning dashboard med viktmål och progress graf',
      screenshotFilename: 'feature-goals-tracking.png',
      imagePosition: 'left' as const,
      highlights: [
        'Viktmål med tidslinje',
        'Aktivitetsbaserade proteinbehov',
        'Makromål med hormonal hänsyn',
        'Progress visualisering',
      ],
    },
    {
      title: 'Kroppskomposition',
      description:
        'Mät din kroppssammansättning med 12 professionella metoder - från caliper-mätningar till bandmätningar. Följ din fettfria massa och fettprocent över tid.',
      screenshotDescription: 'Kroppskomposition mätningar med olika formler',
      screenshotFilename: 'feature-body-composition.png',
      imagePosition: 'right' as const,
      highlights: [
        '12 olika mätmetoder',
        'Jackson/Pollock, Durnin/Womersley, U.S. Navy',
        'Caliper- och bandmätningar',
        'Historik över tid',
      ],
    },
    {
      title: 'Dashboard & Insikter',
      description:
        'Få en tydlig översikt över dina näringsintag och framsteg med visuella grafer och statistik. Se daglig översikt, vecko- och månadsrapporter på ett ställe.',
      screenshotDescription: 'Dashboard med kalori-ring, makro-bar och statistik',
      screenshotFilename: 'feature-dashboard.png',
      imagePosition: 'left' as const,
      highlights: [
        'Daglig översikt med progress rings',
        'Vecko- och månadsrapporter',
        'Interaktiva grafer',
        'Näringsstatistik och trender',
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
              Kraftfulla funktioner för <span className="text-primary-600">bättre hälsa</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto mb-12">
              CalculEat kombinerar vetenskapliga kalkyler, smart kostloggning och detaljerad
              progress tracking i ett kraftfullt verktyg för att hjälpa dig nå dina hälsomål.
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

        {/* Detailed Feature Showcases - MyNetDiary style */}
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
                Och mycket mer...
              </h2>
              <p className="text-lg md:text-xl text-neutral-600">
                Utforska alla funktioner som gör CalculEat till det ultimata verktyget
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                icon={Lightbulb}
                title="Kaloritäthetssystem"
                description="Smartare matval med färgkodade livsmedel baserat på kaloritäthet (volumetrics) för mer balanserade matval."
                accentColor="primary"
              />
              <FeatureCard
                icon={BookOpen}
                title="Recepthantering"
                description="Skapa och spara dina egna recept med automatisk näringsuträkning. Dela med vänner eller håll dem privata."
                accentColor="accent"
              />
              <FeatureCard
                icon={Shield}
                title="Säkerhet & Integritet"
                description="Ditt data är säkert och privat. Exportera dina data när du vill. GDPR-kompatibel utan dataförsäljning."
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
              Redo att börja din resa?
            </h2>
            <p className="text-lg md:text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
              Skapa ditt konto idag och få tillgång till alla kraftfulla funktioner - helt gratis
              att komma igång!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="accent" className="shadow-2xl" asChild>
                <Link to="/register">
                  Skapa konto gratis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                asChild
              >
                <Link to="/">Tillbaka till startsidan</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
