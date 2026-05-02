import { Link } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'

const CANONICAL = 'https://calculeat.se/jamfor/myfitnesspal-vs-calculeat'

const FAQ_ITEMS = [
  {
    question: 'Är CalculEat bättre än MyFitnessPal?',
    answer:
      'Det beror på vad du använder appen till. MyFitnessPal har en större matdatabas och fler integrationer. CalculEat är bättre om du vill ha precis TDEE-kalibrering, stöd för bulk/cut-cykler, reverse diet-planering och att faktiskt förstå varför du äter det du äter — inte bara logga det. För seriös kroppskompositions-tracking ger CalculEat mer handlingsbara svar.',
  },
  {
    question: 'Vad är skillnaden mellan TDEE och kalorimål?',
    answer:
      'Kalorimål i MyFitnessPal är ett statiskt tal du sätter (t.ex. 1800 kcal). TDEE är din faktiska totala energiförbrukning baserat på din kropp och aktivitetsnivå. I CalculEat anpassas ditt kalorimål automatiskt baserat på ditt uppmätta TDEE och ditt specifika mål — cut, bulk eller maintenance — med rätt underskott eller överskott inbyggt.',
  },
  {
    question: 'Behöver man verkligen metabolisk kalibrering?',
    answer:
      'Inte alla behöver det — men de flesta som logging länge märker att de "inte går ner trots att de håller kalorierna". Det beror oftast på att TDEE-uppskattningen var fel. Metabolisk kalibrering justerar ditt mål baserat på hur din faktiska vikt förändras (eller inte), inte bara formler. Det är skillnaden mellan att gissa och att mäta.',
  },
  {
    question: 'Vilken app är bäst för cut och bulk?',
    answer:
      'CalculEat är designat för cut/bulk-cykler: separata mål för varje fas, proteinrekommendation anpassad till fasen, inbyggd reverse diet-logik och TDEE-anpassning. MyFitnessPal kräver att du manuellt ändrar kalorimål och har inget inbyggt stöd för fasbyten eller reverse diet-planering.',
  },
  {
    question: 'Finns ett bättre alternativ till MyFitnessPal?',
    answer:
      'Det beror på vad du saknar. Lifesum fokuserar på kostplaner. Cronometer är bäst för mikronäringsämnen. CalculEat fokuserar på kroppskompositionsmål — TDEE-precision, bulk/cut-stöd och att kaloriloggningen faktiskt driver beslut, inte bara registrerar vad du ätit.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'MyFitnessPal vs CalculEat — Vilken kaloriräknare är bäst? (2026)',
    description:
      'Jämförelse av MyFitnessPal och CalculEat. Vilken app ger dig bäst precision för viktnedgång, bulk och kroppskompositionsmål?',
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
      {
        '@type': 'ListItem',
        position: 3,
        name: 'MyFitnessPal vs CalculEat',
        item: CANONICAL,
      },
    ],
  },
]

type CellType = 'yes' | 'no' | 'partial'

