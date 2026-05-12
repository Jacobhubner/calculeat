import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, TrendingUp } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { mifflinStJeor } from '@/lib/calculations/bmr'
import type { Gender } from '@/lib/types'

type ActivityLevel =
  | 'Sedentary'
  | 'Lightly active'
  | 'Moderately active'
  | 'Very active'
  | 'Extremely active'

type BulkMode = 'lean' | 'standard' | 'aggressive'

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  {
    value: 'Sedentary',
    label: 'Stillasittande',
    description: 'Kontorsjobb eller hemarbete, liten vardagsrörelse, inga träningspass',
  },
  {
    value: 'Lightly active',
    label: 'Lätt aktiv',
    description: 'Lätt träning 1–3 dagar/vecka, t.ex. promenader, yoga eller gym på fritiden',
  },
  {
    value: 'Moderately active',
    label: 'Måttligt aktiv',
    description:
      'Regelbunden träning 3–5 dagar/vecka med måttlig intensitet, t.ex. löpning eller styrketräning',
  },
  {
    value: 'Very active',
    label: 'Mycket aktiv',
    description: 'Hård träning nästan varje dag (6–7 dagar/vecka) eller fysiskt aktivt arbete',
  },
  {
    value: 'Extremely active',
    label: 'Extremt aktiv',
    description:
      'Tungt fysiskt arbete kombinerat med daglig intensiv träning, t.ex. elitidrottare eller byggnadsarbetare som dessutom tränar',
  },
]

const PAL_MULTIPLIERS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
  'Extremely active': 1.9,
}

const BULK_MODES: {
  value: BulkMode
  label: string
  surplus: number
  weeklyGain: string
  description: string
  color: string
  ring: string
}[] = [
  {
    value: 'lean',
    label: 'Lean Bulk',
    surplus: 200,
    weeklyGain: '~0,1–0,2 kg/vecka',
    description:
      'Minimalt fettupplagrande. Tar längre tid men du behåller din definition. Bäst för avancerade lyftare.',
    color: 'border-green-500 bg-green-50',
    ring: 'border-green-500 bg-green-500',
  },
  {
    value: 'standard',
    label: 'Standard Bulk',
    surplus: 350,
    weeklyGain: '~0,2–0,4 kg/vecka',
    description:
      'Den vetenskapliga standarden. Bra balans mellan muskeluppbyggnad och fettupplagrande. Funkar för de flesta.',
    color: 'border-primary-500 bg-primary-50',
    ring: 'border-primary-500 bg-primary-500',
  },
  {
    value: 'aggressive',
    label: 'Aggressiv Bulk',
    surplus: 600,
    weeklyGain: '~0,4–0,7 kg/vecka',
    description:
      'Snabbare massa men mer fett. Lämplig för nybörjare och hardgainers som kämpat med att gå upp.',
    color: 'border-orange-500 bg-orange-50',
    ring: 'border-orange-500 bg-orange-500',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Hur mycket kalorier ska man äta på bulk?',
    answer:
      'Du ska äta mer än ditt TDEE (underhållsbehov). Hur mycket beror på ditt mål: lean bulk = +150–250 kcal/dag, standard bulk = +300–500 kcal/dag, aggressiv bulk = +500+ kcal/dag. Det vanligaste misstaget är att äta för mycket och lagra onödigt fett, eller för lite och inte bygga muskler.',
  },
  {
    question: 'Vad är skillnaden mellan lean bulk och dirty bulk?',
    answer:
      'En lean bulk är ett kontrollerat kalorioverskott (+150–350 kcal/dag) som maximerar muskeltillväxt med minimalt fettupplagrande. En dirty bulk innebär att man äter utan kontroll — snabb viktuppgång men stor andel av det är fett, som sedan kräver en längre och tuffare cut. Lean bulk är alltid det bättre valet om du inte är ett hårdgainer-fall.',
  },
  {
    question: 'Hur snabbt ska man gå upp i vikt under bulk?',
    answer:
      'Nybörjare: 0,5–1% av kroppsvikten per månad. Avancerade: 0,25–0,5% per månad. Går du upp snabbare lagrar du troligtvis mer fett än muskler. Muskelproteinsyntes är begränsad — kroppen kan bara bygga en viss mängd muskler per tidsenhet oavsett hur mycket du äter.',
  },
  {
    question: 'Hur mycket protein behövs under bulk?',
    answer:
      '1,6–2,2 g protein per kg kroppsvikt per dag är det vetenskapligt stödda intervallet för muskeluppbyggnad. Under bulk är du inte i kaloribrist, men protein är fortfarande det viktigaste makronutrientet — det är byggstenen för muskler. Prioritera protein, fördela resterande kalorier på kolhydrater och fett efter preferens.',
  },
  {
    question: 'Hur länge ska man bulka?',
    answer:
      'En typisk bulk-fas pågår 3–6 månader. När du nått din önskade kroppsvikt eller fettprocenten kommit upp till 18–20% (man) / 28–30% (kvinna) är det dags att gå in i en cut-fas för att reducera fett och avslöja musklerna du byggt.',
  },
]

