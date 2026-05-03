import { Link } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'

const CANONICAL = 'https://calculeat.se/jamfor/lifesum-vs-calculeat'

const FAQ_ITEMS = [
  {
    question: 'Är Lifesum bättre än CalculEat?',
    answer:
      'Det beror på vad du vill ha. Lifesum är bättre om du primärt vill följa ett färdigt kostprogram eller få recept och kostplaner. CalculEat är bättre om du vill ha ett precist kalorimål baserat på ditt faktiska TDEE, stöd för cut/bulk-cykler och att loggningen faktiskt driver resultat — inte bara dokumenterar vad du ätit.',
  },
  {
    question: 'Vad är skillnaden mellan Lifesum och CalculEat?',
    answer:
      'Lifesum fokuserar på kostplaner, recept och livsstilsprogram. CalculEat fokuserar på precisionen i kalorimålet: ditt individuella TDEE, din fas (cut/bulk/maintenance), och att justera kalorimålet när din kropp förändras. Lifesum är ett kostprogram-verktyg. CalculEat är ett kroppskompositions-verktyg.',
  },
  {
    question: 'Behöver man betala för att använda Lifesum?',
    answer:
      'Lifesums gratisversion är mycket begränsad — de flesta meningsfulla funktioner (kostplaner, detaljerade makron, recept) kräver premium. CalculEat är gratis att använda för kaloriloggning, TDEE-beräkning och fas-tracking.',
  },
  {
    question: 'Vilken app är bäst för viktnedgång?',
    answer:
      'Båda kan fungera för viktnedgång, men på olika sätt. Lifesum guidar dig via kostprogram. CalculEat ger dig ett precist kalorimål baserat på ditt uppmätta TDEE och hjälper dig kalibrera det om vikten inte rör sig som förväntat. Den som vill förstå varför vikten rör sig (eller inte) är bättre betjänt av CalculEat.',
  },
  {
    question: 'Kan Lifesum användas för bulk och cut?',
    answer:
      'Lifesum har inget inbyggt stöd för bulk/cut-cykler, fasbyten eller reverse diet-planering. Du kan manuellt justera kalorimål, men appen ger ingen vägledning om rätt underskott för cut, rätt surplus för bulk eller hur man övergår mellan faser. CalculEat är byggt specifikt för det.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Lifesum vs CalculEat — Vilken kaloriräknare är bäst? (2026)',
    description:
      'Jämförelse av Lifesum och CalculEat. Vilken app passar bäst för viktnedgång, kroppskomposition och TDEE-precision?',
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
        name: 'Lifesum vs CalculEat',
        item: CANONICAL,
      },
    ],
  },
]

type CellType = 'yes' | 'no' | 'partial'

