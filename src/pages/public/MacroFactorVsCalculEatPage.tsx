import { Link } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'

const CANONICAL = 'https://calculeat.se/jamfor/macrofactor-vs-calculeat'

const FAQ_ITEMS = [
  {
    question: 'Är MacroFactor bättre än CalculEat?',
    answer:
      'MacroFactor är en av marknadens mest avancerade kaloriappar med stark metabolisk kalibrering och autoregulering av kalorimål. CalculEat erbjuder liknande TDEE-precision och fas-planering gratis, på svenska, utan abonnemangskrav. MacroFactor är bättre för den som vill ha maximal automatisering. CalculEat är bättre för den som vill ha samma precision utan kostnad och på sitt eget språk.',
  },
  {
    question: 'Vad är skillnaden mellan MacroFactor och CalculEat?',
    answer:
      'MacroFactor är en premiumapp (abonnemang krävs) med fokus på avancerad metabolisk autoregulering — appen justerar kalorimålet automatiskt baserat på viktdata och beräknat TDEE varje vecka. CalculEat erbjuder individuell TDEE-beräkning, fasbaserad planering (cut/bulk/maintenance) och metabolisk kalibrering gratis. MacroFactor är mer automatiserad. CalculEat ger mer transparens i hur beräkningarna görs.',
  },
  {
    question: 'Är MacroFactor gratis?',
    answer:
      'Nej — MacroFactor kräver ett aktivt abonnemang för alla funktioner. Det finns en kortare provperiod men inga permanenta gratisalternativ för kärn-features. CalculEat är gratis för kaloriloggning, TDEE-beräkning, fas-tracking och metabolisk kalibrering.',
  },
  {
    question: 'Vilken app är bäst för seriös kroppskompositionstracking?',
    answer:
      'Båda är starka val. MacroFactor har en mer automatiserad pipeline för TDEE-kalibrering. CalculEat ger mer kontroll och transparens — du ser varför kalorimålet är som det är och kan justera det manuellt vid behov. Seriösa användare som vill förstå sina siffror föredrar ofta CalculEat. Den som bara vill att appen ska sköta allt automatiskt kan uppskatta MacroFactor.',
  },
  {
    question: 'Stödjer MacroFactor svenska?',
    answer:
      'MacroFactor är primärt på engelska och fokuserar på den engelskspråkiga marknaden. CalculEat är byggt för den svenska marknaden — matdatabas från Livsmedelsverket, gränssnitt på svenska och stöd för svenska nutritionsreferensvärden.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'MacroFactor vs CalculEat — Vilken kaloriräknare är bäst? (2026)',
    description:
      'Jämförelse av MacroFactor och CalculEat. MacroFactor är en avancerad premiumapp. CalculEat erbjuder liknande TDEE-precision och fas-planering gratis och på svenska.',
    url: CANONICAL,
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
    inLanguage: 'sv-SE',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'CalculEat', item: 'https://calculeat.se/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Jämförelser',
        item: 'https://calculeat.se/jamfor',
      },
      { '@type': 'ListItem', position: 3, name: 'MacroFactor vs CalculEat', item: CANONICAL },
    ],
  },
]

type CellType = 'yes' | 'no' | 'partial'

const COMPARISON_ROWS: {
  feature: string
  mf: CellType
  ce: CellType
  note?: string
}[] = [
  { feature: 'Kaloriloggning', mf: 'yes', ce: 'yes' },
  { feature: 'Matdatabas', mf: 'yes', ce: 'partial', note: 'CalculEat: Livsmedelsverket + USDA' },
  { feature: 'Svenska', mf: 'no', ce: 'yes', note: 'MacroFactor är primärt på engelska' },
  {
    feature: 'TDEE-beräkning',
    mf: 'yes',
    ce: 'yes',
    note: 'Båda beräknar individuellt TDEE',
  },
  {
    feature: 'Metabolisk kalibrering',
    mf: 'yes',
    ce: 'yes',
    note: 'Baseras på faktisk viktdata',
  },
  {
    feature: 'Autoregulering av kalorimål',
    mf: 'yes',
    ce: 'partial',
    note: 'MacroFactor: helautomatisk varje vecka',
  },
  { feature: 'Bulk/Cut-faser', mf: 'yes', ce: 'yes', note: 'Separata mål per fas' },
  {
    feature: 'Reverse diet-stöd',
    mf: 'partial',
    ce: 'yes',
    note: 'CalculEat: explicit fas-planering',
  },
  { feature: 'Transparens i beräkning', mf: 'partial', ce: 'yes', note: 'CalculEat visar hur' },
  { feature: 'Streckkodsskanning', mf: 'yes', ce: 'yes' },
  {
    feature: 'Gratis för kärn-features',
    mf: 'no',
    ce: 'yes',
    note: 'MacroFactor kräver abonnemang',
  },
]

