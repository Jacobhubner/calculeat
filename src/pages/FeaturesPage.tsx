import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Apple,
      title: 'Kostloggning',
      description:
        'Logga måltider med trafikljussystem baserat på kaloritäthet, spara recept och håll koll på ditt kaloriintag.',
      details: [
        'Trafikljussystem för kaloritäthet (Grön/Gul/Orange)',
        'Automatisk makroberäkning',
        'Spara favoritrecept och måltider',
        'Kaloriräkning i realtid',
      ],
    },
    {
      icon: Calculator,
      title: 'Vetenskapliga Kalkyler',
      description:
        'Välj mellan 10 olika BMR-formler och 6 PAL-system för maximalt exakta beräkningar anpassade efter din situation.',
      details: [
        '10 BMR-formler (Mifflin-St Jeor, Cunningham, Oxford/Henry, Schofield m.fl.)',
        '6 olika PAL-system för exakt TDEE',
        'BMI och idealvikt',
        'Personaliserade kalorimål',
      ],
    },
    {
      icon: Activity,
      title: 'Kroppskomposition',
      description:
        'Mät din kroppssammansättning med professionella metoder - från caliper till bandmätningar.',
      details: [
        '12 olika metoder (Jackson/Pollock, Durnin/Womersley, U.S. Navy m.fl.)',
        'Caliper- och bandmätningar',
        'Fettfri massa och fettprocent',
        'Kroppssammansättning över tid',
      ],
    },
    {
      icon: Dumbbell,
      title: 'Professionella Makro-program',
      description:
        'Förinställda makroprogram för olika mål - från hälsosam kost till bodybuilding.',
      details: [
        'NNR-läge (Nordiska näringsrekommendationer)',
        'Off-Season läge (Bodybuilding bulk)',
        'On-Season läge (Bodybuilding cut)',
        'Anpassade makromallar',
      ],
    },
    {
      icon: Target,
      title: 'Målsättning',
      description:
        'Sätt personliga mål för vikt, kalorier och makron med avancerade proteinberäkningar och hormonal hälsa.',
      details: [
        'Viktmål tracking',
        'Aktivitetsbaserade proteinbehov',
        'Makromål med hormonal hänsyn',
        'Tid-till-mål beräkningar',
      ],
    },
    {
      icon: Lightbulb,
      title: 'Kaloritäthetssystemet',
      description:
        'Smartare matval med färgkodade livsmedel baserat på kaloritäthet (volumetrics) - ät mer grönt, lagom gult, mindre orange.',
      details: [
        'Automatisk färgklassificering av mat',
        'Daglig färgfördelning',
        'Rekommenderade mål (30%+ grönt)',
        'Olika tröskelvärden för mat, dryck & soppa',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Följ din utveckling över tid med detaljerade statistik och grafer.',
      details: [
        'Viktutveckling över tid',
        'Kalorihistorik',
        'Makrofördelning',
        'Trendanalys och förloppsindikatorer',
      ],
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
      icon: Database,
      title: 'Livsmedelsdatabas & Recept',
      description:
        'Tillgång till omfattande livsmedelsdatabaser från SLV och USDA, plus din egen personliga matbibliotek.',
      details: [
        'SLV (Livsmedelsverket) databas',
        'USDA livsmedelsdatabas',
        'Skapa egna livsmedel',
        'Recepthantering med automatisk näringsuträkning',
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