const CANONICAL = 'https://calculeat.se/kalkylatorer/bulk-kalkylator'

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Bulk Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis bulk-kalkylator. Räkna ut exakt hur många kalorier du behöver för lean bulk, standard bulk eller aggressiv bulk baserat på ditt TDEE.',
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
      { '@type': 'ListItem', position: 3, name: 'Bulk Kalkylator', item: CANONICAL },
    ],
  },
]

export default function BulkKalkylatornPage() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Moderately active')
  const [bulkMode, setBulkMode] = useState<BulkMode>('standard')
  const [hasResult, setHasResult] = useState(false)

  const bmr = useMemo(() => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)
    if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return null
    return mifflinStJeor({ weight: w, height: h, age: a, gender })
  }, [weight, height, age, gender])

  const tdee = useMemo(() => {
    if (!bmr) return null
    return Math.round(bmr * PAL_MULTIPLIERS[activityLevel])
  }, [bmr, gender, activityLevel])

  const selectedMode = BULK_MODES.find(m => m.value === bulkMode)!
  const targetCalories = tdee ? Math.round(tdee + selectedMode.surplus) : null
  const proteinMin = weight ? Math.round(parseFloat(weight) * 1.6) : null
  const proteinMax = weight ? Math.round(parseFloat(weight) * 2.2) : null

  const handleCalculate = () => {
    if (bmr && tdee) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Bulk Kalkylator — Räkna ut kalorier för lean bulk (2026)"
        description="Gratis bulk-kalkylator. Räkna ut hur många kalorier du behöver för lean bulk, standard bulk eller aggressiv bulk. Baserat på ditt TDEE. Resultat direkt."
        canonical={CANONICAL}
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden bg-white border-b border-neutral-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(37,189,0,0.07),transparent_60%)]" />
          <div className="relative container mx-auto px-4 pt-16 pb-14 max-w-3xl">
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
              <span className="text-neutral-700">Bulk Kalkylator</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Bulk
              </span>{' '}
              Kalkylator
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              Räkna ut exakt hur många kalorier du behöver för att bygga muskler effektivt — utan
              att lagra onödigt fett. En lean bulk på +150–250 kcal/dag ger maximal muskeltillväxt
              med minimalt fettupplagrande.
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-2xl">
            {/* Calculator card */}
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-primary-900">Beräkna dina bulk-kalorier</span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Kön</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['male', 'female'] as Gender[]).map(g => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                          gender === g
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {g === 'male' ? 'Man' : 'Kvinna'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age, Weight, Height */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Ålder', unit: 'år', value: age, setter: setAge, placeholder: '25' },
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
                      placeholder: '178',
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
                          onChange={e => setter(e.target.value)}
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

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Aktivitetsnivå
                  </label>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map(({ value, label, description }) => (
                      <button
                        key={value}
                        onClick={() => setActivityLevel(value)}
                        className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                          activityLevel === value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                            activityLevel === value
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300 bg-white'
                          }`}
                        />
                        <div>
                          <div
                            className={`text-sm font-medium ${activityLevel === value ? 'text-primary-700' : 'text-neutral-800'}`}
                          >
                            {label}
                          </div>
                          <div className="text-xs text-neutral-500">{description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bulk Mode */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bulk-strategi
                  </label>
                  <div className="space-y-2">
                    {BULK_MODES.map(
                      ({ value, label, surplus, weeklyGain, description, color, ring }) => (
                        <button
                          key={value}
                          onClick={() => setBulkMode(value)}
                          className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                            bulkMode === value
                              ? color
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div
                            className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                              bulkMode === value ? ring : 'border-neutral-300 bg-white'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium text-neutral-800">
                              {label} — +{surplus} kcal/dag
                              <span className="ml-2 text-xs font-normal text-neutral-500">
                                {weeklyGain}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">{description}</div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={!bmr || !tdee}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Beräkna mina bulk-kalorier
                </button>
              </div>

              {/* Results */}
              {hasResult && tdee && bmr && targetCalories && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">Dina resultat</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white border border-neutral-200 p-4 text-center">
                      <div className="text-2xl font-bold text-neutral-700">{tdee}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">TDEE (kcal/dag)</div>
                      <div className="text-xs text-neutral-400">Ditt underhållsbehov</div>
                    </div>
                    <div className="rounded-xl bg-green-600 p-4 text-center">
                      <div className="text-2xl font-bold text-white">{targetCalories}</div>
                      <div className="text-xs text-green-200 mt-0.5">Bulk-mål (kcal/dag)</div>
                      <div className="text-xs text-green-300">+{selectedMode.surplus} kcal/dag</div>
                    </div>
                  </div>

                  {/* Plan summary */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-neutral-800">Din bulk-plan</span>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-700">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Underhållskalorier (TDEE)</span>
                        <span className="font-medium">{tdee} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Dagligt överskott</span>
                        <span className="font-medium text-green-600">
                          +{selectedMode.surplus} kcal
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                        <span className="font-medium">Dagligt kaloriintag</span>
                        <span className="font-bold text-green-700">{targetCalories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Förväntad viktuppgång</span>
                        <span className="font-medium">{selectedMode.weeklyGain}</span>
                      </div>
                      {proteinMin && proteinMax && (
                        <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                          <span className="text-neutral-500">Proteinmål</span>
                          <span className="font-medium">
                            {proteinMin}–{proteinMax} g/dag
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cross-link to cut */}
                  <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        Planerar du en cut-fas efter bulken?
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Räkna ut dina cut-kalorier redan nu.
                      </p>
                    </div>
                    <Link
                      to="/kalkylatorer/cut-kalkylator"
                      className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                    >
                      Cut Kalkylator
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Gated CTA */}
                  <div className="rounded-xl bg-white border border-primary-200 p-4">
                    <p className="text-sm font-medium text-neutral-800 mb-1">
                      Spara din bulk-plan och logga mat
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      Skapa ett gratis konto för att spara ditt kaloriintag, följa din progress och
                      planera makron.
                    </p>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Spara din plan gratis
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-0.5">
                      <p className="font-medium text-neutral-700 mb-1">Vad ingår:</p>
                      <p>✓ Beräkna bulk-kalorier — alltid gratis</p>
                      <p>✓ Spara plan och logga mat — med konto</p>
                      <p>✓ Följ makron och vikt — med konto</p>
                      <p className="text-neutral-400 mt-1.5 italic">
                        Fler funktioner i premiumversionen framöver.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Explanation section */}
        <section className="bg-white py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-5 text-neutral-700 text-base leading-relaxed">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                Lean bulk vs dirty bulk — vad är skillnaden?
              </h2>
              <p>
                Lean bulk innebär ett kontrollerat överskott på +150–350 kcal/dag. Du bygger muskler
                med minimalt fettupplagrande och behåller din definition under hela fasen. Det tar
                längre tid men kräver en kortare (eller ingen) efterföljande cut.
              </p>
              <p>
                Dirty bulk innebär att äta utan tak — snabb viktuppgång men stor andel är fett som
                sedan kräver en lång, tuff cut-fas. Nettoresultatet är ofta sämre än en välplanerad
                lean bulk.
              </p>
              <p>
                <strong>Undantag:</strong> Hardgainers och nybörjare kan ha svårt att äta
                tillräckligt på lean bulk. I sådana fall är ett aggressivare överskott (+400–600
                kcal/dag) acceptabelt — muskeltillväxten är snabbare relativt fettupplagrandet för
                dem.
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                Hur snabbt kan man bygga muskler?
              </h2>
              <p>
                Muskelproteinsyntes är biologiskt begränsad. Forskning visar att naturliga lyftare
                kan förvänta sig:
              </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>
                  <strong>Nybörjare (0–1 år):</strong> 1–1,5 kg muskelmassa per månad vid optimal
                  kost och träning
                </li>
                <li>
                  <strong>Intermediär (1–3 år):</strong> 0,5–1 kg per månad
                </li>
                <li>
                  <strong>Avancerad (3+ år):</strong> 0,25–0,5 kg per månad
                </li>
              </ul>
              <p>
                Det innebär att du inte kan bygga mer muskler genom att äta mer — du lagrar bara mer
                fett. Härav vikten av ett kontrollerat överskott.
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                Hur länge ska man bulka?
              </h2>
              <p>
                En typisk bulk-fas pågår 3–6 månader. Avbryt och gå in i en cut-fas när
                fettprocenten stigit till 18–20% (man) eller 28–30% (kvinna), eller när du nått
                önskad kroppsvikt. Alternativt: planera in bulk/cut-cykler på 3 månader vardera.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={FAQ_ITEMS} />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-neutral-900 py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Redo att bygga muskler smart?
            </h2>
            <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
              Du har kaloriöverskottet. Logga mat mot ditt mål och följ din viktuppgång vecka för
              vecka.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Skapa gratis konto <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/kalkylatorer/cut-kalkylator"
                className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Planera din cut-fas
              </Link>
            </div>
          </div>
        </section>

        {/* Related links section */}
        <section className="bg-white py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid sm:grid-cols-2 gap-10">
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Relaterade kalkylatorer
                </h3>
                <div className="grid gap-3">
                  {[
                    { href: '/kalkylatorer/cut-kalkylator', label: 'Cut Kalkylator' },
                    { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
                    { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
                    { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
                  ].map(l => (
                    <Link
                      key={l.href}
                      to={l.href}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all"
                    >
                      <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Relaterade artiklar
                </h3>
                <div className="grid gap-3">
                  {[
                    { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut — komplett guide' },
                    { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                    { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                  ].map(l => (
                    <Link
                      key={l.href}
                      to={l.href}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all"
                    >
                      <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