const COMPARISON_ROWS: {
  feature: string
  mfp: CellType
  ce: CellType
  note?: string
}[] = [
  { feature: 'Kaloriloggning', mfp: 'yes', ce: 'yes' },
  { feature: 'Stor matdatabas', mfp: 'yes', ce: 'partial', note: 'Livsmedelsverket + USDA' },
  {
    feature: 'TDEE-beräkning',
    mfp: 'partial',
    ce: 'yes',
    note: 'MFP ger grundläggande aktivitetsnivå',
  },
  {
    feature: 'Metabolisk kalibrering',
    mfp: 'no',
    ce: 'yes',
    note: 'Justeras baserat på verklig viktförändring',
  },
  { feature: 'Bulk/Cut-faser', mfp: 'no', ce: 'yes', note: 'Separata mål per fas' },
  {
    feature: 'Reverse diet-stöd',
    mfp: 'no',
    ce: 'yes',
    note: 'Strukturerad övergång efter cut',
  },
  {
    feature: 'Automatisk målanpassning',
    mfp: 'no',
    ce: 'yes',
    note: 'Kalorimål anpassas till vald fas',
  },
  {
    feature: 'Proteinmål per fas',
    mfp: 'partial',
    ce: 'yes',
    note: 'MFP ger fast proteinprocent',
  },
  { feature: 'Makroplanering', mfp: 'yes', ce: 'yes' },
  { feature: 'Streckkodsskanning', mfp: 'yes', ce: 'yes' },
  { feature: 'Progress tracking', mfp: 'yes', ce: 'yes' },
  { feature: 'Premium-krav för kärn-features', mfp: 'yes', ce: 'no', note: 'CalculEat är gratis' },
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

export default function MyFitnessPalVsCalculEatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="MyFitnessPal vs CalculEat — Vilken kaloriräknare är bäst? (2026)"
        description="Jämförelse av MyFitnessPal och CalculEat. Vilken app ger dig bäst precision, bulk/cut-stöd och TDEE-kalibrering för ditt mål? Objektiv genomgång."
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
            <span className="text-neutral-700">MyFitnessPal vs CalculEat</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            MyFitnessPal vs CalculEat — Vilken kaloriräknare passar dig bäst?
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-8 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            Båda apparna låter dig logga kalorier. Skillnaden är vad de gör med den informationen.
            MyFitnessPal är ett loggningsverktyg. CalculEat är designat för att kaloriloggningen
            faktiskt ska driva beslut — rätt kalorimål för ditt mål, anpassat till din kropp.
          </p>

          {/* Comparison table */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Snabb jämförelse</h2>
            <div className="rounded-2xl border border-neutral-200 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-0 bg-neutral-50 border-b border-neutral-200">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Funktion
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center w-28">
                  MyFitnessPal
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-primary-600 uppercase tracking-wider text-center w-28">
                  CalculEat
                </div>
              </div>

              {/* Rows */}
              {COMPARISON_ROWS.map(({ feature, mfp, ce, note }, i) => (
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
                    <Cell type={mfp} />
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
            <h2 className="text-xl font-semibold text-neutral-900">För vem passar MyFitnessPal?</h2>
            <p>
              MyFitnessPal är ett utmärkt val om du primärt vill logga mat utan att tänka för mycket
              på precision. Det passar dig som:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Vill ha tillgång till en stor matdatabas med hundratals miljoner livsmedel</li>
              <li>Redan har ett kalorimål du är nöjd med och bara vill hålla koll</li>
              <li>
                Använder andra appar eller enheter (Garmin, Fitbit) och vill synkronisera data
              </li>
              <li>Inte primärt tränar med kroppskompositionsmål</li>
            </ul>
            <p>
              <strong>Begränsningen:</strong> MyFitnessPal ger dig ett kalorimål — men anpassar det
              inte automatiskt till om du bulkar, cutter, ska börja reverse dieta eller om din
              metabolism har förändrats. Det manuella arbetet faller på dig.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2">
              För vem passar CalculEat?
            </h2>
            <p>
              CalculEat är byggt för den som vill att kaloriloggningen ska driva faktiska resultat —
              inte bara dokumentera vad man ätit. Det passar dig som:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                Vill ha ett <strong>exakt TDEE</strong> baserat på din kropp, inte en
                populationsformel
              </li>
              <li>
                Arbetar med <strong>cut/bulk-cykler</strong> och behöver separata mål per fas
              </li>
              <li>
                Planerar eller håller på med en <strong>reverse diet</strong> efter en längre cut
              </li>
              <li>
                Vill ha <strong>proteinmål anpassat till fasen</strong> (högre under cut, lägre
                under bulk)
              </li>
              <li>
                Trött på att vikten inte reagerar som förväntat och vill ha{' '}
                <strong>metabolisk kalibrering</strong> baserat på verklig viktdata
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Den största skillnaden i praktiken
            </h2>
            <p>
              MyFitnessPal frågar: <em>&ldquo;Hur mycket vill du väga?&rdquo;</em> och ger dig ett
              generiskt kalorimål.
            </p>
            <p>
              CalculEat frågar:{' '}
              <em>
                &ldquo;Vad är ditt faktiska TDEE just nu, i vilken fas är du, och hur ska ditt
                kalorimål justeras utifrån hur din kropp faktiskt svarar?&rdquo;
              </em>
            </p>
            <p>
              Det är skillnaden mellan att gissa och att mäta. De flesta som loggat länge i
              MyFitnessPal utan resultat loggade rätt — men mot fel mål.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Varför &ldquo;bara logga kalorier&rdquo; ofta inte räcker
            </h2>
            <p>
              Kaloriloggning är ett verktyg, inte ett mål. Det ger värde bara om det kopplas till
              ett korrekt och dynamiskt kalorimål. Tre vanliga problem med statisk loggning:
            </p>
            <div className="space-y-3 mt-3">
              {[
                {
                  title: 'TDEE-felet',
                  desc: 'Du loggar mot 1800 kcal för att en app sa det. Men ditt faktiska TDEE är 2100 eller 1600. Resultaten stämmer inte — men du vet inte varför.',
                  color: 'bg-red-50 border-red-200',
                },
                {
                  title: 'Fasblandningen',
                  desc: 'Du äter på ett cut-mål men egentligen är du i maintenance-fas. Kroppen anpassar sig nedåt och du tappar muskler, inte fett.',
                  color: 'bg-orange-50 border-orange-200',
                },
                {
                  title: 'Metabolisk drift',
                  desc: 'Efter 12 veckors cut är ditt TDEE 150–300 kcal lägre än det var vid start. Kalorimålet du satte i vecka 1 stämmer inte i vecka 12.',
                  color: 'bg-yellow-50 border-yellow-200',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-neutral-800 mb-1 text-sm">{title}</div>
                  <div className="text-sm text-neutral-700">{desc}</div>
                </div>
              ))}
            </div>
            <p className="mt-4">
              CalculEat löser alla tre: TDEE beräknas individuellt, justeras baserat på faktisk
              viktdata, och kalorimålet uppdateras automatiskt när du byter fas.
            </p>
          </section>

          <FaqBlock items={FAQ_ITEMS} />

          {/* CTA */}
          <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Prova ett mer precist alternativ — gratis
            </h2>
            <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
              Räkna ut ditt faktiska TDEE, välj din fas och låt CalculEat sätta rätt kalorimål
              direkt. Inget kreditkort, inga dolda kostnader.
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
                  { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
                  { href: '/kalkylatorer/cut-kalkylator', label: 'Cut Kalkylator' },
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
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Relaterade artiklar
              </h3>
              <ul className="space-y-2">
                {[
                  { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                  { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                  { href: '/artiklar/reverse-diet', label: 'Reverse Diet' },
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
