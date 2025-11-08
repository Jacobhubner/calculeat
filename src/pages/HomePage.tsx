import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import FeatureCard from '@/components/FeatureCard'
import TestimonialCard from '@/components/TestimonialCard'
import StatsStrip from '@/components/StatsStrip'
import { Button } from '@/components/ui/button'
import { Apple, Calculator, Target, CheckCircle, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const stats = [
    { value: '10K+', label: 'Aktiva användare' },
    { value: '500K+', label: 'Loggade måltider' },
    { value: '2M+', label: 'Kaloriberäkningar' },
    { value: '4.9/5', label: 'Användarbetyg' },
  ]

  const features = [
    {
      icon: Apple,
      title: 'Kostloggning',
      description: 'Logga måltider, makron och följ dina näringsintag i realtid.',
    },
    {
      icon: Calculator,
      title: 'Smart kalkyler',
      description: 'BMI, TDEE och mer – alla verktyg du behöver på ett ställe.',
    },
    {
      icon: Target,
      title: 'Målsättning',
      description: 'Sätt och följ personliga mål för vikt, kalorier och makron.',
    },
    {
      icon: TrendingUp,
      title: 'Progress tracking',
      description: 'Följ din utveckling över tid med detaljerade statistik och grafer.',
    },
  ]

  const testimonials = [
    {
      quote:
        'CalculEat har helt förändrat min relation till mat. Jag kan nu se exakt vad jag äter och följa min framgång över tid.',
      author: 'Emma Svensson',
      role: 'Nöjd användare',
    },
    {
      quote:
        'Jag behöver vara precis med mina makron. CalculEat gör det enkelt och jag kan följa min progression dagligen.',
      author: 'Marcus Andersson',
      role: 'Fitnessentusiast',
    },
    {
      quote:
        'Perfekt för att hålla koll på kaloriintaget! Appen guidar mig genom att äta smart. Jag har gått ner 10kg på 3 månader.',
      author: 'Sara Lindström',
      role: 'Viktminskning 10kg',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-neutral-900 md:text-6xl">
              Ta kontroll över din kost. Nå dina mål. Enkelt med{' '}
              <span className="text-primary-600">CalculEat</span>.
            </h1>
            <p className="mb-8 text-xl text-neutral-600">
              Den smarta appen för att räkna kalorier, följa dina makron och nå dina hälsomål.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/">Skapa konto</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/features">Utforska funktioner</Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-16">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border-4 border-neutral-200 shadow-2xl">
              <div className="bg-neutral-100 p-8">
                <div className="aspect-video bg-gradient-to-br from-primary-500 to-accent-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="bg-neutral-50 py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
                Allt du behöver i ett verktyg
              </h2>
              <p className="text-lg text-neutral-600">
                CalculEat ger dig alla verktyg för att nå dina hälsomål
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Calculator Teaser */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border bg-white p-8 shadow-lg">
                <div className="mb-6 flex items-center space-x-3">
                  <Calculator className="h-8 w-8 text-primary-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">Smart kalkylator</h2>
                </div>
                <p className="mb-6 text-neutral-600">
                  Beräkna din BMI, TDEE och mer med vår smarta kalkylator.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Ålder</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Vikt (kg)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Längd (cm)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="180"
                    />
                  </div>
                  <Button className="w-full">Beräkna</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <StatsStrip stats={stats} />

        {/* Testimonials */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
                Vad användare säger
              </h2>
              <p className="text-lg text-neutral-600">Tusentals användare litar på CalculEat</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Teaser */}
        <section className="bg-neutral-50 py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-6 text-3xl font-bold text-neutral-900 md:text-4xl">
                Upptäck alla funktioner
              </h2>
              <p className="mb-8 text-lg text-neutral-600">
                Utforska hur CalculEat kan hjälpa dig nå dina mål
              </p>
              <Button size="lg" asChild>
                <Link to="/features">Se alla funktioner</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-700 py-20 text-white">
          <div className="container mx-auto px-4 text-center md:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Redo att komma igång?</h2>
            <p className="mb-8 text-lg text-primary-100">
              Skapa ditt konto idag och börja din resa mot ett hälsosammare liv.
            </p>

            <div className="mb-12 flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-200" />
                <span className="text-primary-100">Ingen reklam</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-200" />
                <span className="text-primary-100">Ditt data, din kontroll</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-200" />
                <span className="text-primary-100">Exportera dina data</span>
              </div>
            </div>

            <Button size="lg" variant="secondary">
              Skapa konto gratis
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
