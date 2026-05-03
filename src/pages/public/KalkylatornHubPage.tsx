import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Calculator, ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

const calculators = [
  {
    to: '/kalkylatorer/tdee-kalkylator',
    title: 'TDEE-kalkylator',
    description:
      'Beräkna ditt totala dagliga energibehov baserat på ålder, vikt, längd och aktivitetsnivå.',
    tag: 'Populär',
  },
  {
    to: '/kalkylatorer/kaloriunderskott',
    title: 'Kaloriunderskott-kalkylator',
    description: 'Räkna ut hur stort kaloriunderskott du behöver för att nå din viktnedgångsmål.',
    tag: 'Populär',
  },
  {
    to: '/kalkylatorer/bmi-kalkylator',
    title: 'BMI-kalkylator',
    description: 'Beräkna ditt body mass index och se var du hamnar på BMI-skalan.',
  },
  {
    to: '/kalkylatorer/proteinbehov',
    title: 'Proteinbehov-kalkylator',
    description:
      'Ta reda på hur mycket protein du behöver per dag utifrån din träning och dina mål.',
  },
  {
    to: '/kalkylatorer/idealvikt',
    title: 'Idealvikt-kalkylator',
    description: 'Beräkna din idealvikt baserat på längd, kön och kroppsbyggnad.',
  },
  {
    to: '/kalkylatorer/kroppsfett',
    title: 'Kroppsfett-kalkylator',
    description: 'Uppskatta din kroppsfettprocent med hjälp av mått och kön.',
  },
  {
    to: '/kalkylatorer/bulk-kalkylator',
    title: 'Bulk-kalkylator',
    description: 'Räkna ut hur mycket du ska äta för att bygga muskler utan onödig fettökning.',
  },
  {
    to: '/kalkylatorer/cut-kalkylator',
    title: 'Cut-kalkylator',
    description: 'Beräkna ditt kaloriintag för en effektiv cut som bevarar muskelmassa.',
  },
  {
    to: '/kalkylatorer/ffmi-kalkylator',
    title: 'FFMI-kalkylator',
    description: 'Mät din fettfria masseindex — ett bättre mått på muskelmassa än BMI.',
  },
  {
    to: '/kalkylatorer/bmr-kalkylator',
    title: 'BMR-kalkylator',
    description: 'Beräkna din basalmetabolism — hur många kalorier din kropp förbränner i vila.',
  },
]

export default function KalkylatornHubPage() {
  return (
    <>
      <Helmet>
        <title>Kalkylatorer — Näring, kalorier och kropp | CalculEat</title>
        <meta
          name="description"
          content="Gratis kalkylatorer för TDEE, kaloriunderskott, BMI, proteinbehov, idealvikt, kroppsfett, bulk, cut, FFMI och BMR. Beräkna dina mål direkt."
        />
        <link rel="canonical" href="https://calculeat.se/kalkylatorer" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-white border-b border-neutral-100 py-14 md:py-20">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Calculator className="h-4 w-4" />
                Gratis verktyg
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Kalkylatorer för kost och kropp
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Alla verktyg du behöver för att förstå ditt energibehov, sätta mål och följa din
                utveckling — helt gratis.
              </p>
              <Link
                to="/kalkylatorer/tdee-kalkylator"
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Börja med TDEE-kalkylatorn
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Calculator grid */}
          <section className="py-14 md:py-20 bg-neutral-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {calculators.map(calc => (
                  <Link
                    key={calc.to}
                    to={calc.to}
                    className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:border-primary-200 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors leading-snug">
                        {calc.title}
                      </h2>
                      {calc.tag && (
                        <span className="ml-2 flex-shrink-0 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          {calc.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed flex-1">
                      {calc.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-primary-600 font-medium">
                      Öppna kalkylator
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="bg-white border-t border-neutral-100 py-14">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                Spara dina resultat automatiskt
              </h2>
              <p className="text-neutral-600 mb-6">
                Skapa ett gratis konto och låt CalculEat räkna ut ditt dagliga mål, spåra måltider
                och visa hur du ligger till — dag för dag.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Skapa gratis konto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
