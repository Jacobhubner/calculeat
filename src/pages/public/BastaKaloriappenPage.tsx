import { Link } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'

const CANONICAL = 'https://calculeat.se/basta-kaloriappen'

const FAQ_ITEMS = [
  {
    question: 'Vilken är den bästa kaloriappen?',
    answer:
      'Det beror på ditt mål. MyFitnessPal är bäst om du vill ha en stor matdatabas och enkel loggning. MacroFactor är bäst för seriös makrotracking med adaptiv TDEE. CalculEat är bäst om du arbetar med specifika faser — cut, bulk eller reverse diet — och vill ha ett kalorimål som anpassas till din kropp och fas automatiskt. För svenska användare med tränings- och kroppskompositionsmål är CalculEat det starkaste alternativet.',
  },
  {
    question: 'Är MyFitnessPal bättre än CalculEat?',
    answer:
      'MyFitnessPal har en större matdatabas och fler tredjepartsintegrationer. CalculEat är starkare på TDEE-precision, bulk/cut-stöd, metabolisk kalibrering och reverse diet-planering. Om du primärt vill logga mat och inte aktivt arbetar med faser passar MFP bra. Om du vill att loggningen ska driva faktiska kroppskompositionsresultat passar CalculEat bättre.',
  },
  {
    question: 'Vilken app är bäst för bulk och cut?',
    answer:
      'CalculEat är designat specifikt för bulk/cut-cykler: separata kalorimål per fas, proteinrekommendation anpassad till cut (1,8–2,4 g/kg) vs bulk (1,6–2,2 g/kg), inbyggd reverse diet-logik och automatisk TDEE-anpassning. Ingen annan gratisapp erbjuder hela den här kedjan utan manuellt arbete.',
  },
  {
    question: 'Behöver man betala för en bra kaloriräknare?',
    answer:
      'Nej — CalculEat är helt gratis, inklusive TDEE-kalibrering, fas-stöd och makroplanering. MyFitnessPal låser sin bästa funktionalitet bakom Premium (ca 500–700 kr/månad). MacroFactor och Cronometer har bra gratislägen men begränsar avancerade funktioner. Du behöver inte betala för att få precis kalorispårning.',
  },
  {
    question: 'Vilken app ger bäst TDEE-beräkning?',
    answer:
      'MacroFactor och CalculEat är starkast på adaptiv TDEE. MacroFactor beräknar om TDEE varje vecka baserat på viktdata. CalculEat gör detsamma men kombinerar det med fasspecifika mål — så TDEE-beräkningen används direkt för att sätta rätt underskott eller överskott, inte bara visa ett tal.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Bästa kaloriappen 2026 — Vilken kaloriräknare är bäst?',
    description:
      'Jämförelse av de bästa kaloriapparna 2026: CalculEat, MyFitnessPal, Lifesum, Yazio och MacroFactor. Vilken passar bäst för viktminskning, bulk och cut?',
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
        name: 'Bästa kaloriappen',
        item: CANONICAL,
      },
    ],
  },
]

type CellType = 'yes' | 'no' | 'partial'

const APPS = ['CalculEat', 'MyFitnessPal', 'MacroFactor', 'Lifesum', 'Yazio'] as const
type App = (typeof APPS)[number]

