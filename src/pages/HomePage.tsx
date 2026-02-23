import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SmartCalculator from '@/components/SmartCalculator'
import { HeroSection } from '@/components/HeroSection'
import { HowItWorks } from '@/components/HowItWorks'
import { Button } from '@/components/ui/button'
import { Apple, Calculator, Target, TrendingUp, BookOpen, Shield } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()

  // Redirect logged-in users to the app
  if (user) {
    return <Navigate to="/app/today" replace />
  }

  const features = [
    {
      icon: Calculator,
      title: 'Vet exakt hur mycket du ska äta',
      description:
        'Välj bland tio BMR-formler och sex aktivitetsnivåer. Kalorimålet är ditt — inte ett befolkningsgenomsnitt.',
      accentColor: 'primary' as const,
    },
    {
      icon: Apple,
      title: 'Sluta gissa portionsstorlekarna',
      description:
        'Sök i en bred livsmedelsdatabas och logga måltider på sekunder. Felen ackumuleras inte längre.',
      accentColor: 'accent' as const,
    },
    {
      icon: Target,
      title: 'Mål med en faktisk plan bakom sig',
      description:
        'Ange din ambition — CalculEat räknar ut kalorimål, makrofördelning och realistisk tidslinje.',
      accentColor: 'primary' as const,
    },
    {
      icon: TrendingUp,
      title: 'Se om strategin faktiskt fungerar',
      description:
        'Trender vecka för vecka visar vad du faktiskt äter — inte vad du trodde du åt. Justera på data.',
      accentColor: 'accent' as const,
    },
    {
      icon: BookOpen,
      title: 'Laga mat du redan gillar',
      description:
        'Skapa egna recept och få näringsvärdet automatiskt. Hållbara vanor kräver inte hälsofrikostmat.',
      accentColor: 'primary' as const,
    },
    {
      icon: Shield,
      title: 'Ditt data är ditt',
      description:
        'Ingen reklam, ingen försäljning till tredje part. Exportera allt du loggat när som helst.',
      accentColor: 'accent' as const,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Calculator Section - directly after hero for product-led conversion */}
        <section id="calculator" className="py-20 md:py-28 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4">
                Prova vår kalkylator
              </h2>
              <p className="text-lg md:text-xl text-neutral-600">
                Få ditt personliga energibehov direkt — ingen inloggning krävs.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SmartCalculator />
            </div>
          </div>
        </section>

        {/* Features Summary Section */}
        <section id="features" className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3">
                Allt du behöver, ingenting du inte behöver
              </h2>
              <p className="text-lg text-neutral-600">
                CalculEat kombinerar kraftfulla verktyg med en enkel användarupplevelse.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 inline-flex rounded-lg p-2.5 ${
                      feature.accentColor === 'primary'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-accent-100 text-accent-600'
                    }`}
                  >
                    <feature.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 mb-0.5">{feature.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Process section */}
        <HowItWorks />

        {/* CTA Footer */}
        <section className="bg-neutral-900 py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Precision börjar här.
            </h2>
            <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto">
              CalculEat är byggt för dem som vill förstå sin kost på riktigt — inte för dem som
              nöjer sig med ungefärliga estimat. Konto tar 60 sekunder att skapa.
            </p>

            <Button size="lg" variant="accent" className="shadow-lg hover:shadow-xl mb-8" asChild>
              <Link to="/register">Beräkna mitt kaloribehov</Link>
            </Button>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-sm text-neutral-400">
              <span>Ingen betald version — alla funktioner är tillgängliga utan kostnad.</span>
              <span>Dina uppgifter lagras säkert och delas aldrig med tredje part.</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
