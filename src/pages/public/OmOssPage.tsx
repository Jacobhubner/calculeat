import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'

const CANONICAL = 'https://calculeat.se/om-oss'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Om CalculEat',
  url: CANONICAL,
  description:
    'CalculEat är en svensk nutritionsapp med vetenskapligt grundade kalkylatorer för TDEE, BMR, FFMI och mer. Lär dig om vår metodik och datakällor.',
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
}

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CalculEat',
  url: 'https://calculeat.se',
  description: 'Svensk nutritionsapp med vetenskapligt grundade kalkylatorer och matloggning.',
  sameAs: [],
}

export default function OmOssPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Om CalculEat — Vetenskapligt grundad nutritionsapp | CalculEat"
        description="CalculEat är en svensk nutritionsapp med vetenskapligt grundade kalkylatorer för TDEE, BMR, FFMI och mer. Vi förklarar vår metodik och datakällor."
        canonical={CANONICAL}
      />
      <JsonLd schema={[PAGE_SCHEMA, ORG_SCHEMA]} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
            <Link to="/" className="hover:text-neutral-700 transition-colors">
              CalculEat
            </Link>
            <span>/</span>
            <span className="text-neutral-700">Om oss</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Om CalculEat</h1>

          <p className="text-lg text-neutral-600 leading-relaxed mb-10">
            CalculEat är en svensk nutritionsapp som kombinerar vetenskapligt grundade kalkylatorer
            med enkel matloggning — allt på ett ställe.
          </p>

          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Vad är CalculEat?</h2>
              <p className="text-neutral-600 leading-relaxed">
                CalculEat hjälper dig räkna ut ditt kaloribehov (TDEE), planera makronäringsämnen,
                logga mat och följa din kroppssammansättning. Vi fokuserar på precision och
                vetenskaplig grund — inte på förenklingar som kan leda fel.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Vår metodik</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  <strong>Kalkylatorer:</strong> Alla kalkylatorer bygger på publicerad forskning.
                  TDEE-kalkylatorn använder Mifflin-St Jeor för BMR (validerad i oberoende studier
                  som den mest korrekta för normalpopulationen) och fem PAL-nivåer (1.2–1.9) för
                  aktivitetsfaktor. Vi erbjuder även 9 alternativa BMR-formler för olika
                  populationer.
                </p>
                <p>
                  <strong>Matdatabas:</strong> Livsmedelsdata hämtas från Livsmedelsverkets
                  nationella livsmedelsdatabas, USDA FoodData Central och användarinlagda livsmedel.
                  Vi verifierar bidragsdata via ett community-system.
                </p>
                <p>
                  <strong>Informationsinnehåll:</strong> Alla artiklar och förklaringar granskas mot
                  publicerad forskning (PubMed, WHO, ACSM, EFSA). Vi inkluderar källhänvisningar så
                  att du kan granska underlagen själv.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Begränsningar</h2>
              <p className="text-neutral-600 leading-relaxed">
                Kalkylatorer ger uppskattningar — inte diagnoser. TDEE-formler har en felmarginal på
                ca ±10–15%. Individuella faktorer som muskelmassa, hormonbalans och metabolism
                påverkar det verkliga värdet. Använd alltid resultaten som startpunkt och justera
                baserat på verkligt utfall.
              </p>
              <p className="mt-3 text-neutral-600 leading-relaxed">
                CalculEat är inte ett medicinskt verktyg och ersätter inte rådgivning från dietist
                eller läkare. Vid sjukdom, ätstörningar eller speciella medicinska behov — rådfråga
                alltid sjukvård.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Kontakt</h2>
              <p className="text-neutral-600">
                Feedback, felrapporter och frågor välkomnas via{' '}
                <a href="mailto:kontakt@calculeat.se" className="text-primary-600 hover:underline">
                  kontakt@calculeat.se
                </a>
                .
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Kom igång</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  href: '/kalkylatorer/tdee-kalkylator',
                  label: 'TDEE Kalkylator — räkna ut ditt kaloribehov',
                },
                { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
                {
                  href: '/artiklar/kaloribehov',
                  label: 'Guide: Hur räknar man ut sitt kaloribehov?',
                },
                { href: '/register', label: 'Skapa gratis konto' },
              ].map(l => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
