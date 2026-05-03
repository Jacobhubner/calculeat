import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
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

const FAQ_ITEMS = [
  {
    question: 'Är TDEE detsamma som kaloribehov?',
    answer:
      'Ja, i praktiken används begreppen synonymt. TDEE (Total Daily Energy Expenditure) är den totala mängden kalorier du förbränner per dag — och det är detta tal du bör matcha eller avvika från beroende på ditt mål. Vill du gå ner i vikt äter du under TDEE, vill du bygga muskler äter du över.',
  },
  {
    question: 'Hur noggrant är en TDEE-kalkylator?',
    answer:
      'En TDEE-kalkylator ger en uppskattning baserad på statistiska formler (Mifflin-St Jeor för BMR och FAO/WHO/UNU för aktivitetsfaktor). Felmarginal är typiskt ±10–15%. Individuella faktorer som muskelmassa, hormonbalans och metabolism påverkar det verkliga värdet. Använd resultatet som startpunkt och justera efter hur din vikt faktiskt förändras.',
  },
  {
    question: 'Hur stor kaloribrist ska man ha för viktnedgång?',
    answer:
      'En kaloribrist på 300–500 kcal/dag under TDEE är ett hållbart tempo och leder till ca 0,3–0,5 kg viktnedgång per vecka. En brist på mer än 1000 kcal/dag ökar risken för muskelmassaförlust och är sällan hållbar på lång sikt.',
  },
  {
    question: 'Hur förändras mitt TDEE om jag tränar mer?',
    answer:
      'När du ökar din träningsvolym stiger ditt TDEE — du förbränner fler kalorier. Kom dock ihåg att kroppen kan kompensera genom att minska oplanerad rörelse (NEAT). Praktiskt: om vikten planar ut trots träningsökning, höj inte kalorier direkt — vänta 2–3 veckor och se hur kroppen svarar.',
  },
  {
    question: 'Vad är skillnaden mellan BMR och TDEE?',
    answer:
      'BMR (Basal Metabolic Rate) är de kalorier din kropp förbränner i absolut vila — enbart för att hålla organ igång. TDEE inkluderar dessutom all fysisk aktivitet, NEAT (oplanerad rörelse) och TEF (matens termiska effekt). TDEE är alltid högre än BMR och är det relevanta talet för kaloriplanering.',
  },
]

const CANONICAL = 'https://calculeat.se/kalkylatorer/tdee-kalkylator'

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TDEE Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis TDEE-kalkylator som räknar ut ditt totala dagliga kaloribehov baserat på ålder, vikt, längd, kön och aktivitetsnivå.',
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
      { '@type': 'ListItem', position: 3, name: 'TDEE Kalkylator', item: CANONICAL },
    ],
  },
]

