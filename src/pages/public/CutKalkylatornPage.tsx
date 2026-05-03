import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle, TrendingDown } from 'lucide-react'
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

type CutMode = 'mild' | 'moderate' | 'aggressive'

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'Sedentary', label: 'Stillasittande', description: 'Kontorsjobb, liten rörelse' },
  { value: 'Lightly active', label: 'Lätt aktiv', description: 'Lätt träning 1–3 dagar/vecka' },
  { value: 'Moderately active', label: 'Måttligt aktiv', description: 'Träning 3–5 dagar/vecka' },
  { value: 'Very active', label: 'Mycket aktiv', description: 'Hård träning 6–7 dagar/vecka' },
  {
    value: 'Extremely active',
    label: 'Extremt aktiv',
    description: 'Fysiskt jobb + daglig intensiv träning',
  },
]

const PAL_MULTIPLIERS: Record<Gender, Record<ActivityLevel, number>> = {
  male: {
    Sedentary: 1.3,
    'Lightly active': 1.6,
    'Moderately active': 1.7,
    'Very active': 2.1,
    'Extremely active': 2.4,
  },
  female: {
    Sedentary: 1.3,
    'Lightly active': 1.5,
    'Moderately active': 1.6,
    'Very active': 1.9,
    'Extremely active': 2.2,
  },
}

const CUT_MODES: {
  value: CutMode
  label: string
  deficit: number
  weeklyLoss: string
  description: string
  color: string
  ring: string
}[] = [
  {
    value: 'mild',
    label: 'Mild Cut',
    deficit: 250,
    weeklyLoss: '~0,2–0,3 kg/vecka',
    description:
      'Minimal muskelrisk. Lämplig nära tävling, sista veckornas finjustering eller låg fettprocent att tappa.',
    color: 'border-blue-500 bg-blue-50',
    ring: 'border-blue-500 bg-blue-500',
  },
  {
    value: 'moderate',
    label: 'Standard Cut',
    deficit: 400,
    weeklyLoss: '~0,3–0,5 kg/vecka',
    description:
      'Den vetenskapliga standarden. Balans mellan fettförbränning och muskelbevarande. Funkar för de flesta.',
    color: 'border-primary-500 bg-primary-50',
    ring: 'border-primary-500 bg-primary-500',
  },
  {
    value: 'aggressive',
    label: 'Aggressiv Cut',
    deficit: 700,
    weeklyLoss: '~0,5–0,8 kg/vecka',
    description:
      'Lämplig vid hög fettprocent. Kräver högt proteinintag (2,2+ g/kg) och styrketräning för att skydda muskler.',
    color: 'border-orange-500 bg-orange-50',
    ring: 'border-orange-500 bg-orange-500',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Hur många kalorier ska man äta på cut?',
    answer:
      'Du ska äta under ditt TDEE (underhållsbehov). Hur mycket beror på tempo: mild cut = −200–300 kcal/dag, standard cut = −300–500 kcal/dag, aggressiv cut = −500–800 kcal/dag. Tumregel: tappa inte mer än 0,5–1% av kroppsvikten per vecka för att minimera muskelmassaförlust.',
  },
  {
    question: 'Hur snabbt ska man gå ner i vikt på cut?',
    answer:
      'Det rekommenderade tempot är 0,5–1% av kroppsvikten per vecka. För en person på 80 kg innebär det ca 0,4–0,8 kg/vecka. Snabbare än så innebär ökad risk för muskelmassaförlust och hormonstörningar. Går du upp i vikt trots kaloribrist — mäts det oftast fel eller du underskattar intaget.',
  },
  {
    question: 'Hur mycket protein behövs under cut?',
    answer:
      'Under cut rekommenderas 1,8–2,4 g protein per kg kroppsvikt — högre än under bulk. Anledningen: i kaloribrist ökar risken för muskelkatabolism. Högt proteinintag ger mättnadseffekt, hög TEF (ca 25–30% av proteinkalorierna går till matsmältning) och skyddar muskelmassa.',
  },
  {
    question: 'Hur undviker man muskelförlust under cut?',
    answer:
      'Tre saker avgör: 1) Tillräckligt proteinintag (1,8–2,4 g/kg). 2) Fortsätta styrketräna med progressiv belastning — signalen till kroppen att muskelmassa behövs. 3) Inte för aggressivt kaloriunderskott. Kombinerar du dessa tre kan du förlora nästan enbart fett.',
  },
  {
    question: 'Vad är en mini cut och när passar den?',
    answer:
      'En mini cut är en kort, intensiv cut-fas (4–8 veckor) med ett något aggressivare underskott (−500–700 kcal/dag). Den passar när du just avslutat en bulk och vill snabbt reducera fettprocenten innan nästa bulk-fas — utan att gå igenom en full, lång cut-cykel.',
  },
]

