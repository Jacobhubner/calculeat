import { Link } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'

const CANONICAL = 'https://calculeat.se/basta-tdee-kalkylatorn'

const FAQ_ITEMS = [
  {
    question: 'Vilken TDEE kalkylator är mest exakt?',
    answer:
      'Ingen statisk TDEE-kalkylator är exakt — de är alla uppskattningar baserade på populationsformler. Exaktheten avgörs av hur kalkylatorn hanterar aktivitetsnivå och om den kan kalibreras mot verkliga resultat. CalculEat och MacroFactor är de enda gratisalternativen som justerar ditt TDEE baserat på faktisk viktförändring — och är därför mer exakta över tid än statiska kalkylatorer som TDEECalculator.net.',
  },
  {
    question: 'Är TDEECalculator.net bättre än CalculEat?',
    answer:
      'TDEECalculator.net är ett bra verktyg för en snabb engångsuppskattning. CalculEat är bättre om du faktiskt ska använda TDEE-resultatet — det kopplar direkt till ditt kalorimål, anpassar det per fas (cut/bulk/maintenance) och kalibrerar mot din viktdata. TDEECalculator.net ger dig ett tal. CalculEat ger dig ett handlingsbart mål.',
  },
  {
    question: 'Varför skiljer sig olika TDEE-kalkylatorer?',
    answer:
      'Skillnaderna beror på tre faktorer: vilken BMR-formel som används (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle), hur aktivitetsnivåer är definierade (vissa är mer generösa än andra), och om kalkylatorn tar hänsyn till NEAT och träningsvolym separat. En kalkylator som ger 2100 kcal och en annan som ger 2350 kcal kan båda vara &ldquo;rätt&rdquo; — den verkliga TDEE lär du dig bara genom att mäta vikttrenden mot intag.',
  },
  {
    question: 'Hur vet man om sitt TDEE stämmer?',
    answer:
      'Logga kalorier exakt under 2–3 veckor och mät viktförändringen varje dag (morgon, fastande). Om du äter 2200 kcal och vikten är stabil är ditt TDEE ca 2200. Om du tappar 0,3 kg/vecka är ditt faktiska TDEE ca 2200 + 330 = 2530 kcal. Den här metoden — kallas metabolisk kalibrering — är mer exakt än alla formler och är inbyggd i CalculEat.',
  },
  {
    question: 'Hur ofta ska man uppdatera sitt kaloribehov?',
    answer:
      'Var 4–6 vecka om du aktivt försöker förändra din kropp. TDEE förändras med kroppsvikt, muskelmassa, träningsvolym och adaptiv termogenes. En statisk kalkylator du använde vid start stämmer inte efter 12 veckors cut. CalculEat uppdaterar ditt kalorimål löpande baserat på faktisk vikttrend — du behöver inte räkna om manuellt.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Bästa TDEE Kalkylatorn 2026 — Vilken ger mest exakt kaloribehov?',
    description:
      'Jämförelse av de bästa TDEE-kalkylatorer 2026: CalculEat, TDEECalculator.net, MyFitnessPal, MacroFactor och Lifesum. Vilken ger mest exakt kaloribehov?',
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
        name: 'Bästa TDEE Kalkylatorn',
        item: CANONICAL,
      },
    ],
  },
]

type CellType = 'yes' | 'no' | 'partial'

const TOOLS = ['CalculEat', 'TDEECalculator.net', 'MyFitnessPal', 'MacroFactor', 'Lifesum'] as const
type Tool = (typeof TOOLS)[number]