export default function TdeeKalkylatornPage() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Moderately active')
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

  const cutTarget = tdee ? Math.round(tdee - 400) : null
  const bulkTarget = tdee ? Math.round(tdee + 300) : null

  const handleCalculate = () => {
    if (bmr && tdee) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="TDEE Kalkylator — Räkna ut ditt kaloribehov exakt (2026)"
        description="Gratis TDEE-kalkylator. Räkna ut ditt totala dagliga kaloribehov baserat på ålder, vikt, längd och aktivitetsnivå. Resultat direkt — inget konto krävs."
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
            <span className="text-neutral-700">TDEE Kalkylator</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            TDEE Kalkylator
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-8 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            TDEE (Total Daily Energy Expenditure) är den totala mängden kalorier din kropp
            förbränner per dag. Fyll i dina uppgifter för att räkna ut ditt individuella TDEE —
            gratis, direkt och utan registrering.
          </p>

          {/* Calculator card */}
          <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-primary-900">Beräkna ditt TDEE</span>
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
                  { label: 'Ålder', unit: 'år', value: age, setter: setAge, placeholder: '30' },
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

              <button
                onClick={handleCalculate}
                disabled={!bmr || !tdee}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Beräkna mitt TDEE
              </button>
            </div>

            {/* Results */}
            {hasResult && tdee && bmr && (
              <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6">
                <h2 className="font-semibold text-neutral-800 mb-4">Dina resultat</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl bg-white border border-neutral-200 p-4 text-center">
                    <div className="text-2xl font-bold text-primary-600">{Math.round(bmr)}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">BMR (kcal/dag)</div>
                    <div className="text-xs text-neutral-400">Kalorier i absolut vila</div>
                  </div>
                  <div className="rounded-xl bg-primary-600 p-4 text-center">
                    <div className="text-2xl font-bold text-white">{tdee}</div>
                    <div className="text-xs text-primary-200 mt-0.5">TDEE (kcal/dag)</div>
                    <div className="text-xs text-primary-300">Ditt totala kaloribehov</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                    <div className="text-lg font-semibold text-blue-700">{cutTarget}</div>
                    <div className="text-xs text-blue-600">Mål för viktnedgång</div>
                    <div className="text-xs text-blue-400">−400 kcal/dag</div>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
                    <div className="text-lg font-semibold text-green-700">{bulkTarget}</div>
                    <div className="text-xs text-green-600">Mål för muskeluppbyggnad</div>
                    <div className="text-xs text-green-400">+300 kcal/dag</div>
                  </div>
                </div>

                {/* Gated CTA */}
                <div className="rounded-xl bg-white border border-primary-200 p-4">
                  <p className="text-sm font-medium text-neutral-800 mb-1">
                    Spara din plan och börja logga mat
                  </p>
                  <p className="text-xs text-neutral-500 mb-3">
                    Skapa ett gratis konto för att spara ditt TDEE, sätta mål, planera makron och
                    logga mat.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Spara din plan gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Explanation */}
          <section className="space-y-5 text-neutral-700 text-sm leading-relaxed mb-8">
            <h2 className="text-xl font-semibold text-neutral-900">Hur tolkar du ditt TDEE?</h2>
            <p>
              Ditt TDEE är ditt <strong>underhållsbehov</strong> — den mängd kalorier du behöver äta
              för att hålla din nuvarande vikt stabil. Beroende på ditt mål justerar du kring detta:
            </p>
            <ul className="space-y-2 pl-4 list-disc">
              <li>
                <strong>Viktnedgång:</strong> Ät 300–500 kcal under ditt TDEE. Det ger ca 0,3–0,5 kg
                i veckan utan att riskera muskelmassaförlust.
              </li>
              <li>
                <strong>Muskeluppbyggnad:</strong> Ät 200–400 kcal över ditt TDEE. Det ger ett litet
                överskott för muskeltillväxt med minimalt fettupplagrande.
              </li>
              <li>
                <strong>Underhåll:</strong> Matcha ditt TDEE. Bra under pausperioder eller för att
                stabilisera vikt efter en kur.
              </li>
            </ul>
            <p>
              Kom ihåg att TDEE-kalkylatorer ger en <em>uppskattning</em>. Det verkliga värdet
              varierar beroende på muskelmassa, hormonbalans och metabolism. Följ upp din vikt under
              2–3 veckor och justera kaloriintaget om du inte ser förväntat resultat.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">Vad påverkar ditt TDEE?</h2>
            <p>TDEE består av fyra komponenter:</p>
            <ul className="space-y-2 pl-4 list-disc">
              <li>
                <strong>BMR (ca 60–75%):</strong> Din basalmetabolism — kalorierna din kropp
                förbränner i vila för att hålla organ igång.
              </li>
              <li>
                <strong>EAT (ca 15–30%):</strong> Planerad träning och motion.
              </li>
              <li>
                <strong>NEAT (ca 5–15%):</strong> Oplanerad rörelse — gå, stå, fidgeta, handla. Ofta
                underskattat men kan variera med hundratals kcal.
              </li>
              <li>
                <strong>TEF (ca 10%):</strong> Matens termiska effekt — kalorierna det kostar att
                smälta maten du äter.
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <FaqBlock items={FAQ_ITEMS} />

          {/* Related */}
          <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Relaterade kalkylatorer
              </h3>
              <ul className="space-y-2">
                {[
                  { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
                  { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
                  { href: '/kalkylatorer/cut-kalkylator', label: 'Cut Kalkylator' },
                  { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
                  { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
                  { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR Kalkylator' },
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
                  { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist?' },
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
