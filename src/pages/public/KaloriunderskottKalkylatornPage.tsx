import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle } from 'lucide-react'
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

type Goal = 'mild' | 'moderate' | 'aggressive'

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

const GOALS: {
  value: Goal
  label: string
  deficit: number
  weeklyLoss: string
  description: string
  color: string
  ring: string
}[] = [
  {
    value: 'mild',
    label: 'Mild',
    deficit: 250,
    weeklyLoss: '~0,2–0,3 kg/vecka',
    description: 'Lämplig nybörjare, nära tävling eller lite fett att tappa. Minimal muskelrisk.',
    color: 'border-green-500 bg-green-50',
    ring: 'border-green-500 bg-green-500',
  },
  {
    value: 'moderate',
    label: 'Måttlig',
    deficit: 400,
    weeklyLoss: '~0,3–0,5 kg/vecka',
    description:
      'Den vetenskapliga standarden. Balans mellan tempo och muskelbevarande. Funkar för de flesta.',
    color: 'border-primary-500 bg-primary-50',
    ring: 'border-primary-500 bg-primary-500',
  },
  {
    value: 'aggressive',
    label: 'Aggressiv',
    deficit: 700,
    weeklyLoss: '~0,5–0,8 kg/vecka',
    description: 'Acceptabelt vid hög fettprocent. Kräver högt proteinintag och styrketräning.',
    color: 'border-orange-500 bg-orange-50',
    ring: 'border-orange-500 bg-orange-500',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Hur stor kaloribrist ger 1 kg viktnedgång per vecka?',
    answer:
      '1 kg kroppsfett innehåller ca 7 700 kcal. För att tappa 1 kg/vecka behövs ett underskott på ca 1 100 kcal/dag — vilket är aggressivt och innebär hög risk för muskelmassaförlust. 0,5 kg/vecka (ca 550 kcal/dag underskott) är ett mer hållbart tempo för de flesta.',
  },
  {
    question: 'Vad är skillnaden mellan kaloribrist och kaloriunderskott?',
    answer:
      'Begreppen används synonymt på svenska. Kaloribrist och kaloriunderskott betyder att du äter färre kalorier än du förbränner (under ditt TDEE), vilket tvingar kroppen att använda lagrad energi — i första hand fett, men även viss muskelmassa om bristen är för stor.',
  },
  {
    question: 'Kan man äta för lite och ändå inte gå ner i vikt?',
    answer:
      'Ja — adaptiv termogenes kan bromsa viktnedgången vid lång kaloribrist. Kroppen sänker sin NEAT (oplanerad rörelse) och BMR sjunker något som försvar mot svält. Lösning: ta en diet break på 1–2 veckor på underhållsintag (ditt TDEE) för att återställa ämnesomsättningen.',
  },
  {
    question: 'Hur mycket protein behöver man under kaloribrist?',
    answer:
      '1,6–2,2 g protein per kg kroppsvikt per dag rekommenderas för att bevara muskelmassa under kaloribrist. Vid aggressivare underskott eller intensiv träning, sikta på övre delen av intervallet (2,0–2,2 g/kg). Protein ger också hög mättnadseffekt.',
  },
  {
    question: 'Är det farligt med kaloribrist?',
    answer:
      'En måttlig kaloribrist (300–500 kcal/dag) är inte farlig för friska vuxna. En mycket stor brist (>1000 kcal/dag) ökar risken för muskelmassaförlust, näringsbrist, trötthet och hormonella störningar. Rådfråga sjukvård vid extrem restriktion eller om du har underliggande sjukdomar.',
  },
]

const CANONICAL = 'https://calculeat.se/kalkylatorer/kaloriunderskott'

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Kaloribrist Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis kaloribrist-kalkylator. Räkna ut ditt TDEE och ditt optimala kaloriintag för viktnedgång baserat på hur snabbt du vill gå ner.',
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
      { '@type': 'ListItem', position: 3, name: 'Kaloribrist Kalkylator', item: CANONICAL },
    ],
  },
]

