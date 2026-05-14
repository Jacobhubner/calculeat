import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'

const CANONICAL = 'https://calculeat.se/kalkylatorer/idealvikt'

type Gender = 'male' | 'female'

// Robinson (1983) formula — most cited for healthy weight estimation
function robinsonIdealWeight(heightCm: number, gender: Gender): number {
  const inchesOver5Feet = heightCm / 2.54 - 60
  if (gender === 'male') return 52 + 1.9 * inchesOver5Feet
  return 49 + 1.7 * inchesOver5Feet
}

// Healthy weight range from BMI 18.5–24.9
function healthyWeightRange(heightCm: number): { min: number; max: number } {
  const hM = heightCm / 100
  return {
    min: Math.round(18.5 * hM * hM * 10) / 10,
    max: Math.round(24.9 * hM * hM * 10) / 10,
  }
}

type Position = 'underweight' | 'below_ideal' | 'within' | 'above_ideal' | 'overweight'

function getPosition(currentWeight: number, rangeMin: number, rangeMax: number): Position {
  if (currentWeight < rangeMin - 2) return 'underweight'
  if (currentWeight < rangeMin) return 'below_ideal'
  if (currentWeight <= rangeMax) return 'within'
  if (currentWeight <= rangeMax + 5) return 'above_ideal'
  return 'overweight'
}

const POSITION_CONFIG: Record<
  Position,
  { label: string; color: string; bg: string; desc: string }
> = {
  underweight: {
    label: 'Under hälsosamt spann',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    desc: 'Din nuvarande vikt är under det uppskattade hälsosamma viktspannet. Fokus på kalorier och protein för att nå din målvikt.',
  },
  below_ideal: {
    label: 'Strax under spannet',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50 border-cyan-200',
    desc: 'Du är nära det hälsosamma viktspannet. Lite justeringar i kalorier räcker för att nå dit.',
  },
  within: {
    label: 'Inom hälsosamt spann',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    desc: 'Din nuvarande vikt är inom det uppskattade hälsosamma viktspannet. Fokus bör nu ligga på kroppssammansättning och kaloribehov — inte vikten i sig.',
  },
  above_ideal: {
    label: 'Strax över spannet',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    desc: 'Du är något över det uppskattade spannet. En måttlig kaloribrist på 300–400 kcal/dag räcker för att gradvis nå din målvikt.',
  },
  overweight: {
    label: 'Över hälsosamt spann',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    desc: 'Din nuvarande vikt är över det uppskattade hälsosamma spannet. En välplanerad kaloribrist kombinerat med styrketräning ger bäst resultat på lång sikt.',
  },
}

const FAQ_ITEMS = [
  {
    question: 'Vad räknas som idealvikt?',
    answer:
      'Idealvikt är ett uppskattat viktspann baserat på din längd och kön, ofta beräknat via formler som Robinson (1983) eller BMI 18.5–24.9. Det är ett riktmärke, inte ett exakt mål. Faktorer som muskelmassa, ålder, benstorlek och träningsnivå påverkar vad som är hälsosamt för just dig.',
  },
  {
    question: 'Är idealvikt samma sak som BMI?',
    answer:
      'Nej — men de är relaterade. BMI (Body Mass Index) är ett tal som beräknas från vikt och längd. Idealvikt är ett viktintervall som svarar mot ett hälsosamt BMI (18.5–24.9). Skillnaden är att idealvikt-formler som Robinson justerar för längd och kön separat, medan BMI är ett rent förhållandemått.',
  },
  {
    question: 'Kan man väga mer och ändå vara hälsosam?',
    answer:
      'Ja. Muskler väger mer än fett, och en vältränad person kan väga mer än idealviktsformeln anger utan att ha ökad hälsorisk. Fettprocent, midjeomfång och metabola markörer (blodtryck, blodfetter) är bättre indikatorer på hälsorisk än vikten ensam. Idealvikt är ett riktmärke — inte en absolut gräns.',
  },
  {
    question: 'Hur mycket bör man gå ner per vecka?',
    answer:
      '0,3–0,7 kg per vecka är ett hälsosamt tempo som minimerar muskelförlust. Det kräver ett kalorimål på ca 300–700 kcal under ditt TDEE per dag. Snabbare viktnedgång ökar risken för att tappa muskelmassa och påverka ämnesomsättningen negativt.',
  },
  {
    question: 'Är idealvikt relevant om man styrketränar?',
    answer:
      'Begränsat. Styrketränande personer bygger muskelmassa som ökar vikten utan att öka fettmassa. En vältränad person kan väga 5–10 kg mer än idealviktsformeln anger och ha utmärkt hälsa. För den som tränar regelbundet är TDEE-beräkning, makroplanering och fettprocent mer relevanta mått än en idealvikts-siffra.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Idealvikt Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis idealvikt-kalkylator. Räkna ut ditt hälsosamma viktspann baserat på längd och kön. Få ditt TDEE-kaloribehov som nästa steg.',
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
      { '@type': 'ListItem', position: 3, name: 'Idealvikt Kalkylator', item: CANONICAL },
    ],
  },
]

