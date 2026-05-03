import { Link } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'

const CANONICAL = 'https://calculeat.se/jamfor/yazio-vs-calculeat'

const FAQ_ITEMS = [
  {
    question: 'Är Yazio bättre än CalculEat?',
    answer:
      'Det beror på vad du söker. Yazio är bra för enkel kaloriloggning med en stor matdatabas och ett enkelt gränssnitt. CalculEat är bättre om du vill ha ett individuellt TDEE, stöd för cut/bulk-cykler och kalorimål som kalibreras mot din faktiska viktdata — inte ett generiskt starttal.',
  },
  {
    question: 'Vad är skillnaden mellan Yazio och CalculEat?',
    answer:
      'Yazio är primärt ett loggningsverktyg med fokus på enkelhet och bredd — stor matdatabas, fastingläge, vattenkoll. CalculEat fokuserar på precision i kalorimålet: individuellt TDEE, fasbaserad planering (cut/bulk/maintenance) och metabolisk kalibrering. Yazio dokumenterar vad du äter. CalculEat hjälper dig att äta rätt mängd för ditt mål.',
  },
  {
    question: 'Har Yazio intermittent fasting-stöd?',
    answer:
      'Ja — Yazio har ett inbyggt fasting-läge som är en av appens starkaste sidor. CalculEat fokuserar inte på fastingprotokoll utan på kaloriekvationen och kroppskomposition. Fastingintresserade användare som också vill ha TDEE-precision kan använda Yazio för fasting-tracking och CalculEat för kalorimål och fasplanering.',
  },
  {
    question: 'Kan Yazio användas för bulk och cut?',
    answer:
      'Yazio har inget inbyggt stöd för bulk/cut-cykler. Du kan manuellt justera kalorimål, men appen ger ingen vägledning om rätt surplus för bulk, rätt underskott för cut eller hur man hanterar fasbyte och reverse diet. CalculEat är byggt specifikt för det.',
  },
  {
    question: 'Är Yazio gratis?',
    answer:
      'Yazio har en gratisversion men många funktioner — detaljerade makron, personliga mål, analysverktyg — kräver Yazio Pro. CalculEat är gratis för kaloriloggning, TDEE-beräkning och fas-tracking.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Yazio vs CalculEat — Vilken kaloriräknare är bäst? (2026)',
    description:
      'Jämförelse av Yazio och CalculEat. Vilken app ger bäst TDEE-precision, bulk/cut-stöd och kalorimål som faktiskt stämmer?',
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
      { '@type': 'ListItem', position: 3, name: 'Yazio vs CalculEat', item: CANONICAL },
    ],
  },
]

type CellType = 'yes' | 'no' | 'partial'

