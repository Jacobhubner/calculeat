import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import FeatureCard from '@/components/FeatureCard'
import SmartCalculator from '@/components/SmartCalculator'
import { HeroSection } from '@/components/HeroSection'
import { HowItWorks } from '@/components/HowItWorks'
import { SuccessStories } from '@/components/SuccessStories'
import { Button } from '@/components/ui/button'
import { Apple, Calculator, Target, TrendingUp, BookOpen, Heart, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Calculator,
      title: 'Smart kalkyler',
      description:
        'Beräkna BMR, TDEE och makron med vetenskapligt beprövade formler. Få personaliserade rekommendationer baserat på dina mål.',
      accentColor: 'primary' as const,
    },
    {
      icon: Apple,
      title: 'Kostloggning',
      description:
        'Logga dina måltider enkelt med vår omfattande matdatabas. Spara favoritmåltider och recept för snabb återanvändning.',
      accentColor: 'accent' as const,
    },
    {
      icon: Target,
      title: 'Målsättning',
      description:
        'Sätt specifika mål för vikt, kalorier och makrofördelning. Få daglig feedback på din progress och justera efter behov.',
      accentColor: 'primary' as const,
    },
    {
      icon: TrendingUp,
      title: 'Progress tracking',
      description:
        'Visualisera din utveckling med interaktiva grafer och detaljerad statistik. Se trender och mönster i dina matvanor över tid.',
      accentColor: 'accent' as const,
    },
    {
      icon: BookOpen,
      title: 'Recepthantering',
      description:
        'Skapa och spara dina egna recept med automatisk näringsberäkning. Dela med vänner eller håll dem privata.',
      accentColor: 'primary' as const,
    },
    {
      icon: Heart,
      title: 'Hälsoinsikter',
      description:
        'Få personliga rekommendationer baserat på dina matvanor. Upptäck näringsgap och optimera din kost för bättre hälsa.',
      accentColor: 'accent' as const,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main>
        {/* Hero Section - New MyNetDiary-inspired design */}
        <HeroSection />

        {/* Features Grid Section */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
                Allt du behöver för att nå dina mål
              </h2>
              <p className="text-lg md:text-xl text-neutral-600">
                CalculEat kombinerar kraftfulla verktyg med en enkel användarupplevelse
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>

            {/* Link to features page */}
            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Se alla funktioner i detalj</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Calculator Section - BEHÅLLS MED SAMMA FUNKTIONALITET */}
        <section id="calculator" className="py-20 md:py-28 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
                Prova vår kalkylator
              </h2>
              <p className="text-lg md:text-xl text-neutral-600">
                Få värdet på din personliga energiomsättning snabbt och enkelt – ingen inloggning
                krävs.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SmartCalculator />
            </div>
          </div>
        </section>

        {/* How It Works - Process section */}
        <HowItWorks />

        {/* Success Stories - Testimonials with better design */}
        <SuccessStories />

        {/* CTA Footer */}
        <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20 md:py-28 relative overflow-hidden border-t border-neutral-200">
          {/* Background pattern with gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,189,0,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,139,0,0.06),transparent_50%)]" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-neutral-900">
              Redo att förändra dina matvanor?
            </h2>
            <p className="text-lg md:text-xl text-neutral-700 mb-12 max-w-2xl mx-auto">
              Gå med tusentals användare som redan har nått sina hälsomål med CalculEat
            </p>

            <div className="mb-12 flex flex-wrap justify-center gap-6 md:gap-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-primary-600" />
                <span className="text-neutral-800 font-medium">Helt gratis att börja</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-primary-600" />
                <span className="text-neutral-800 font-medium">Ingen reklam</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-primary-600" />
                <span className="text-neutral-800 font-medium">
                  Exportera dina data när som helst
                </span>
              </div>
            </div>

            <Button size="lg" variant="accent" className="shadow-lg hover:shadow-xl" asChild>
              <Link to="/register">Skapa konto gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