const COMPARISON_ROWS: {
  feature: string
  values: Record<Tool, CellType>
  note?: string
}[] = [
  {
    feature: 'TDEE-beräkning',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'yes',
      MyFitnessPal: 'partial',
      MacroFactor: 'yes',
      Lifesum: 'partial',
    },
    note: 'MFP och Lifesum: förenklad aktivitetsnivå',
  },
  {
    feature: 'Anpassning efter vikttrend',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'no',
      MyFitnessPal: 'no',
      MacroFactor: 'yes',
      Lifesum: 'no',
    },
    note: 'Kalibreras mot faktisk viktförändring',
  },
  {
    feature: 'Bulk/Cut-stöd',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'partial',
      MyFitnessPal: 'no',
      MacroFactor: 'partial',
      Lifesum: 'no',
    },
    note: 'CalculEat: separata kalorimål per fas',
  },
  {
    feature: 'Kaloriunderskott-planering',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'partial',
      MyFitnessPal: 'no',
      MacroFactor: 'yes',
      Lifesum: 'no',
    },
    note: 'Inbyggt i kalorimålet, inte manuellt',
  },
  {
    feature: 'Proteinrekommendation',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'partial',
      MyFitnessPal: 'partial',
      MacroFactor: 'yes',
      Lifesum: 'partial',
    },
    note: 'CalculEat: anpassad per fas (cut vs bulk)',
  },
  {
    feature: 'Historik och uppföljning',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'no',
      MyFitnessPal: 'yes',
      MacroFactor: 'yes',
      Lifesum: 'yes',
    },
  },
  {
    feature: 'Reverse diet-stöd',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'no',
      MyFitnessPal: 'no',
      MacroFactor: 'no',
      Lifesum: 'no',
    },
  },
  {
    feature: 'Svenskt stöd',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'no',
      MyFitnessPal: 'partial',
      MacroFactor: 'no',
      Lifesum: 'yes',
    },
    note: 'CalculEat: Livsmedelsverkets databas',
  },
  {
    feature: 'Gratisversion',
    values: {
      CalculEat: 'yes',
      'TDEECalculator.net': 'yes',
      MyFitnessPal: 'partial',
      MacroFactor: 'partial',
      Lifesum: 'partial',
    },
    note: 'MFP/MacroFactor/Lifesum låser funktioner bakom premium',
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
    desc: 'CalculEat beräknar ditt TDEE, sätter ett kalorimål med rätt underskott och justerar automatiskt om vikten inte rör sig som förväntat. Du behöver inte manuellt räkna om — appen lär sig ditt faktiska TDEE från hur din kropp svarar.',
    color: 'bg-primary-50 border-primary-200',
  },
  {
    title: 'Bäst för bulk och cut',
    winner: 'CalculEat',
    desc: 'TDEE-kalkylatorer som TDEECalculator.net ger ett enda tal. CalculEat ger separata kalorimål för varje fas: rätt överskott för bulk, rätt underskott för cut, och ett strukturerat protokoll för reverse diet däremellan.',
    color: 'bg-green-50 border-green-200',
  },
  {
    title: 'Bäst för precision över tid',
    winner: 'CalculEat eller MacroFactor',
    desc: 'MacroFactor är branschstandarden för adaptiv TDEE och används av professionella coaches. CalculEat erbjuder samma kalibreringsfunktion, kombinerat med fasspecifika mål och reverse diet-stöd — utan premiumkostnad.',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    title: 'Bäst för snabb engångsuppskattning',
    winner: 'TDEECalculator.net',
    desc: 'Om du bara vill ha ett snabbt referensvärde utan att skapa ett konto är TDEECalculator.net det enklaste alternativet. Men siffran du får är en uppskattning — inte kalibrerad till din kropp.',
    color: 'bg-neutral-50 border-neutral-200',
  },
]

export default function BastaTdeeKalkylatornPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Bästa TDEE Kalkylatorn 2026 — Räkna ut ditt kaloribehov rätt | CalculEat"
        description="Vilken TDEE-kalkylator är bäst 2026? Jämförelse av CalculEat, TDEECalculator.net, MyFitnessPal, MacroFactor och Lifesum. Hitta rätt kalkylator för viktminskning och bulk/cut."
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
            <span className="text-neutral-700">Bästa TDEE Kalkylatorn</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            Bästa TDEE Kalkylatorn 2026 — Vilken ger mest exakt kaloribehov?
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-3 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            De flesta TDEE-kalkylatorer använder samma grundformel — men skiljer sig i hur de
            hanterar aktivitetsnivå, måljustering och uppföljning. Den bästa TDEE-kalkylatorn är den
            som inte bara ger en uppskattning, utan hjälper dig justera efter verkliga resultat.
          </p>
          <p className="text-sm text-neutral-500 mb-8 pl-4">
            <strong className="text-neutral-700">Kortversion:</strong> För ett handlingsbart mål som
            kalibreras mot din kropp — <strong className="text-primary-600">CalculEat</strong>. För
            en snabb engångsuppskattning — TDEECalculator.net. För adaptiv precision med
            coaching-standard — MacroFactor.
          </p>

          {/* Primary CTA — high on page */}
          <div className="mb-10 rounded-2xl bg-primary-50 border border-primary-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="font-semibold text-neutral-800 mb-1">
                Räkna ut ditt TDEE gratis nu
              </div>
              <div className="text-sm text-neutral-600">
                Fyll i ålder, vikt, längd och aktivitetsnivå — få ditt exakta kaloribehov direkt.
                Ingen registrering krävs.
              </div>
            </div>
            <Link
              to="/kalkylatorer/tdee-kalkylator"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm whitespace-nowrap"
            >
              Öppna TDEE Kalkylatorn
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Snabb jämförelse — 5 TDEE-kalkylatorer
            </h2>
            <div className="rounded-2xl border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider min-w-[160px]">
                      Funktion
                    </th>
                    {TOOLS.map(tool => (
                      <th
                        key={tool}
                        className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-center w-24 ${
                          tool === 'CalculEat' ? 'text-primary-600' : 'text-neutral-500'
                        }`}
                      >
                        {tool}
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
                      {TOOLS.map(tool => (
                        <td key={tool} className="px-3 py-3 text-center">
                          <div className="flex justify-center">
                            <Cell type={values[tool]} />
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
              Vilken TDEE-kalkylator passar dig bäst?
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

          {/* Why static calculators fail */}
          <section className="mb-12 space-y-4 text-sm text-neutral-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-neutral-900">
              Varför statiska TDEE-kalkylatorer ofta blir fel
            </h2>
            <p>
              En TDEE-kalkylator kan aldrig vara exakt vid första beräkningen — den gissar baserat
              på genomsnittsvärden. Problemet är inte uppskattningen i sig, det är att de flesta
              appar och kalkylatorer aldrig uppdaterar den.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Aktivitetsnivå är det svagaste ledet',
                  desc: 'PAL-multiplikatorerna (sedentary, lightly active, very active) är grova kategorier. Skillnaden mellan "lightly active" och "moderately active" kan vara 200–400 kcal/dag. Nästan ingen vet exakt vilken de tillhör.',
                  color: 'bg-orange-50 border-orange-200',
                },
                {
                  title: 'Adaptiv termogenes ignoreras',
                  desc: 'Under en längre cut sjunker ditt faktiska TDEE med 150–300 kcal jämfört med formeln — kroppen minskar NEAT och BMR som svar på energibrist. En statisk kalkylator tar aldrig hänsyn till detta.',
                  color: 'bg-red-50 border-red-200',
                },
                {
                  title: 'Formeln stämmer inte för alla kroppstyper',
                  desc: 'Mifflin-St Jeor är den mest validerade formeln men har ett konfidensintervall på ±10%. För en person med TDEE 2500 kcal innebär det ett möjligt fel på ±250 kcal — tillräckligt för att sabotera ett cut.',
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
              Lösningen är inte en bättre formel — det är ett system som mäter din faktiska
              vikttrend och kalibrerar TDEE-uppskattningen mot verkligheten. Det är precis vad
              CalculEat gör.
            </p>
          </section>

          {/* When CalculEat is better */}
          <section className="mb-12 space-y-3 text-sm text-neutral-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-neutral-900">
              När CalculEat är bättre än klassiska TDEE-kalkylatorer
            </h2>
            <p>
              En statisk TDEE-kalkylator fyller sin funktion som referensvärde. CalculEat är ett
              annat verktyg med ett annat syfte: att TDEE-beräkningen faktiskt driver ett
              handlingsbart och korrekt kalorimål.
            </p>
            <ul className="space-y-2 pl-4 list-disc">
              <li>
                Du vill logga mot ett <strong>kalorimål som uppdateras</strong> när din vikt
                förändras — inte samma siffra som du räknade ut vid start.
              </li>
              <li>
                Du arbetar med <strong>cut eller bulk</strong> och behöver ett kalorimål med rätt
                underskott eller överskott inbyggt, anpassat till din fas.
              </li>
              <li>
                Du har loggat länge i en annan app men <strong>inte sett resultat</strong> — det
                klassiska symptomet på att du loggar mot fel TDEE.
              </li>
              <li>
                Du planerar en <strong>reverse diet</strong> och behöver ett strukturerat protokoll
                för att höja kalorier gradvis utan att lagra fett.
              </li>
              <li>
                Du vill ha <strong>proteinmål anpassat till fasen</strong> — högre under cut
                (1,8–2,4 g/kg) för att skydda muskelmassa, lägre under bulk (1,6–2,2 g/kg).
              </li>
            </ul>
            <div className="mt-4 rounded-2xl bg-neutral-50 border border-neutral-200 p-5">
              <div className="font-semibold text-neutral-800 mb-2">Läs mer om TDEE</div>
              <ul className="space-y-2">
                {[
                  {
                    href: '/artiklar/vad-ar-tdee',
                    label: 'Vad är TDEE? Totalt dagligt energibehov förklarat',
                  },
                  {
                    href: '/kalkylatorer/kaloriunderskott',
                    label: 'Kaloribrist Kalkylator — räkna ut rätt underskott',
                  },
                  {
                    href: '/kalkylatorer/proteinbehov',
                    label: 'Proteinbehov Kalkylator — anpassat per fas',
                  },
                ].map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <FaqBlock items={FAQ_ITEMS} />

          {/* CTA */}
          <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Räkna ut ditt TDEE gratis</h2>
            <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
              Fyll i dina uppgifter och få ditt kaloribehov direkt — ingen registrering krävs för
              att använda kalkylatorn. Spara ditt resultat och börja logga mot rätt mål.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/kalkylatorer/tdee-kalkylator"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm"
              >
                Öppna TDEE Kalkylatorn
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-primary-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                Skapa gratis konto
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
                  { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
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
                Relaterade sidor
              </h3>
              <ul className="space-y-2">
                {[
                  { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                  { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                  { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
                  { href: '/basta-kaloriappen', label: 'Bästa kaloriappen 2026' },
                  { href: '/jamfor/myfitnesspal-vs-calculeat', label: 'MyFitnessPal vs CalculEat' },
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