const CANONICAL = 'https://calculeat.se/kalkylatorer/cut-kalkylator'

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Cut Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis cut-kalkylator. Räkna ut hur många kalorier du ska äta för att bränna fett och bevara muskelmassa. Baserat på ditt TDEE och önskat tempo.',
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
      { '@type': 'ListItem', position: 3, name: 'Cut Kalkylator', item: CANONICAL },
    ],
  },
]

export default function CutKalkylatornPage() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Moderately active')
  const [cutMode, setCutMode] = useState<CutMode>('moderate')
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
    return Math.round(bmr * PAL_MULTIPLIERS[gender][activityLevel])
  }, [bmr, gender, activityLevel])

  const selectedMode = CUT_MODES.find(m => m.value === cutMode)!
  const targetCalories = tdee ? Math.round(tdee - selectedMode.deficit) : null

  const w = parseFloat(weight)
  const proteinMin = w > 0 ? Math.round(w * 1.8) : null
  const proteinMax = w > 0 ? Math.round(w * 2.4) : null

  const handleCalculate = () => {
    if (bmr && tdee) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Cut Kalkylator — Räkna ut kalorier för smart cut (2026)"
        description="Gratis cut-kalkylator. Räkna ut hur många kalorier du ska äta för att bränna fett och bevara muskelmassa. Baserat på ditt TDEE. Resultat direkt."
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
            <span className="text-neutral-700">Cut Kalkylator</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            Cut Kalkylator
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-8 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            En smart cut handlar inte om att äta så lite som möjligt — det handlar om att välja rätt
            underskott för att bränna fett utan att förlora muskelmassa. Räkna ut ditt optimala
            kaloriintag baserat på ditt TDEE och önskat tempo.
          </p>

          {/* Calculator card */}
          <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-primary-900">Beräkna dina cut-kalorier</span>
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
                  { label: 'Ålder', unit: 'år', value: age, setter: setAge, placeholder: '28' },
                  {
                    label: 'Vikt',
                    unit: 'kg',
                    value: weight,
                    setter: setWeight,
                    placeholder: '80',
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

              {/* Cut Mode */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cut-strategi
                </label>
                <div className="space-y-2">
                  {CUT_MODES.map(
                    ({ value, label, deficit, weeklyLoss, description, color, ring }) => (
                      <button
                        key={value}
                        onClick={() => setCutMode(value)}
                        className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                          cutMode === value
                            ? color
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                            cutMode === value ? ring : 'border-neutral-300 bg-white'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-neutral-800">
                            {label} — −{deficit} kcal/dag
                            <span className="ml-2 text-xs font-normal text-neutral-500">
                              {weeklyLoss}
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
                Beräkna mina cut-kalorier
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
                  <div className="rounded-xl bg-primary-600 p-4 text-center">
                    <div className="text-2xl font-bold text-white">{targetCalories}</div>
                    <div className="text-xs text-primary-200 mt-0.5">Cut-mål (kcal/dag)</div>
                    <div className="text-xs text-primary-300">−{selectedMode.deficit} kcal/dag</div>
                  </div>
                </div>

                {/* Plan summary */}
                <div className="rounded-xl bg-white border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium text-neutral-800">Din cut-plan</span>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-700">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Underhållskalorier (TDEE)</span>
                      <span className="font-medium">{tdee} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Dagligt underskott</span>
                      <span className="font-medium text-orange-600">
                        −{selectedMode.deficit} kcal
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                      <span className="font-medium">Dagligt kaloriintag</span>
                      <span className="font-bold text-primary-600">{targetCalories} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Förväntad viktnedgång</span>
                      <span className="font-medium">{selectedMode.weeklyLoss}</span>
                    </div>
                    {proteinMin && proteinMax && (
                      <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                        <span className="text-neutral-500">Proteinmål (muskelskydd)</span>
                        <span className="font-medium">
                          {proteinMin}–{proteinMax} g/dag
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning for aggressive */}
                {cutMode === 'aggressive' && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">Aggressiv cut</p>
                      <p className="text-xs text-amber-700">
                        Vid −700 kcal/dag ökar risken för muskelmassaförlust markant. Säkerställ
                        {proteinMax ? ` ${proteinMax}+` : ' högt'} g protein per dag och fortsätt
                        styrketräna med progressiv belastning.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cross-link to bulk */}
                <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-neutral-700">
                      Ska du bulka efter cutten?
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Planera nästa fas med bulk-kalkylatorn.
                    </p>
                  </div>
                  <Link
                    to="/kalkylatorer/bulk-kalkylator"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                  >
                    Bulk Kalkylator
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Gated CTA */}
                <div className="rounded-xl bg-white border border-primary-200 p-4">
                  <p className="text-sm font-medium text-neutral-800 mb-1">
                    Spara din cut-plan och logga mat
                  </p>
                  <p className="text-xs text-neutral-500 mb-3">
                    Skapa ett gratis konto för att spara ditt kaloriintag, följa din progress och
                    hålla koll på proteinet.
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
                    <p>✓ Beräkna cut-kalorier — alltid gratis</p>
                    <p>✓ Spara plan och logga mat — med konto</p>
                    <p>✓ Följ protein och vikt under cut — med konto</p>
                    <p className="text-neutral-400 mt-1.5 italic">
                      Fler funktioner i premiumversionen framöver.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Explanation */}
          <section className="space-y-5 text-neutral-700 text-sm leading-relaxed mb-8">
            <h2 className="text-xl font-semibold text-neutral-900">
              Vad är skillnaden på cut och kaloribrist?
            </h2>
            <p>
              Kaloribrist är ett generellt begrepp för att äta under TDEE. En cut är en aktiv fas
              med syfte att minska fettprocenten samtidigt som muskelmassa bevaras — det kräver inte
              bara rätt kaloriintag utan också rätt proteinintag och träning. En bra cut är
              metodisk, inte desperat.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Varför är protein viktigare under cut än bulk?
            </h2>
            <p>
              Under kaloribrist saknar kroppen energi och riskerar att bryta ned muskelvävnad för
              bränsle (muskelkatabolism). Högt proteinintag ger tre fördelar under cut:
            </p>
            <ul className="space-y-2 pl-4 list-disc">
              <li>
                <strong>Muskelskydd:</strong> Tillräckligt protein minimerar muskelkatabolism
              </li>
              <li>
                <strong>Mättnadseffekt:</strong> Protein är det mest mättande makronutrientet per
                kcal
              </li>
              <li>
                <strong>Hög TEF:</strong> ca 25–30% av proteinkalorierna går till att smälta
                proteinet — det hjälper kaloribalansen
              </li>
            </ul>
            <p>
              Rekommendation under cut: 1,8–2,4 g/kg kroppsvikt, jämfört med 1,6–2,2 g/kg under
              underhåll eller bulk.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Varför planar vikten ut trots kaloriunderskott?
            </h2>
            <p>
              Adaptiv termogenes: kroppen sänker sin ämnesomsättning och NEAT (oplanerad rörelse)
              som försvar mot lång kaloribrist. Det är normalt och inte ett misslyckande.
            </p>
            <p>
              Lösning: ta en <em>diet break</em> på 1–2 veckor på underhållsintag var 8–12:e vecka.
              Det återställer hormonbalansen (leptin, kortisol, sköldkörtelhormon) och gör nästa
              cut-fas effektivare.
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
                  { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
                  { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
                  { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
                  { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
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
                  { href: '/artiklar/reverse-diet', label: 'Reverse Diet — efter cutten' },
                  { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut — komplett guide' },
                  { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
                  { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
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