function Cell({ type }: { type: CellType }) {
  if (type === 'yes')
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
        <Check className="h-3.5 w-3.5 text-green-700" />
      </span>
    )
  if (type === 'no')
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100">
        <X className="h-3.5 w-3.5 text-red-600" />
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100">
      <Minus className="h-3.5 w-3.5 text-yellow-600" />
    </span>
  )
}

export default function MacroFactorVsCalculEatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="MacroFactor vs CalculEat — Vilken kaloriräknare är bäst? (2026)"
        description="Jämförelse av MacroFactor och CalculEat. MacroFactor är en avancerad premiumapp med automatisk TDEE-kalibrering. CalculEat erbjuder samma precision gratis och på svenska."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <Link to="/" className="hover:text-neutral-700 transition-colors">
              CalculEat
            </Link>
            <span>/</span>
            <span className="text-neutral-700">Jämförelser</span>
            <span>/</span>
            <span className="text-neutral-700">MacroFactor vs CalculEat</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            MacroFactor vs CalculEat — Vilken app passar dig bäst?
          </h1>

          {/* Winner summary box */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">
              Snabbsvar
            </p>
            <p className="text-sm font-semibold text-primary-900 mb-3">
              CalculEat vinner på pris, språk och transparens — MacroFactor på automation.
            </p>
            <ul className="space-y-1.5 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> Samma TDEE-precision
                och metabolisk kalibrering — helt gratis
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> Fullt på svenska med
                Livsmedelsverkets matdatabas
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> Full transparens i
                hur ditt kalorimål beräknas
              </li>
            </ul>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                to="/kalkylatorer"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Räkna ut ditt TDEE gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <GuestOnly>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 border border-primary-300 text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-100 transition-colors text-sm"
                >
                  Skapa konto
                </Link>
              </GuestOnly>
            </div>
          </div>

          <p className="text-base text-neutral-600 leading-relaxed mb-6">
            MacroFactor är en av marknadens mest avancerade kaloriappar — automatisk metabolisk
            kalibrering, veckovis TDEE-justering, kraftfull för seriösa användare. Men den kräver
            abonnemang och är på engelska. CalculEat erbjuder individuellt TDEE, fas-planering och
            metabolisk kalibrering gratis och på svenska.
          </p>

          {/* Inline CTA */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900 mb-0.5">
                Räkna ut ditt TDEE — gratis
              </p>
              <p className="text-xs text-primary-700">
                Prova CalculEats TDEE-kalkylator innan du bestämmer dig för vilken app du vill
                använda.
              </p>
            </div>
            <Link
              to="/kalkylatorer"
              className="shrink-0 inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              TDEE-kalkylator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Comparison table */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Snabb jämförelse</h2>
            <div className="rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-0 bg-neutral-50 border-b border-neutral-200">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Funktion
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center w-28">
                  MacroFactor
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-primary-600 uppercase tracking-wider text-center w-28">
                  CalculEat
                </div>
              </div>

              {COMPARISON_ROWS.map(({ feature, mf, ce, note }, i) => (
                <div
                  key={feature}
                  className={`grid grid-cols-[1fr_auto_auto] gap-0 border-b border-neutral-100 last:border-0 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                  }`}
                >
                  <div className="px-4 py-3">
                    <div className="text-sm text-neutral-800 font-medium">{feature}</div>
                    {note && <div className="text-xs text-neutral-400 mt-0.5">{note}</div>}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center w-28">
                    <Cell type={mf} />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center w-28">
                    <Cell type={ce} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                  <Check className="h-3 w-3 text-green-700" />
                </span>
                Ja / fullt stöd
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100">
                  <Minus className="h-3 w-3 text-yellow-600" />
                </span>
                Delvis
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
                  <X className="h-3 w-3 text-red-600" />
                </span>
                Saknas
              </span>
            </div>
          </section>

          {/* For whom */}
          <section className="space-y-5 text-neutral-700 text-sm leading-relaxed mb-8">
            <h2 className="text-xl font-semibold text-neutral-900">För vem passar MacroFactor?</h2>
            <p>
              MacroFactor är ett starkt val för den som vill ha maximal automatisering av
              kaloriplanering och TDEE-kalibrering. Det passar dig som:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Är erfaren med kaloriräkning och vill ha en helautomatiserad pipeline</li>
              <li>
                Vill att appen ska justera kalorimålet veckovis baserat på din vikttrend — utan att
                du behöver räkna
              </li>
              <li>Är bekväm med ett engelskt gränssnitt</li>
              <li>Är villig att betala ett abonnemang för avancerade funktioner</li>
            </ul>
            <p>
              <strong>Begränsningen:</strong> MacroFactor är en premiumapp som kräver ett aktivt
              abonnemang. Gränssnittet är på engelska. Och trots kraftfull automatisering ger appen
              mindre transparens i hur beräkningarna görs — du ser resultatet men inte alltid
              logiken bakom.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2">
              För vem passar CalculEat?
            </h2>
            <p>
              CalculEat passar dig som vill ha precision och transparens — utan kostnad och på
              svenska. Det är rätt app om du:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                Vill ha <strong>individuellt TDEE</strong> och metabolisk kalibrering{' '}
                <strong>gratis</strong>
              </li>
              <li>
                Föredrar ett <strong>svenskt gränssnitt</strong> och matdatabas med
                Livsmedelsverket-data
              </li>
              <li>
                Vill ha <strong>full transparens</strong> i hur ditt kalorimål beräknas
              </li>
              <li>
                Arbetar med{' '}
                <Link to="/kalkylatorer/cut-kalkylator" className="text-primary-600 underline">
                  cut
                </Link>
                {'/'}
                <Link to="/kalkylatorer/bulk-kalkylator" className="text-primary-600 underline">
                  bulk
                </Link>
                {'/reverse diet och vill ha explicit fas-planering med '}
                <Link to="/kalkylatorer/kaloriunderskott" className="text-primary-600 underline">
                  rätt kaloriunderskott
                </Link>
              </li>
              <li>Vill ha kontroll — inte bara automation</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Automatisering vs transparens
            </h2>
            <p>
              MacroFactors styrka är att den sköter sig själv. Appen samlar in viktdata, beräknar
              TDEE-trend och justerar kalorimålet utan att du behöver göra något.
            </p>
            <p className="mt-2">
              CalculEats styrka är transparens och kontroll. Du ser hur ditt TDEE räknades ut, du
              väljer din fas manuellt och du förstår varför kalorimålet är som det är. Det gör det
              lättare att lita på siffrorna — och att göra informerade justeringar när något inte
              stämmer.
            </p>
            <p className="mt-2">
              Ingen av de två modellerna är objektivt bättre. Det handlar om vad du föredrar: vill
              du att appen sköter allt, eller vill du förstå vad som händer?
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Tre skäl att välja CalculEat framför MacroFactor
            </h2>
            <div className="space-y-3 mt-3">
              {[
                {
                  title: 'Gratis',
                  desc: 'MacroFactor kräver ett aktivt abonnemang. CalculEat är gratis för kaloriloggning, TDEE-beräkning, fas-tracking och metabolisk kalibrering. Inga dolda kostnader.',
                  color: 'bg-green-50 border-green-200',
                },
                {
                  title: 'Helt på svenska',
                  desc: 'CalculEat är byggt för den svenska marknaden med matdatabas från Livsmedelsverket och ett fullständigt svenskt gränssnitt. MacroFactor är primärt engelskspråkig.',
                  color: 'bg-blue-50 border-blue-200',
                },
                {
                  title: 'Transparens i beräkningarna',
                  desc: 'CalculEat visar hur ditt TDEE beräknas och varför kalorimålet är som det är. Du förstår logiken — inte bara resultatet. Det ger bättre kontroll när saker inte går som planerat.',
                  color: 'bg-primary-50 border-primary-200',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-neutral-800 mb-1 text-sm">{title}</div>
                  <div className="text-sm text-neutral-700">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Mid-page CTA */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900 mb-0.5">
                Vill du ha MacroFactors precision — utan abonnemanget?
              </p>
              <p className="text-xs text-primary-700">
                Individuellt TDEE, metabolisk kalibrering och fas-planering. Gratis, på svenska.
              </p>
            </div>
            <Link
              to="/kalkylatorer"
              className="shrink-0 inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              Testa gratis →
            </Link>
          </div>

          <FaqBlock items={FAQ_ITEMS} />

          {/* CTA */}
          <GuestOnly>
            <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                Samma precision som MacroFactor — helt gratis
              </h2>
              <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
                Individuellt TDEE, metabolisk kalibrering och fas-planering. På svenska, utan
                abonnemang. Skapa konto och kom igång direkt.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm"
                >
                  Skapa gratis konto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/kalkylatorer"
                  className="inline-flex items-center justify-center gap-2 border border-primary-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
                >
                  Räkna ut ditt TDEE först
                </Link>
              </div>
            </section>
          </GuestOnly>

          {/* Related */}
          <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Relaterade jämförelser
              </h3>
              <ul className="space-y-2">
                {[
                  {
                    href: '/jamfor/myfitnesspal-vs-calculeat',
                    label: 'MyFitnessPal vs CalculEat',
                  },
                  { href: '/jamfor/lifesum-vs-calculeat', label: 'Lifesum vs CalculEat' },
                  { href: '/jamfor/yazio-vs-calculeat', label: 'Yazio vs CalculEat' },
                  { href: '/basta-kaloriappen', label: 'Bästa kaloriappen 2026' },
                ].map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Relaterade kalkylatorer
              </h3>
              <ul className="space-y-2">
                {[
                  { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
                  { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
                  { href: '/kalkylatorer/cut-kalkylator', label: 'Cut & Deff Kalkylator' },
                  { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
                ].map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
