import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { BookOpen, ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { GuestOnly } from '@/components/GuestOnly'

const articles = [
  {
    to: '/artiklar/kaloribehov',
    title: 'Kaloribehov — hur mycket behöver du äta?',
    description:
      'En komplett guide till hur du räknar ut ditt dagliga kaloribehov baserat på mål, aktivitet och kroppssammansättning.',
    tag: 'Pillar',
  },
  {
    to: '/artiklar/vad-ar-tdee',
    title: 'Vad är TDEE?',
    description:
      'Förstå Total Daily Energy Expenditure — vad det är, hur det beräknas och varför det är viktigare än BMR.',
  },
  {
    to: '/artiklar/kaloribrist',
    title: 'Kaloribrist — vad du behöver veta',
    description:
      'Hur fungerar ett kaloriunderskott? Hur stort ska det vara? Allt om att gå ner i vikt på ett hållbart sätt.',
  },
  {
    to: '/artiklar/bulk-och-cut',
    title: 'Bulk och cut — komplett guide',
    description:
      'Lär dig skillnaden mellan bulk och cut, hur du planerar faserna och undviker vanliga misstag.',
  },
  {
    to: '/artiklar/reverse-diet',
    title: 'Reverse diet — återbygg ämnesomsättningen',
    description:
      'Vad är reverse dieting, när passar det och hur ökar du kalorierna utan att gå upp i fett?',
  },
  {
    to: '/artiklar/vad-ar-bmr',
    title: 'Vad är BMR?',
    description:
      'Basal metabolic rate förklarad — hur kroppen förbränner kalorier i vila och vad det betyder för dig.',
  },
  {
    to: '/artiklar/bmr-vs-rmr',
    title: 'BMR vs RMR — vad är skillnaden?',
    description:
      'BMR och RMR mäter båda energiförbrukning i vila men skiljer sig i mätvillkor. Vilka formler beräknar vad — och spelar det roll?',
  },
  {
    to: '/artiklar/bmr-vs-tdee',
    title: 'BMR vs TDEE — vad är skillnaden?',
    description:
      'Förstå relationen mellan basalmetabolism och totalt energibehov, och vilket mått du faktiskt ska använda.',
  },
  {
    to: '/artiklar/bmi-vs-kroppsfett',
    title: 'BMI vs kroppsfett — vilket mått är bättre?',
    description:
      'BMI är enkelt men missvisande. Här jämförs de två måtten och när du bör använda vilket.',
  },
  {
    to: '/artiklar/vad-ar-ffmi',
    title: 'Vad är FFMI?',
    description:
      'Fat-free mass index är ett bättre mått på muskelmassa än BMI. Lär dig hur det beräknas och tolkas.',
  },
  {
    to: '/artiklar/vad-ar-pal-och-met',
    title: 'Vad är PAL och MET?',
    description:
      'Physical activity level och metabolic equivalent — hur aktivitetsnivå mäts och används i TDEE-beräkningar.',
  },
  {
    to: '/artiklar/lbm-vs-ffm',
    title: 'LBM vs FFM — vad är skillnaden?',
    description:
      'Lean Body Mass och Fat Free Mass används ofta som synonymer men mäter inte samma sak. Lär dig skillnaden och vilket mått du ska använda.',
  },
  {
    to: '/artiklar/hur-mater-man-kroppsfett',
    title: 'Hur mäter man kroppsfett?',
    description:
      'DEXA, bioimpedans, kaliper eller Navy-metoden? Lär dig skillnaderna i noggrannhet och välj rätt metod för din situation.',
  },
]

export default function ArtikelnHubPage() {
  return (
    <>
      <Helmet>
        <title>Artiklar om näring, kalorier och träning | CalculEat</title>
        <meta
          name="description"
          content="Guider och artiklar om kaloribehov, TDEE, BMR, bulk, cut, kaloribrist och mer. Lär dig förstå din kropp och nå dina mål."
        />
        <link rel="canonical" href="https://calculeat.se/artiklar" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-white border-b border-neutral-100 py-14 md:py-20">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <BookOpen className="h-4 w-4" />
                Guider och förklaringar
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Artiklar om kost och kropp
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Förstå energibalans, metabolism och näringslära — skrivet enkelt och baserat på
                vetenskap.
              </p>
              <Link
                to="/artiklar/kaloribehov"
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Börja med kaloribehov
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Article grid */}
          <section className="py-14 md:py-20 bg-neutral-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map(article => (
                  <Link
                    key={article.to}
                    to={article.to}
                    className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:border-primary-200 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors leading-snug">
                        {article.title}
                      </h2>
                      {article.tag && (
                        <span className="ml-2 flex-shrink-0 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          {article.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed flex-1">
                      {article.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-primary-600 font-medium">
                      Läs artikel
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
                Omsätt teorin i praktiken
              </h2>
              <p className="text-neutral-600 mb-6">
                Beräkna ditt kaloribehov med TDEE-kalkylatorn och börja logga direkt i CalculEat —
                gratis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/kalkylatorer"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Prova TDEE-kalkylatorn
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <GuestOnly>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 border border-neutral-300 text-neutral-700 font-medium px-6 py-3 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    Skapa gratis konto
                  </Link>
                </GuestOnly>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