export default function KaloriunderskottKalkylatornPage() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Moderately active')
  const [goal, setGoal] = useState<Goal>('moderate')
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

  const selectedGoal = GOALS.find(g => g.value === goal)!
  const targetCalories = tdee ? Math.round(tdee - selectedGoal.deficit) : null
  const proteinMin = weight ? Math.round(parseFloat(weight) * 1.6) : null
  const proteinMax = weight ? Math.round(parseFloat(weight) * 2.2) : null

  const handleCalculate = () => {
    if (bmr && tdee) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title="Kaloribrist Kalkylator — Räkna ut ditt kaloriunderskott (2026)"
        description="Gratis kaloribrist-kalkylator. Räkna ut ditt TDEE och exakt hur många kalorier du ska äta för att gå ner i vikt i ditt önskade tempo. Resultat direkt."
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
              <span className="text-neutral-700">Kaloribrist Kalkylator</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Kaloribrist
              </span>{' '}
              Kalkylator
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              Räkna ut ditt TDEE och ditt optimala dagliga kaloriintag för viktnedgång — baserat på
              ditt valda tempo. En kaloribrist på 300–500 kcal/dag är det vetenskapligt
              rekommenderade intervallet för att tappa fett utan att förlora muskelmassa.
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
                <span className="font-semibold text-primary-900">
                  Beräkna ditt kaloriunderskott
                </span>
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

                {/* Goal / Tempo */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Önskat tempo
                  </label>
                  <div className="space-y-2">
                    {GOALS.map(
                      ({ value, label, deficit, weeklyLoss, description, color, ring }) => (
                        <button
                          key={value}
                          onClick={() => setGoal(value)}
                          className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                            goal === value
                              ? color
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div
                            className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                              goal === value ? ring : 'border-neutral-300 bg-white'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium text-neutral-800">
                              {label} — {deficit} kcal/dag underskott
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
                  Beräkna mitt kaloriunderskott
                </button>
              </div>

              {/* Results */}
              {hasResult && tdee && bmr && targetCalories && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">Dina resultat</h2>

                  {/* TDEE + target */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white border border-neutral-200 p-4 text-center">
                      <div className="text-2xl font-bold text-neutral-700">{tdee}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">TDEE (kcal/dag)</div>
                      <div className="text-xs text-neutral-400">Ditt underhållsbehov</div>
                    </div>
                    <div className="rounded-xl bg-primary-600 p-4 text-center">
                      <div className="text-2xl font-bold text-white">{targetCalories}</div>
                      <div className="text-xs text-primary-200 mt-0.5">Mål (kcal/dag)</div>
                      <div className="text-xs text-primary-300">
                        −{selectedGoal.deficit} kcal/dag
                      </div>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="text-sm font-medium text-neutral-800 mb-3">Din plan</div>
                    <div className="space-y-2 text-sm text-neutral-700">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Underhållskalorier (TDEE)</span>
                        <span className="font-medium">{tdee} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Dagligt underskott</span>
                        <span className="font-medium text-orange-600">
                          −{selectedGoal.deficit} kcal
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                        <span className="font-medium">Dagligt kaloriintag</span>
                        <span className="font-bold text-primary-600">{targetCalories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Förväntat tempo</span>
                        <span className="font-medium">{selectedGoal.weeklyLoss}</span>
                      </div>
                      {proteinMin && proteinMax && (
                        <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                          <span className="text-neutral-500">
                            Proteinmål (för att bevara muskler)
                          </span>
                          <span className="font-medium">
                            {proteinMin}–{proteinMax} g/dag
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning for aggressive */}
                  {goal === 'aggressive' && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          Aggressivt underskott
                        </p>
                        <p className="text-xs text-amber-700">
                          Vid 700 kcal/dag underskott ökar risken för muskelmassaförlust markant. Se
                          till att äta {proteinMax}+ g protein per dag och styrketräna regelbundet.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gated CTA */}
                  <div className="rounded-xl bg-white border border-primary-200 p-4">
                    <p className="text-sm font-medium text-neutral-800 mb-1">
                      Spara din plan och logga mot ditt mål
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      Skapa ett gratis konto för att spara ditt kaloriintag, sätta mål och följa din
                      progress dag för dag.
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
                      <p>✓ Beräkna kaloriunderskott — alltid gratis</p>
                      <p>✓ Spara plan och logga mat — med konto</p>
                      <p>✓ Följ progress dag för dag — med konto</p>
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
                Hur stort kaloriunderskott är optimalt?
              </h2>
              <p>
                Det optimala underskottet beror på hur mycket fett du har att tappa och hur snabbt
                du vill nå målet. Generella riktlinjer:
              </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>
                  <strong>200–300 kcal/dag (mild):</strong> Lämplig om du är nära målvikt, ny på
                  viktnedgång eller vill minimera muskelförlust. Långsamt men hållbart.
                </li>
                <li>
                  <strong>300–500 kcal/dag (måttlig):</strong> Den vetenskapliga standarden. Ger
                  0,3–0,5 kg/vecka — tillräckligt snabbt för att se resultat utan att kompromissa
                  med muskelmassa.
                </li>
                <li>
                  <strong>500–1000 kcal/dag (aggressiv):</strong> Acceptabelt vid hög fettprocent.
                  Kräver högt proteinintag (2,0–2,2 g/kg) och styrketräning för att skydda muskler.
                </li>
              </ul>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                Varför planar vikten ut?
              </h2>
              <p>
                Vid lång kaloribrist sänker kroppen sin ämnesomsättning som försvar — adaptiv
                termogenes. NEAT (oplanerad rörelse) minskar instinktivt och BMR sjunker något.
              </p>
              <p>
                <strong>Lösning:</strong> Ta en <em>diet break</em> på 1–2 veckor på underhållsintag
                (ditt TDEE) var 8–12:e vecka. Det återställer hormonbalansen och gör nästa dietfas
                effektivare. Det är inte ett misslyckande — det är strategi.
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                Proteinets roll
              </h2>
              <p>
                Det viktigaste du kan göra för att bevara muskelmassa under kaloribrist är
                tillräckligt proteinintag. Forskning stöder 1,6–2,2 g protein per kg kroppsvikt.
                Protein har dessutom hög mättnadseffekt och hög TEF (ca 25–30% av proteinkalorierna
                används till att smälta proteinet) — vilket gör det extra värdefullt under en kur.
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
              Redo att nå ditt viktnedgångsmål?
            </h2>
            <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
              Du har kalorimålet. Nästa steg är att logga mat mot det och se hur kroppen svarar.
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
                Räkna ut dina cut-kalorier
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
                <ul className="space-y-2">
                  {[
                    { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
                    { href: '/kalkylatorer/cut-kalkylator', label: 'Cut Kalkylator' },
                    { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
                  ].map(l => (
                    <li key={l.href}>
                      <Link
                        to={l.href}
                        className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all"
                      >
                        <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
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
                    { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
                    { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                    { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                  ].map(l => (
                    <li key={l.href}>
                      <Link
                        to={l.href}
                        className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all"
                      >
                        <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
