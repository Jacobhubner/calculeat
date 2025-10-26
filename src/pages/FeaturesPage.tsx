import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Button } from '@/components/ui/button'
import { Apple, Calendar, Calculator, Activity, BarChart3, Shield, ArrowRight } from 'lucide-react'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Apple,
      title: 'Kostloggning',
      description:
        'Logga måltider, makron och följ dina näringsintag. Stöd för receptfavoriter och streckkodsskanning (roadmap).',
      details: [
        'Logga måltider enkelt',
        'Automatisk makroberäkning',
        'Spara favoritrecept',
        'Skanning av streckkod (kommande)',
      ],
    },
    {
      icon: Calendar,
      title: 'Träningspass',
      description:
        'Skapa passmallar (push/pull/legs), följ progression, och använd RPE-skala för bättre träning.',
      details: [
        'Passmallar för alla nivåer',
        'Progression tracking',
        'RPE-skala',
        'Prestationsstatistik',
      ],
    },
    {
      icon: Activity,
      title: 'Aktivitet',
      description:
        'Följ steg, puls, zoner och integrationer med Apple Health och Strava (roadmap).',
      details: [
        'Steg tracking',
        'Pulsmätning',
        'Träningszoner',
        'Integrering med Apple Health/Strava (kommande)',
      ],
    },
    {
      icon: Calculator,
      title: 'Kalkyler',
      description: 'Allt från nybörjare till avancerat – BMI, TDEE, cut/bulk och periodisering.',
      details: ['BMI beräkning', 'TDEE kalkylator', 'Cut/Bulk planer', 'Periodisering verktyg'],
    },
    {
      icon: BarChart3,
      title: 'Dashboard & Insikter',
      description: 'Vecko- och månadsgrafer, målspårning och visualisering av din framgång.',
      details: ['Veckovisa grafer', 'Månadsrapporter', 'Målspårning', 'Progresionsvisualisering'],
    },
    {
      icon: Shield,
      title: 'Säkerhet & Integritet',
      description: 'Ditt data är säkert. Exportera dina data när du vill. GDPR-kompatibel.',
      details: ['Säker datalagring', 'Dataexport', 'GDPR-kompatibel', 'Ingen data försäljning'],
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
              Allt du behöver för att hålla koll
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-neutral-600">
              CalculEat kombinerar kostloggning, träning och aktivitet i ett kraftfullt verktyg för
              att hjälpa dig nå dina hälsomål.
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
                      Logga din första måltid eller träningspass och börja se framgång
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