const COMPARISON_ROWS: {
  feature: string
  lifesum: CellType
  ce: CellType
  note?: string
}[] = [
  { feature: 'Kaloriloggning', lifesum: 'yes', ce: 'yes' },
  { feature: 'Matdatabas', lifesum: 'yes', ce: 'partial', note: 'Livsmedelsverket + USDA' },
  { feature: 'Kostplaner / dieter', lifesum: 'yes', ce: 'no', note: 'Ej fokus för CalculEat' },
  { feature: 'Recept', lifesum: 'yes', ce: 'yes', note: 'CalculEat: egna recept' },
  {
    feature: 'TDEE-beräkning',
    lifesum: 'partial',
    ce: 'yes',
    note: 'Lifesum ger grundläggande kalorimål',
  },
  {
    feature: 'Metabolisk kalibrering',
    lifesum: 'no',
    ce: 'yes',
    note: 'Justeras baserat på faktisk viktdata',
  },
  { feature: 'Bulk/Cut-faser', lifesum: 'no', ce: 'yes', note: 'Separata mål per fas' },
  { feature: 'Reverse diet-stöd', lifesum: 'no', ce: 'yes' },
  { feature: 'Automatisk målanpassning', lifesum: 'no', ce: 'yes' },
  {
    feature: 'Proteinmål per fas',
    lifesum: 'partial',
    ce: 'yes',
    note: 'Lifesum: fast procent',
  },
  { feature: 'Streckkodsskanning', lifesum: 'yes', ce: 'yes' },
  {
    feature: 'Gratis för kärn-features',
    lifesum: 'no',
    ce: 'yes',
    note: 'Lifesum kräver premium för det mesta',
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

export default function LifesumVsCalculEatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Lifesum vs CalculEat — Vilken kaloriräknare är bäst? (2026)"
        description="Jämförelse av Lifesum och CalculEat. Lifesum erbjuder kostplaner och recept. CalculEat ger TDEE-precision, bulk/cut-stöd och kalorimål som faktiskt stämmer."
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
            <span className="text-neutral-700">Lifesum vs CalculEat</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            Lifesum vs CalculEat — Vilken app passar dig bäst?
          </h1>

          {/* Winner summary box */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">
              Snabbsvar
            </p>
            <p className="text-sm font-semibold text-primary-900 mb-3">
              CalculEat vinner för den som vill ha precision — inte kostprogram.
            </p>
            <ul className="space-y-1.5 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> Individuellt TDEE
                kalibrerat mot din faktiska viktdata
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> Inbyggt stöd för
                cut/bulk-faser och reverse diet
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> Gratis — Lifesums
                kärn-features kräver premium
              </li>
            </ul>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                to="/kalkylatorer/tdee-kalkylator"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Räkna ut ditt TDEE gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-primary-300 text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-100 transition-colors text-sm"
              >
                Skapa konto
              </Link>
            </div>
          </div>

          <p className="text-base text-neutral-600 leading-relaxed mb-6">
            Lifesum är ett kostprogram-verktyg med dieter, recept och livsstilsguider. CalculEat är
            ett precisionsverktyg för kroppskomposition — individuellt TDEE, rätt kalorimål per fas
            och kalibrering baserat på din faktiska viktdata.
          </p>

          {/* Inline CTA — high on page */}
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
                  Lifesum
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-primary-600 uppercase tracking-wider text-center w-28">
                  CalculEat
                </div>
              </div>

              {COMPARISON_ROWS.map(({ feature, lifesum, ce, note }, i) => (
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
                    <Cell type={lifesum} />
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
            <h2 className="text-xl font-semibold text-neutral-900">För vem passar Lifesum?</h2>
            <p>
              Lifesum är ett bra val om du vill ha struktur via ett färdigt program snarare än att
              räkna kalorier manuellt. Det passar dig som:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Vill ha ett färdigt kostprogram att följa (5:2, ketodiet, LCHF etc.)</li>
              <li>Föredrar recept och måltidsförslag framför fri loggning</li>
              <li>Inte primärt tränar med mål kring kroppskomposition</li>
              <li>Vill ha en helhetsapp för kost, hälsa och livsstil i en och samma plattform</li>
            </ul>
            <p>
              <strong>Begränsningen:</strong> Lifesums styrka är bredden — kostplaner, recept,
              hälsoinsikter. Men bredden innebär kompromisser i precision. TDEE-beräkningen är
              grundläggande, kalorimålet är statiskt och det saknas stöd för seriösa
              kroppskompositionsmål.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2">
              För vem passar CalculEat?
            </h2>
            <p>
              CalculEat passar dig som vill att siffrorna faktiskt stämmer. Det är rätt app om du:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                Vill ha ett <strong>individuellt TDEE</strong> — inte ett populationsgenomsnitt
              </li>
              <li>
                Arbetar med{' '}
                <Link to="/kalkylatorer/cut-kalkylator" className="text-primary-600 underline">
                  cut
                </Link>
                {'/'}
                <Link to="/kalkylatorer/bulk-kalkylator" className="text-primary-600 underline">
                  bulk-cykler
                </Link>{' '}
                och behöver rätt kalorimål per fas
              </li>
              <li>
                Märker att loggningen inte ger förväntat resultat och vill ha{' '}
                <strong>metabolisk kalibrering</strong> — börja med att räkna ut ditt{' '}
                <Link to="/kalkylatorer/kaloriunderskott" className="text-primary-600 underline">
                  exakta kaloriunderskott
                </Link>
              </li>
              <li>
                Planerar eller håller på med en <strong>reverse diet</strong>
              </li>
              <li>Vill använda en gratis app utan att låsa upp allt via premium</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Kostprogram vs kroppskomposition
            </h2>
            <p>
              Lifesums modell är: ge användaren ett program att följa. CalculEats modell är: ge
              användaren rätt tal baserat på deras kropp och mål.
            </p>
            <p className="mt-2">
              Om du följer ett kostprogram och det fungerar för dig behöver du inte byta. Men om du
              märker att du loggat noggrant men inte ser resultat — eller att du inte vet{' '}
              <em>varför</em> vikten rör sig eller inte — är precision i TDEE-målet mer värdefullt
              än fler recept.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Tre saker Lifesum inte löser
            </h2>
            <div className="space-y-3 mt-3">
              {[
                {
                  title: 'Fel TDEE från start',
                  desc: 'Lifesums kalorimål baseras på en standardformel utan kalibrering. Om din metabolism avviker från genomsnittet — och det gör den — är kalorimålet fel från dag ett.',
                  color: 'bg-red-50 border-red-200',
                },
                {
                  title: 'Inga fasbyten',
                  desc: 'Ska du byta från cut till maintenance eller starta en bulk? Lifesum saknar inbyggt stöd för fasbyten. Du får manuellt räkna ut och ändra kalorimål — utan vägledning om rätt nivå.',
                  color: 'bg-orange-50 border-orange-200',
                },
                {
                  title: 'Kalorimålet uppdateras aldrig',
                  desc: 'Under en cut sjunker ditt TDEE i takt med att du tappar vikt. Lifesums kalorimål är statiskt — det du satte i vecka 1 gäller fortfarande i vecka 12, även om din kropp har förändrats.',
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

          {/* Mid-page CTA */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900 mb-0.5">
                Vill du ha precision istället för program?
              </p>
              <p className="text-xs text-primary-700">
                Räkna ut ditt TDEE, välj din fas — cut, bulk eller maintenance — och logga mot rätt
                siffra.
              </p>
            </div>
            <Link
              to="/kalkylatorer/tdee-kalkylator"
              className="shrink-0 inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              Testa gratis →
            </Link>
          </div>

          <FaqBlock items={FAQ_ITEMS} />

          {/* CTA */}
          <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Testa precision istället för program — gratis
            </h2>
            <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
              Räkna ut ditt faktiska TDEE, sätt rätt kalorimål för din fas och logga mot siffror som
              faktiskt stämmer. Inget kreditkort, inga dolda kostnader.
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
                  { href: '/basta-kaloriappen', label: 'Bästa kaloriappen 2026' },
                  { href: '/basta-tdee-kalkylatorn', label: 'Bästa TDEE-kalkylatorn' },
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