const COMPARISON_ROWS: {
  feature: string
  yazio: CellType
  ce: CellType
  note?: string
}[] = [
  { feature: 'Kaloriloggning', yazio: 'yes', ce: 'yes' },
  { feature: 'Stor matdatabas', yazio: 'yes', ce: 'partial', note: 'Livsmedelsverket + USDA' },
  { feature: 'Intermittent fasting-läge', yazio: 'yes', ce: 'no', note: 'Ej fokus för CalculEat' },
  { feature: 'Vattenkoll', yazio: 'yes', ce: 'no' },
  {
    feature: 'TDEE-beräkning',
    yazio: 'partial',
    ce: 'yes',
    note: 'Yazio ger grundläggande kalorimål',
  },
  {
    feature: 'Metabolisk kalibrering',
    yazio: 'no',
    ce: 'yes',
    note: 'Justeras baserat på faktisk viktdata',
  },
  { feature: 'Bulk/Cut-faser', yazio: 'no', ce: 'yes', note: 'Separata mål per fas' },
  { feature: 'Reverse diet-stöd', yazio: 'no', ce: 'yes' },
  { feature: 'Automatisk målanpassning', yazio: 'no', ce: 'yes' },
  {
    feature: 'Proteinmål per fas',
    yazio: 'partial',
    ce: 'yes',
    note: 'Yazio: fast procentsats',
  },
  { feature: 'Streckkodsskanning', yazio: 'yes', ce: 'yes' },
  {
    feature: 'Gratis för kärn-features',
    yazio: 'partial',
    ce: 'yes',
    note: 'Yazio Pro krävs för det mesta',
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

export default function YazioVsCalculEatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Yazio vs CalculEat — Vilken kaloriräknare är bäst? (2026)"
        description="Jämförelse av Yazio och CalculEat. Yazio erbjuder enkel loggning och fasting-läge. CalculEat ger TDEE-precision, bulk/cut-stöd och kalorimål som kalibreras efter din kropp."
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
            <span className="text-neutral-700">Yazio vs CalculEat</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            Yazio vs CalculEat — Vilken app passar dig bäst?
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-8 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            Yazio är en lättanvänd kaloriräknare med fokus på enkelt loggning, intermittent fasting
            och bredd. CalculEat är ett precisionsverktyg för kroppskomposition — individuellt TDEE,
            rätt kalorimål per fas och kalibrering baserat på din faktiska viktdata.
          </p>

          {/* Inline CTA */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900 mb-0.5">
                Räkna ut ditt TDEE innan du väljer app
              </p>
              <p className="text-xs text-primary-700">
                Utan ett korrekt TDEE är kalorimålet en gissning — oavsett vilken app du använder.
              </p>
            </div>
            <Link
              to="/kalkylatorer/tdee-kalkylator"
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
                  Yazio
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-primary-600 uppercase tracking-wider text-center w-28">
                  CalculEat
                </div>
              </div>

              {COMPARISON_ROWS.map(({ feature, yazio, ce, note }, i) => (
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
                    <Cell type={yazio} />
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
            <h2 className="text-xl font-semibold text-neutral-900">För vem passar Yazio?</h2>
            <p>
              Yazio är ett bra val om du vill ha ett enkelt och lättstartat loggningsverktyg. Det
              passar dig som:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Praktiserar intermittent fasting och vill ha ett inbyggt fasting-läge</li>
              <li>Vill ha en stor matdatabas med minimal inlärningskurva</li>
              <li>Loggar kalorier utan avancerade mål kring kroppskomposition</li>
              <li>Vill ha vattenkoll och enkla hälsopåminnelser i en app</li>
            </ul>
            <p>
              <strong>Begränsningen:</strong> Yazioss styrka är enkelhet. Men enkelhet innebär att
              kalorimålet är statiskt och generiskt — det anpassas inte till din faktiska
              metabolism, din nuvarande fas eller hur din kropp faktiskt svarar på kaloriintaget.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2">
              För vem passar CalculEat?
            </h2>
            <p>
              CalculEat passar dig som vill ha precision — inte bara loggning. Det är rätt app om
              du:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                Vill ha ett <strong>individuellt TDEE</strong> baserat på din kropp, inte ett
                populationssnitt
              </li>
              <li>
                Arbetar med <strong>cut/bulk-cykler</strong> och behöver separata kalorimål per fas
              </li>
              <li>
                Märker att loggningen inte ger resultat och vill ha{' '}
                <strong>metabolisk kalibrering</strong> baserat på din faktiska viktdata
              </li>
              <li>
                Planerar en <strong>reverse diet</strong> efter en längre cut
              </li>
              <li>Vill ha en gratis app utan att låsa upp allt via premium</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">Enkelhet vs precision</h2>
            <p>
              Yazioss modell är: gör loggningen så enkel som möjligt. CalculEats modell är: se till
              att du loggar mot rätt mål.
            </p>
            <p className="mt-2">
              Enkel loggning ger värde — men bara om kalorimålet stämmer. Om ditt TDEE är 2 400 kcal
              men appen säger 2 000 loggar du noggrant mot fel siffra. Resultaten uteblir och du vet
              inte varför.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Tre saker Yazio inte löser
            </h2>
            <div className="space-y-3 mt-3">
              {[
                {
                  title: 'Statiskt kalorimål',
                  desc: 'Yazioss kalorimål sätts en gång och ändras inte. Under en cut sjunker ditt TDEE gradvis i takt med viktminskning. I vecka 12 är kalorimålet från vecka 1 inte längre korrekt.',
                  color: 'bg-red-50 border-red-200',
                },
                {
                  title: 'Inga fasbyten',
                  desc: 'Ska du växla från cut till maintenance eller bulk? Yazio saknar inbyggt stöd — du manuellt justerar kalorimål utan vägledning om rätt nivå per fas.',
                  color: 'bg-orange-50 border-orange-200',
                },
                {
                  title: 'Ingen kalibrering mot verklig viktdata',
                  desc: 'Om din vikt inte rör sig som förväntat ger Yazio inga svar. CalculEat jämför ditt faktiska viktmönster mot förväntat och justerar TDEE-uppskattningen därefter.',
                  color: 'bg-yellow-50 border-yellow-200',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-neutral-800 mb-1 text-sm">{title}</div>
                  <div className="text-sm text-neutral-700">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <FaqBlock items={FAQ_ITEMS} />

          {/* CTA */}
          <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Prova precision istället för generiska mål — gratis
            </h2>
            <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
              Räkna ut ditt faktiska TDEE, välj din fas och logga mot ett kalorimål som faktiskt
              stämmer. Inget kreditkort, inga dolda kostnader.
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
                Relaterade jämförelser
              </h3>
              <ul className="space-y-2">
                {[
                  {
                    href: '/jamfor/myfitnesspal-vs-calculeat',
                    label: 'MyFitnessPal vs CalculEat',
                  },
                  { href: '/jamfor/lifesum-vs-calculeat', label: 'Lifesum vs CalculEat' },
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
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