const COMPARISON_ROWS: {
  feature: string
  values: Record<App, CellType>
  note?: string
}[] = [
  {
    feature: 'Kaloriloggning',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'yes',
      MacroFactor: 'yes',
      Lifesum: 'yes',
      Yazio: 'yes',
    },
  },
  {
    feature: 'Streckkodsskanning',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'yes',
      MacroFactor: 'yes',
      Lifesum: 'yes',
      Yazio: 'yes',
    },
  },
  {
    feature: 'Matdatabas',
    values: {
      CalculEat: 'partial',
      MyFitnessPal: 'yes',
      MacroFactor: 'yes',
      Lifesum: 'yes',
      Yazio: 'yes',
    },
    note: 'CalculEat: Livsmedelsverket + USDA',
  },
  {
    feature: 'TDEE-precision',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'partial',
      MacroFactor: 'yes',
      Lifesum: 'partial',
      Yazio: 'partial',
    },
    note: 'Adaptiv TDEE vs statisk formel',
  },
  {
    feature: 'Metabolisk kalibrering',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'no',
      MacroFactor: 'yes',
      Lifesum: 'no',
      Yazio: 'no',
    },
    note: 'Justeras baserat på verklig viktdata',
  },
  {
    feature: 'Bulk/Cut-faser',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'no',
      MacroFactor: 'partial',
      Lifesum: 'no',
      Yazio: 'no',
    },
    note: 'CalculEat: separata mål per fas',
  },
  {
    feature: 'Reverse diet-stöd',
    values: { CalculEat: 'yes', MyFitnessPal: 'no', MacroFactor: 'no', Lifesum: 'no', Yazio: 'no' },
  },
  {
    feature: 'Proteinmål per fas',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'partial',
      MacroFactor: 'yes',
      Lifesum: 'partial',
      Yazio: 'partial',
    },
  },
  {
    feature: 'Makroplanering',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'yes',
      MacroFactor: 'yes',
      Lifesum: 'partial',
      Yazio: 'partial',
    },
  },
  {
    feature: 'Helt gratis kärn-features',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'no',
      MacroFactor: 'partial',
      Lifesum: 'no',
      Yazio: 'no',
    },
    note: 'MFP, Lifesum och Yazio låser avancerat bakom premium',
  },
  {
    feature: 'Svenskt innehåll',
    values: {
      CalculEat: 'yes',
      MyFitnessPal: 'partial',
      MacroFactor: 'no',
      Lifesum: 'yes',
      Yazio: 'yes',
    },
    note: 'CalculEat: Livsmedelsverkets databas',
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

const FOR_WHOM = [
  {
    title: 'Bäst för viktminskning',
    winner: 'CalculEat',
    desc: 'CalculEat beräknar ditt faktiska TDEE och sätter ett korrekt kalorimål baserat på din kropp — inte en generisk formel. Kalorimålet justeras automatiskt om din vikt inte rör sig som förväntat. Du loggar mot rätt mål, inte ett gissat.',
    color: 'bg-primary-50 border-primary-200',
  },
  {
    title: 'Bäst för muskeluppbyggnad',
    winner: 'CalculEat',
    desc: 'Lean bulk kräver ett exakt kaloriöverskott — för litet ger inget resultat, för stort ger onödig fettupplagring. CalculEat sätter rätt överskott för ditt lean/standard/aggressivt bulkmål och beräknar ett proteinmål optimalt för muskeltillväxt.',
    color: 'bg-green-50 border-green-200',
  },
  {
    title: 'Bäst för nybörjare',
    winner: 'CalculEat eller Lifesum',
    desc: 'Lifesum har en enkel och visuellt tilltalande upplevelse. CalculEat är lika enkelt att komma igång med men ger direkt bättre TDEE-precision. Välj CalculEat om du vill ha rätt siffror från start — du lär dig att logga lika snabbt.',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    title: 'Bäst för datadriven precision',
    winner: 'CalculEat eller MacroFactor',
    desc: 'MacroFactor är branschstandarden för adaptiv TDEE och rekommenderas av många coaches. CalculEat matchar den adaptiva TDEE-funktionen och lägger till fasspecifikt stöd för bulk, cut och reverse diet — utan kostnad.',
    color: 'bg-orange-50 border-orange-200',
  },
  {
    title: 'Bäst för stora matdatabaser',
    winner: 'MyFitnessPal',
    desc: 'Med över 14 miljoner livsmedel i databasen vinner MyFitnessPal på bredd. Om du äter ute ofta eller behöver exotiska livsmedel är MFP fortfarande bäst på datamängd. Kompromissen är sämre TDEE-precision och betalvägg för de bästa funktionerna.',
    color: 'bg-neutral-50 border-neutral-200',
  },
]

export default function BastaKaloriappenPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Bästa kaloriappen 2026 — Bästa kaloriräknaren för viktminskning | CalculEat"
        description="Vilken är bästa kaloriappen 2026? Jämförelse av CalculEat, MyFitnessPal, MacroFactor, Lifesum och Yazio. Hitta rätt app för viktminskning, bulk och cut."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <Link to="/" className="hover:text-neutral-700 transition-colors">
              CalculEat
            </Link>
            <span>/</span>
            <span className="text-neutral-700">Bästa kaloriappen</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            Bästa kaloriappen 2026 — Vilken kaloriräknare är bäst?
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-3 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            De flesta kaloriappar gör samma sak: de låter dig logga mat och visar hur mycket du
            ätit. Skillnaden är vad de gör med den informationen — och om de faktiskt hjälper dig
            att nå ditt mål.
          </p>
          <p className="text-sm text-neutral-500 mb-8 pl-4">
            <strong className="text-neutral-700">Kortversion:</strong> För viktminskning, bulk/cut
            och datadriven precision — <strong className="text-primary-600">CalculEat</strong>. För
            störst matdatabas — MyFitnessPal. För enkel nybörjarupplevelse — Lifesum.
          </p>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Snabb jämförelse — 5 populära kaloriappar
            </h2>
            <div className="rounded-2xl border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider min-w-[160px]">
                      Funktion
                    </th>
                    {APPS.map(app => (
                      <th
                        key={app}
                        className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-center w-24 ${
                          app === 'CalculEat' ? 'text-primary-600' : 'text-neutral-500'
                        }`}
                      >
                        {app}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map(({ feature, values, note }, i) => (
                    <tr
                      key={feature}
                      className={`border-b border-neutral-100 last:border-0 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-neutral-800 font-medium">{feature}</div>
                        {note && <div className="text-xs text-neutral-400 mt-0.5">{note}</div>}
                      </td>
                      {APPS.map(app => (
                        <td key={app} className="px-3 py-3 text-center">
                          <div className="flex justify-center">
                            <Cell type={values[app]} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-5">
              Vilken kaloriapp passar dig bäst?
            </h2>
            <div className="space-y-4">
              {FOR_WHOM.map(({ title, winner, desc, color }) => (
                <div key={title} className={`rounded-xl border p-5 ${color}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="font-semibold text-neutral-800">{title}</div>
                    <div className="text-xs font-semibold text-neutral-600 bg-white/70 rounded-lg px-2 py-1 whitespace-nowrap shrink-0">
                      {winner}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why standard calorie apps often fail */}
          <section className="mb-12 space-y-4 text-sm text-neutral-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-neutral-900">
              Varför klassiska kaloriappar inte ger resultat
            </h2>
            <p>
              Det vanligaste problemet är inte att folk inte loggar — det är att de loggar mot fel
              mål. En app som ger dig ett statiskt kalorimål baserat på en generisk formel tar inte
              hänsyn till hur din kropp faktiskt svarar.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Fel TDEE från start',
                  desc: 'Populationsformler (Mifflin-St Jeor, Harris-Benedict) kan missa ditt individuella TDEE med 200–400 kcal. Du håller ditt kalorimål men det är fel kalorimål.',
                  color: 'bg-red-50 border-red-200',
                },
                {
                  title: 'Kalorimålet uppdateras aldrig',
                  desc: 'Din vikt, muskelmassa och aktivitetsnivå förändras — men din app håller kvar det ursprungliga målet. Du loggar rätt, men mot en föråldrad siffra.',
                  color: 'bg-orange-50 border-orange-200',
                },
                {
                  title: 'Inget stöd för fasbyten',
                  desc: 'Att gå från cut till maintenance kräver ett nytt kalorimål, nytt proteinmål och en plan för övergången. Klassiska appar låter dig göra allt manuellt — utan vägledning.',
                  color: 'bg-yellow-50 border-yellow-200',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-neutral-800 mb-1">{title}</div>
                  <div className="text-neutral-700">{desc}</div>
                </div>
              ))}
            </div>
            <p>
              CalculEat löser alla tre: TDEE beräknas och kalibreras mot din faktiska viktdata,
              kalorimålet anpassas per fas, och du får rätt proteinmål för varje fas automatiskt.
            </p>
          </section>

          {/* Internal link block */}
          <section className="mb-12 rounded-2xl bg-neutral-50 border border-neutral-200 p-6">
            <h2 className="text-base font-semibold text-neutral-800 mb-3">
              Räkna ut ditt exakta kaloribehov
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Ingen kaloriapp är bättre än det kalorimål du loggar mot. Börja med att räkna ut ditt
              TDEE — det är basen för allt annat.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to="/kalkylatorer/tdee-kalkylator"
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                TDEE Kalkylator
              </Link>
              <Link
                to="/kalkylatorer/kaloriunderskott"
                className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 font-medium px-4 py-2.5 rounded-xl hover:bg-white transition-colors text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                Kaloribrist Kalkylator
              </Link>
            </div>
          </section>

          <FaqBlock items={FAQ_ITEMS} />

          {/* CTA */}
          <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Testa CalculEat gratis</h2>
            <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
              Räkna ut ditt TDEE, välj din fas och börja logga mot ett kalorimål som faktiskt
              stämmer. Ingen betalvägg, inga dolda kostnader.
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
                to="/kalkylatorer/tdee-kalkylator"
                className="inline-flex items-center justify-center gap-2 border border-primary-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                Räkna ut ditt TDEE först
              </Link>
            </div>
          </section>

          {/* Related */}
          <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Relaterade kalkylatorer
              </h3>
              <ul className="space-y-2">
                {[
                  { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
                  { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
                  { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
                  { href: '/kalkylatorer/cut-kalkylator', label: 'Cut Kalkylator' },
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
                Relaterade artiklar
              </h3>
              <ul className="space-y-2">
                {[
                  {
                    href: '/jamfor/myfitnesspal-vs-calculeat',
                    label: 'MyFitnessPal vs CalculEat',
                  },
                  { href: '/jamfor/lifesum-vs-calculeat', label: 'Lifesum vs CalculEat' },
                  { href: '/jamfor/yazio-vs-calculeat', label: 'Yazio vs CalculEat' },
                  { href: '/jamfor/macrofactor-vs-calculeat', label: 'MacroFactor vs CalculEat' },
                  { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                  { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                  { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut' },
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
