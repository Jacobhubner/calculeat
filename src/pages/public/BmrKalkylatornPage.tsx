import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { mifflinStJeor, revisedHarrisBenedict } from '@/lib/calculations/bmr'

const CANONICAL = 'https://calculeat.se/kalkylatorer/bmr-kalkylator'

type Gender = 'male' | 'female'

const PAL_LEVELS = [
  { label: 'Stillasittande', description: 'Kontorsarbete, lite rörelse', multiplier: 1.2 },
  { label: 'Lätt aktiv', description: '1–3 träningspass/vecka', multiplier: 1.375 },
  { label: 'Måttligt aktiv', description: '3–5 träningspass/vecka', multiplier: 1.55 },
  { label: 'Mycket aktiv', description: '6–7 pass/vecka, fysiskt arbete', multiplier: 1.725 },
] as const

const FAQ_ITEMS = [
  {
    question: 'Vad är skillnaden mellan BMR och TDEE?',
    answer:
      'BMR (Basal Metabolic Rate) är antalet kalorier din kropp förbrukar i fullständig vila — utan rörelser, matsmältning eller aktivitet. TDEE (Total Daily Energy Expenditure) är ditt faktiska totala kaloribehov per dag, inklusive all aktivitet. TDEE = BMR × aktivitetsmultiplikator. TDEE är siffran du ska använda när du planerar kalorier.',
  },
  {
    question: 'Är BMR samma sak som kaloribehov?',
    answer:
      'Nej. BMR är bara grunden — din viloförbränning. De flesta vuxna har ett TDEE som är 20–80% högre än BMR beroende på aktivitetsnivå. Att äta på sin BMR utan att ta hänsyn till aktivitet innebär i praktiken ett kraftigt underskott, vilket kan leda till muskelförlust och metabolisk nedreglering.',
  },
  {
    question: 'Är det farligt att äta under sin BMR?',
    answer:
      'Att konsekvent äta under sin BMR är inte rekommenderat för de flesta. Det riskerar att utlösa adaptiv termogenes (kroppen sänker ämnesomsättningen), öka muskelförlust och orsaka nutritionsbrist. Under medicinsk övervakning kan det i vissa fall vara motiverat, men generellt bör kalorimålet ligga under TDEE — inte under BMR.',
  },
  {
    question: 'Hur förändras BMR med ålder?',
    answer:
      'BMR sjunker typiskt 1–2% per decennium efter 20-årsåldern. Det beror primärt på minskad muskelmassa (sarkopeni) snarare än ålder i sig. Styrketräning och tillräckligt proteinintag kan bromsa denna minskning avsevärt. Det är därför TDEE minskar med ålder hos inaktiva men kan hållas stabilt hos träningsaktiva.',
  },
  {
    question: 'Vilken BMR-formel är mest exakt?',
    answer:
      'Mifflin-St Jeor (1990) anses vara den mest exakta formeln för den allmänna befolkningen med normal fettprocent, med en genomsnittlig avvikelse på ca ±10%. För personer med ovanlig kroppssammansättning (mycket låg eller hög fettprocent) ger formler som Cunningham (baserad på LBM) bättre precision. Den enda formeln som ger ett "kalibrerat" resultat är att mäta verklig vikttrend mot kaloriintag under 2–3 veckor.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'BMR Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis BMR-kalkylator. Räkna ut din basalmetabolism (Mifflin-St Jeor) och se ett TDEE-estimat per aktivitetsnivå.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'CalculEat', item: 'https://calculeat.se/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Kalkylatorer',
        item: 'https://calculeat.se/kalkylatorer',
      },
      { '@type': 'ListItem', position: 3, name: 'BMR Kalkylator', item: CANONICAL },
    ],
  },
]