export default function IdealviktKalkylatornPage() {
  const [gender, setGender] = useState<Gender>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const result = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!h || h < 100 || h > 250) return null

    const range = healthyWeightRange(h)
    const ideal = Math.round(robinsonIdealWeight(h, gender) * 10) / 10

    if (!w || w <= 0 || w > 400) {
      return { range, ideal, position: null, currentWeight: null }
    }

    const position = getPosition(w, range.min, range.max)
    const diff = Math.round((w - ideal) * 10) / 10

    return { range, ideal, position, currentWeight: w, diff }
  }, [height, weight, gender])

  const canCalculate = !!result

  const handleCalculate = () => {
    if (canCalculate) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Idealvikt Kalkylator — Räkna ut din hälsosamma målvikt (2026) | CalculEat"
        description="Gratis idealvikt-kalkylator. Räkna ut ditt hälsosamma viktspann baserat på längd och kön. Se var du är nu och vad som är nästa steg mot ditt mål."
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
              <Link to="/kalkylatorer" className="hover:text-neutral-700 transition-colors">
                Kalkylatorer
              </Link>
              <span>/</span>
              <span className="text-neutral-700">Idealvikt</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Idealvikt
              </span>{' '}
              Kalkylator
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              Idealvikt är ett uppskattat hälsosamt viktspann baserat på längd och kön. Det är ett
              riktmärke — inte ett exakt mål. Räkna ut ditt spann nedan och se vad som faktiskt
              driver resultaten vidare.
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-primary-900">Beräkna din idealvikt</span>
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
                          setHasResult(false)
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

                {/* Height + Weight */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: 'Längd',
                      unit: 'cm',
                      value: height,
                      setter: (v: string) => {
                        setHeight(v)
                        setHasResult(false)
                      },
                      placeholder: '175',
                      min: 100,
                      max: 250,
                    },
                    {
                      label: 'Nuvarande vikt',
                      unit: 'kg',
                      value: weight,
                      setter: (v: string) => {
                        setWeight(v)
                        setHasResult(false)
                      },
                      placeholder: '75',
                      min: 30,
                      max: 400,
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

                <button
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Beräkna min idealvikt
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">Ditt resultat</h2>

                  {/* Main range card */}
                  <div className="rounded-xl border bg-white border-neutral-200 p-5">
                    <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-3">
                      Hälsosamt viktspann (BMI 18.5–24.9)
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-neutral-900">
                        {result.range.min}–{result.range.max}
                      </span>
                      <span className="text-neutral-500 mb-1">kg</span>
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      Formel-idealvikt (Robinson):{' '}
                      <strong className="text-neutral-700">{result.ideal} kg</strong>
                    </div>
                  </div>

                  {/* Position card — only when current weight provided */}
                  {result.position && result.currentWeight && (
                    <div className={`rounded-xl border p-4 ${POSITION_CONFIG[result.position].bg}`}>
                      <div
                        className={`font-semibold mb-1 ${POSITION_CONFIG[result.position].color}`}
                      >
                        {POSITION_CONFIG[result.position].label}
                      </div>
                      <p className="text-sm text-neutral-700">
                        {POSITION_CONFIG[result.position].desc}
                      </p>
                      {result.diff !== null && result.diff !== 0 && (
                        <div className="mt-2 text-sm font-medium text-neutral-600">
                          {result.diff > 0
                            ? `${result.diff} kg över formelvärdet`
                            : `${Math.abs(result.diff)} kg under formelvärdet`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key insight box */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        Idealvikt är inte detsamma som rätt kaloriplan
                      </p>
                      <p className="text-xs text-amber-700">
                        Att veta din idealvikt säger dig inte hur du når den. Ditt TDEE — totalt
                        dagligt kaloribehov — är nyckeln. Det avgör hur mycket du ska äta för att gå
                        ner, hålla vikten eller bygga muskler.
                      </p>
                    </div>
                  </div>

                  <GuestOnly>
                    {/* CTA to money page */}
                    <div className="rounded-xl bg-white border border-primary-200 p-4">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        Nästa steg: räkna ut ditt kaloribehov
                      </p>
                      <p className="text-xs text-neutral-500 mb-3">
                        TDEE-kalkylatorn tar din idealvikt och aktivitetsnivå och ger dig ett exakt
                        kalorimål att logga mot.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          to="/kalkylatorer"
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
                  </GuestOnly>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Explanation section */}
        <section className="bg-white py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-4 text-neutral-700 text-base leading-relaxed">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                Idealvikt är ett riktmärke — inte en kaloriplan
              </h2>
              <p>
                Idealvikt säger dig ett slutmål på vågen. Det säger dig inte hur du tar dig dit, hur
                snabbt det är rimligt, eller vad du ska äta för att hålla dig där. Det är tre helt
                olika frågor.
              </p>
              <p>
                De flesta som fokuserar enbart på en målvikt missar den viktigaste variabeln: deras
                faktiska kaloribehov (TDEE). Utan det loggat mot ett korrekt mål rör sig kroppen
                inte i rätt riktning — oavsett hur rätt idealvikten är.
              </p>

              <h3 className="text-lg font-semibold text-neutral-800 mt-4">
                Vad idealvikt inte tar hänsyn till
              </h3>
              <ul className="space-y-1.5 pl-4 list-disc">
                <li>
                  <strong>Muskelmassa</strong> — en vältränad person kan väga 5–10 kg mer än
                  idealviktsformeln och ha utmärkt hälsa
                </li>
                <li>
                  <strong>Fettprocent</strong> — samma vikt kan innebära 15% eller 30% kroppsfett
                  beroende på träningsnivå
                </li>
                <li>
                  <strong>Aktivitetsnivå</strong> — kaloribehov varierar kraftigt med träning, och
                  formeln justerar inte för det
                </li>
                <li>
                  <strong>Metabolism</strong> — adaptiv termogenes vid lång kaloribrist gör att en
                  statisk idealviktssiffra inte hjälper dig att planera en realistisk tidslinje
                </li>
              </ul>

              <div className="rounded-xl bg-primary-50 border border-primary-200 p-5 mt-4">
                <div className="font-semibold text-neutral-800 mb-2">
                  Hur du faktiskt når din målvikt
                </div>
                <ol className="space-y-1.5 pl-4 list-decimal text-base text-neutral-700">
                  <li>Räkna ut ditt TDEE (totalt kaloribehov per dag)</li>
                  <li>Sätt ett kalorimål med lagom underskott — 300–500 kcal/dag</li>
                  <li>Ät 1,6–2,2 g protein per kg kroppsvikt för att skydda muskelmassa</li>
                  <li>Justera kalorimålet var 2–3 vecka baserat på faktisk vikttrend</li>
                </ol>
                <Link
                  to="/kalkylatorer"
                  className="inline-flex items-center gap-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  Starta med TDEE-kalkylatorn
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
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
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Från idealvikt till handlingsplan
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                Du vet målvikten. Nästa steg är att räkna ut ditt kalorimål och börja logga mot det.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Skapa gratis konto <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/kalkylatorer"
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Räkna ut ditt TDEE
                </Link>
              </div>
            </div>
          </section>
        </GuestOnly>

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
                    { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
                    { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
                    { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
                    { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
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
                    { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                    { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
                    { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
                    { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut' },
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
