import { Link, Navigate } from 'react-router-dom'
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

  // Redirect logged-in users to the app
  if (user) {
    return <Navigate to="/app" replace />
  }

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
                Funktioner som faktiskt används
              </h2>
              <p className="text-lg text-neutral-600">
                Inte ett verktyg du öppnar en gång — ett som följer med i köket, mataffären och på
                gymmet.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-100 text-primary-600">
                  <Scan className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    Skanna direkt i affären
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Håll upp kameran mot streckkoden på förpackningen. CalculEat hämtar
                    näringsvärden och lägger till livsmedlet på sekunder.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-100 text-accent-600">
                  <ChefHat className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    Bygg recept och se näringsvärdet live
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Lägg till ingredienser ett i taget och följ kalorier, protein, fett och
                    kolhydrater i realtid. Spara receptet och logga det direkt.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-100 text-primary-600">
                  <Share2 className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    Dela listor och recept med andra
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Skapa gemensamma livsmedelslistor med familj eller en partner. Alla i gruppen
                    kan lägga till, se och logga från samma lista.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl p-3 bg-accent-100 text-accent-600">
                  <Scale className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    Beräkna din kroppssammansättning
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Få en uppskattning av muskelmassa, fettmassa och BMI baserat på flera
                    vetenskapliga metoder. Följ förändringen över tid.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 flex gap-5 items-start hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex-shrink-0 rounded-xl p-3 bg-primary-100 text-primary-600">
                  <Target className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                    Sätt mål och få en konkret plan
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Ange ditt viktmål — CalculEat räknar ut kalorimål, makrofördelning och en
                    realistisk tidslinje. Inte ett genomsnitt, utan din plan.
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
              <Link to="/register">Skapa mitt konto gratis</Link>
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