export default function BmrKalkylatornPage() {
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const resetResult = () => setHasResult(false)

  const result = useMemo(() => {
    const a = parseFloat(age)
    const w = parseFloat(weight)
    const h = parseFloat(height)
    if (!a || !w || !h || a < 10 || a > 120 || w <= 0 || h < 100 || h > 250) return null

    const params = { age: a, weight: w, height: h, gender }
    const bmrMifflin = mifflinStJeor(params)
    const bmrHarris = revisedHarrisBenedict(params)
    if (!bmrMifflin) return null

    const tdeeEstimates = PAL_LEVELS.map(level => ({
      ...level,
      tdee: Math.round(bmrMifflin * level.multiplier),
    }))

    return {
      bmr: Math.round(bmrMifflin),
      bmrHarris: bmrHarris ? Math.round(bmrHarris) : null,
      tdeeEstimates,
    }
  }, [age, weight, height, gender])

  const handleCalculate = () => {
    if (result) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="BMR Kalkylator — Räkna ut din basalmetabolism (2026) | CalculEat"
        description="Gratis BMR-kalkylator (Mifflin-St Jeor). Räkna ut din basalmetabolism och se ditt uppskattade TDEE per aktivitetsnivå. Inget konto krävs."
        canonical={CANONICAL}
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
            <Link
              to="/kalkylatorer/tdee-kalkylator"
              className="hover:text-neutral-700 transition-colors"
            >
              Kalkylatorer
            </Link>
            <span>/</span>
            <span className="text-neutral-700">BMR Kalkylator</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            BMR Kalkylator — Räkna ut din basalmetabolism
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-8 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            BMR är mängden kalorier din kropp förbrukar i fullständig vila för att hålla igång
            grundläggande funktioner. Det är din energibas — men <strong>inte</strong> ditt fulla
            kaloribehov.
          </p>

          {/* Calculator */}
          <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-primary-900">Beräkna din BMR</span>
              <span className="ml-auto text-xs text-neutral-400">Mifflin-St Jeor</span>
            </div>

            <div className="p-6 space-y-5">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Kön</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'male', label: 'Man' },
                      { value: 'female', label: 'Kvinna' },
                    ] as { value: Gender; label: string }[]
                  ).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setGender(opt.value)
                        resetResult()
                      }}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        gender === opt.value
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Ålder</label>
                <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 max-w-40">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={e => {
                      setAge(e.target.value)
                      resetResult()
                    }}
                    onFocus={e => e.target.select()}
                    placeholder="30"
                    className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0"
                  />
                  <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5">
                    år
                  </span>
                </div>
              </div>

              {/* Weight + Height */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Vikt',
                    unit: 'kg',
                    value: weight,
                    setter: setWeight,
                    placeholder: '75',
                  },
                  {
                    label: 'Längd',
                    unit: 'cm',
                    value: height,
                    setter: setHeight,
                    placeholder: '175',
                  },
                ].map(({ label, unit, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {label}
                    </label>
                    <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={value}
                        onChange={e => {
                          setter(e.target.value)
                          resetResult()
                        }}
                        onFocus={e => e.target.select()}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0"
                      />
                      <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5">
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCalculate}
                disabled={!result}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Beräkna min BMR
              </button>
            </div>

            {/* Results */}
            {hasResult && result && (
              <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                <h2 className="font-semibold text-neutral-800">Ditt resultat</h2>

                {/* BMR card */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    Din BMR (Mifflin-St Jeor)
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-primary-600">{result.bmr}</span>
                    <span className="text-neutral-500 mb-1">kcal/dag</span>
                  </div>
                  {result.bmrHarris && (
                    <div className="text-xs text-neutral-400 mt-1">
                      Harris-Benedict: {result.bmrHarris} kcal/dag
                    </div>
                  )}
                </div>

                {/* Key warning */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Ät inte på din BMR</p>
                    <p className="text-xs text-amber-700">
                      BMR är din viloförbränning — du förbrukar mer än detta redan genom att stå, gå
                      och äta. Ditt faktiska kaloribehov (TDEE) är 20–80% högre beroende på
                      aktivitetsnivå.
                    </p>
                  </div>
                </div>

                {/* TDEE preview */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">
                    Uppskattat TDEE per aktivitetsnivå
                  </h3>
                  <div className="rounded-xl border border-neutral-200 overflow-hidden">
                    {result.tdeeEstimates.map((level, i) => (
                      <div
                        key={level.label}
                        className={`flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0 ${
                          i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-neutral-800">{level.label}</div>
                          <div className="text-xs text-neutral-400">{level.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-neutral-900">
                            {level.tdee.toLocaleString('sv-SE')} kcal
                          </div>
                          <div className="text-xs text-neutral-400">× {level.multiplier}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    TDEE = BMR × aktivitetsmultiplikator (PAL). Dessa är uppskattningar — räkna ut
                    ditt exakta TDEE med kalkylatorn nedan.
                  </p>
                </div>

                {/* CTA to TDEE */}
                <div className="rounded-xl bg-white border border-primary-200 p-4">
                  <p className="text-sm font-medium text-neutral-800 mb-1">
                    Räkna ut ditt exakta TDEE och sätt ett kalorimål
                  </p>
                  <p className="text-xs text-neutral-500 mb-3">
                    TDEE-kalkylatorn tar samma uppgifter och ger dig ett handlingsbart kalorimål för
                    viktnedgång, maintenance eller bulk — inte bara ett referensvärde.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      to="/kalkylatorer/tdee-kalkylator"
                      className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Räkna ut ditt TDEE
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Skapa gratis konto
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BMR vs TDEE section — strong conversion block */}
          <section className="space-y-4 text-neutral-700 text-sm leading-relaxed mb-8">
            <h2 className="text-xl font-semibold text-neutral-900">
              BMR vs TDEE — vad du ska använda
            </h2>
            <p>
              BMR är ett mått på din viloförbränning — kroppen i fullständig inaktivitet. Det är ett
              teoretiskt baslinjevärde, inte ett kalorimål.
            </p>
            <p>
              <strong>TDEE är siffran du faktiskt ska använda.</strong> Oavsett om du vill gå ner i
              vikt, hålla vikten eller bygga muskler — alla beslut om kalorimål ska utgå från TDEE,
              inte BMR.
            </p>

            <div className="rounded-2xl bg-primary-50 border border-primary-200 p-5">
              <div className="font-semibold text-neutral-800 mb-3">
                Varför du inte kan använda BMR som kalorimål
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: 'Du förbränner mer än BMR redan vid vila',
                    desc: 'NEAT (icke-träningsaktivitet — att stå, gå, gestikulera) lägger till 15–50% ovanpå BMR för de flesta. Din kropp är aldrig i fullständig BMR-vila under en normal dag.',
                  },
                  {
                    title: 'Termisk effekt av mat (TEF)',
                    desc: 'Matsmältning förbrukar 8–15% av din kalorikonsumtion. Protein har TEF 25–30%. Det räknas inte in i BMR.',
                  },
                  {
                    title: 'Träning adderas ovanpå',
                    desc: 'En träningssession om 60 minuter kan förbruka 300–600 kcal — allt utöver BMR. Det enda sättet att inkludera detta är via TDEE-multiplikatorn.',
                  },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                    <div>
                      <div className="font-medium text-neutral-800 mb-0.5">{title}</div>
                      <div className="text-neutral-600">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/kalkylatorer/tdee-kalkylator"
                className="inline-flex items-center gap-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                Räkna ut ditt TDEE istället
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2">
              Hur BMR beräknas — formlerna
            </h2>
            <p>
              CalculEat använder <strong>Mifflin-St Jeor (1990)</strong> som primär formel — den
              mest validerade för den allmänna befolkningen med normal till medelhög fettprocent.
            </p>
            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Formel
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Styrka
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Bäst för
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'Mifflin-St Jeor (1990)',
                      strength: 'Mest validerad generellt',
                      best: 'Normal population, ±10%',
                    },
                    {
                      name: 'Harris-Benedict (reviderad)',
                      strength: 'Lång historik, bred användning',
                      best: 'Generell population',
                    },
                    {
                      name: 'Cunningham',
                      strength: 'Kräver fettprocent (LBM-baserad)',
                      best: 'Atleter, låg fettprocent',
                    },
                    {
                      name: 'Oxford/Henry',
                      strength: 'WHO-rekommenderad, åldersanpassad',
                      best: 'Äldre, barn',
                    },
                  ].map((row, i) => (
                    <tr
                      key={row.name}
                      className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
                    >
                      <td className="px-4 py-2.5 font-medium text-neutral-800">{row.name}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{row.strength}</td>
                      <td className="px-4 py-2.5 text-neutral-500">{row.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400">
              Ingen formel är exakt. Alla formler ger ett populationsbaserat estimat — kalibrering
              mot faktisk vikttrend är den enda metoden som ger ett individuellt exakt resultat.
            </p>
          </section>

          <FaqBlock items={FAQ_ITEMS} />

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
                  { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
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
                  { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                  { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                  { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
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
