import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Button } from '@/components/ui/button'
import { Apple, Calculator, Target, BarChart3, Shield, ArrowRight, TrendingUp } from 'lucide-react'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Apple,
      title: 'Kostloggning',
      description:
        'Logga måltider, makron och följ dina näringsintag. Spara favoritrecept och håll koll på ditt kaloriintag.',
      details: [
        'Logga måltider enkelt',
        'Automatisk makroberäkning',
        'Spara favoritrecept',
        'Kaloriräkning i realtid',
      ],
    },
    {
      icon: Calculator,
      title: 'Smarta Kalkyler',
      description: 'Beräkna BMI, TDEE, kaloribehov och makrofördelning baserat på dina mål.',
      details: [
        'BMI beräkning',
        'TDEE kalkylator',
        'Kalorimål för viktminskning/ökning',
        'Makrofördelning',
      ],
    },
    {
      icon: Target,
      title: 'Målsättning',
      description:
        'Sätt personliga mål för vikt, kalorier och makron. Följ din progress mot dina mål.',
      details: [
        'Viktmål tracking',
        'Dagliga kalorimål',
        'Makromål (protein/kolhydrater/fett)',
        'Anpassade målnivåer',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Följ din utveckling över tid med detaljerade statistik och grafer.',
      details: ['Viktutveckling över tid', 'Kalorihistorik', 'Makrofördelning', 'Trendanalys'],
    },
    {
      icon: BarChart3,
      title: 'Dashboard & Insikter',
      description: 'Få en tydlig översikt över dina näringsintag och framsteg med visuella grafer.',
      details: [
        'Daglig översikt',
        'Vecko- och månadsrapporter',
        'Visualisering av framsteg',
        'Näringsstatistik',
      ],
    },
    {
      icon: Shield,
      title: 'Säkerhet & Integritet',
      description:
        'Ditt data är säkert och privat. Exportera dina data när du vill. GDPR-kompatibel.',
      details: ['Säker datalagring', 'Dataexport', 'GDPR-kompatibel', 'Ingen dataförsäljning'],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main>
        {/* Overview Hero */}
        <section className="bg-gradient-to-br from-primary-50 to-neutral-50 py-20">
          <div className="container mx-auto px-4 text-center md:px-6 lg:px-8">
            <h1 className="mb-4 text-4xl font-bold text-neutral-900 md:text-5xl">
              Allt du behöver för att nå dina mål
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-neutral-600">
              CalculEat kombinerar kostloggning, kaloriräkning och målsättning i ett kraftfullt
              verktyg för att hjälpa dig nå dina hälsomål.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {mainFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group rounded-2xl border bg-white p-8 shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-primary-100 p-3 text-primary-600">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h2 className="mb-3 text-2xl font-semibold text-neutral-900">{feature.title}</h2>
                  <p className="mb-6 text-neutral-600">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-neutral-700">
                        <div className="h-2 w-2 rounded-full bg-primary-600" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Get Started */}
        <section className="bg-neutral-50 py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-4 text-3xl font-bold text-neutral-900">
                Kom igång på tre enkla steg
              </h2>

              <div className="mt-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Skapa ditt konto</h3>
                    <p className="text-neutral-600">
                      Registrera dig gratis med e-post eller social inloggning
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Sätt dina mål</h3>
                    <p className="text-neutral-600">
                      Definiera dina hälsomål och preferenser i onboarding-flödet
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Börja logga</h3>
                    <p className="text-neutral-600">
                      Logga din första måltid och börja följa din näringsintag
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link to="/">
                    Skapa konto gratis <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
