import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'

type Goal = 'cut' | 'maintenance' | 'bulk'
type TrainingStatus = 'inactive' | 'active' | 'elite'

// Evidence-based protein ranges per (goal × training status).
// Sources: Phillips & Van Loon (2011), ISSN Position Stand (Stout et al. 2017),
// Morton et al. (2018). Each cell is a fixed interval — no additive bonus.
const PROTEIN_RANGES: Record<Goal, Record<TrainingStatus, { min: number; max: number }>> = {
  cut: {
    inactive: { min: 1.2, max: 1.6 },
    active: { min: 1.8, max: 2.4 },
    elite: { min: 2.2, max: 2.6 },
  },
  maintenance: {
    inactive: { min: 0.8, max: 1.2 },
    active: { min: 1.4, max: 1.8 },
    elite: { min: 1.6, max: 2.0 },
  },
  bulk: {
    inactive: { min: 1.2, max: 1.6 },
    active: { min: 1.6, max: 2.2 },
    elite: { min: 1.8, max: 2.4 },
  },
}

// Rationale text per (goal × training status) — shown in result card.
const RATIONALE: Record<Goal, Record<TrainingStatus, string>> = {
  cut: {
    inactive:
      'Under kaloribrist utan regelbunden träning räcker 1,2–1,6 g/kg för att bromsa muskelmassaförlust. Viktnedgången dominerar — protein är ett skydd, inte en prestationsfaktor.',
    active:
      'Under viktnedgång med regelbunden träning rekommenderar forskning 1,8–2,4 g/kg. Protein skyddar muskelmassa under kaloribrist, ger hög mättnadseffekt och har hög TEF (ca 25–30% av proteinkalorierna går åt till matsmältningen).',
    elite:
      'Elitidrottare och tung daglig träning i kombination med kaloribrist motiverar 2,2–2,6 g/kg. Den höga träningsvolymen ökar katabolisk stress och kräver ett extra skyddsnät för muskelmassa.',
  },
  maintenance: {
    inactive:
      'WHO:s minimumrekommendation på 0,8 g/kg gäller stillasittande vuxna. För de flesta är 1,0–1,2 g/kg ett rimligare mål för att stötta immunsystem, enzymer och återhämtning.',
    active:
      'För att bibehålla muskelmassa och stötta återhämtning vid regelbunden träning räcker 1,4–1,8 g/kg för de flesta. Aktiva med hög träningsvolym bör sikta på övre delen av intervallet.',
    elite:
      'Elitidrottare behöver 1,6–2,0 g/kg även under underhållsfas för att stötta återhämtning och motverka nedbrytning vid hög träningsvolym.',
  },
  bulk: {
    inactive:
      'Utan regelbunden styrketräning är muskeluppbyggnad begränsad. 1,2–1,6 g/kg räcker för att stötta en gradvis ökning av muskelmassa i kombination med kalorioverskott.',
    active:
      'Under muskeluppbyggnad med regelbunden styrketräning är 1,6–2,2 g/kg det vetenskapligt stödda optimala intervallet (Morton et al., 2018: ~1,62 g/kg är nära taket för vältränade). Mer än 2,2 g/kg ger troligtvis inga ytterligare fördelar.',
    elite:
      'Elitidrottare med hög träningsvolym och kalorioverskott kan motivera 1,8–2,4 g/kg för att maximera muskelproteinsyntes och stötta återhämtning mellan pass.',
  },
}

const GOALS: {
  value: Goal
  label: string
  description: string
  color: string
  ring: string
}[] = [
  {
    value: 'cut',
    label: 'Viktnedgång (cut)',
    description: 'Kaloribrist — skydda muskelmassa och utnyttja proteinets höga mättnadseffekt.',
    color: 'border-blue-500 bg-blue-50',
    ring: 'border-blue-500 bg-blue-500',
  },
  {
    value: 'maintenance',
    label: 'Viktstabilisering',
    description: 'Bibehåll muskelmassa och stötta allmän hälsa utan att gå upp eller ned.',
    color: 'border-neutral-500 bg-neutral-50',
    ring: 'border-neutral-500 bg-neutral-500',
  },
  {
    value: 'bulk',
    label: 'Muskeluppbyggnad (bulk)',
    description: 'Kalorioverskott + styrketräning — protein är råmaterialet för nya muskelfibrer.',
    color: 'border-green-500 bg-green-50',
    ring: 'border-green-500 bg-green-500',
  },
]

const TRAINING_STATUSES: {
  value: TrainingStatus
  label: string
  description: string
}[] = [
  {
    value: 'inactive',
    label: 'Inaktiv / sällan träning',
    description: 'Ingen regelbunden träning — vardagsrörelse som promenader räknas hit',
  },
  {
    value: 'active',
    label: 'Tränar regelbundet',
    description: 'Styrketräning eller konditionsträning 2–5 dagar/vecka',
  },
  {
    value: 'elite',
    label: 'Elitidrottare / tung daglig träning',
    description: 'Hård träning dagligen eller dubbla pass, alternativt tungt fysiskt yrke',
  },
]

const MEALS_OPTIONS = [2, 3, 4, 5, 6]

const FAQ_ITEMS = [
  {
    question: 'Hur mycket protein behöver man per dag?',
    answer:
      'Det beror primärt på ditt mål och träningsstatus — inte på generell aktivitetsnivå. WHO:s minimumrekommendation är 0,8 g/kg för stillasittande vuxna. För den som tränar regelbundet rekommenderar forskning 1,4–2,4 g/kg beroende på mål: lägre vid underhåll, högre vid viktnedgång (för att skydda muskler) och vid muskeluppbyggnad.',
  },
  {
    question: 'Är 2 gram protein per kg optimalt?',
    answer:
      '2 g/kg är en bra tumregel för aktiva som styrketränar. Forskning (Morton et al., 2018) visar att 1,62 g/kg är nära det maximalt effektiva för muskeluppbyggnad hos vältränade. Under viktnedgång kan 2,0–2,4 g/kg vara motiverat för att minimera muskelmassaförlust. Mer än 3 g/kg ger troligtvis inga ytterligare fördelar.',
  },
  {
    question: 'Behöver man mer protein vid viktnedgång?',
    answer:
      'Ja — under kaloribrist ökar kroppen sin nedbrytning av muskelvävnad som energikälla. Högt proteinintag (1,8–2,4 g/kg) motverkar detta och ger dessutom hög mättnadseffekt. Protein har också hög TEF (ca 25–30% av proteinkalorierna används till att smälta proteinet), vilket är extra fördelaktigt vid viktnedgång.',
  },
  {
    question: 'Hur mycket protein per måltid är bäst?',
    answer:
      'Forskning visar att kroppen effektivt utnyttjar ungefär 20–40 g protein per måltid för muskelproteinsyntes. Fördelat på 3–5 måltider per dag maximeras stimuleringen av muskelbyggande. Att äta 150 g protein i en enda måltid är alltså suboptimalt — sprid ut intaget jämnt.',
  },
  {
    question: 'Spelar det någon roll vilken typ av träning man gör?',
    answer:
      'Ja, träningstypen påverkar proteinbehovet mer än träningens frekvens eller hur aktiv man generellt är. Styrketräning stimulerar muskelproteinsyntes direkt och kräver mer protein än konditionsträning vid samma volym. Det är därför kalkylatorn frågar om träningsstatus snarare än hur många steg du tar om dagen.',
  },
  {
    question: 'Kan man äta för mycket protein?',
    answer:
      'För friska personer är högt proteinintag (upp till 3 g/kg/dag) säkert och ger inga negativa njureffekter. Den praktiska begränsningen är att ett extremt högt proteinintag tränger ut kolhydrater och fett, vilket kan försämra träningsprestanda och hormonbalans. Sikta på intervallet för ditt mål och prioritera varierade proteinkällor.',
  },
]

const CANONICAL = 'https://calculeat.se/kalkylatorer/proteinbehov'

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Proteinbehov Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis proteinbehov-kalkylator. Räkna ut hur mycket protein per dag du behöver baserat på vikt, träningsstatus och mål — viktnedgång, underhåll eller muskeluppbyggnad.',
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
      { '@type': 'ListItem', position: 3, name: 'Proteinbehov Kalkylator', item: CANONICAL },
    ],
  },
]

export default function ProteinbehovKalkylatornPage() {
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState<Goal>('maintenance')
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('active')
  const [mealsPerDay, setMealsPerDay] = useState(4)
  const [hasResult, setHasResult] = useState(false)

  const range = PROTEIN_RANGES[goal][trainingStatus]
  const rationale = RATIONALE[goal][trainingStatus]

  const result = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return null

    const minTotal = Math.round(w * range.min)
    const maxTotal = Math.round(w * range.max)
    const midTotal = Math.round((minTotal + maxTotal) / 2)
    const perMealMin = Math.round(minTotal / mealsPerDay)
    const perMealMax = Math.round(maxTotal / mealsPerDay)

    return {
      minTotal,
      maxTotal,
      midTotal,
      perMealMin,
      perMealMax,
      minPerKg: range.min,
      maxPerKg: range.max,
    }
  }, [weight, range, mealsPerDay])

  const handleCalculate = () => {
    if (result) setHasResult(true)
  }

  const goalColors: Record<Goal, string> = {
    cut: 'text-blue-700',
    maintenance: 'text-neutral-700',
    bulk: 'text-green-700',
  }

  const goalBg: Record<Goal, string> = {
    cut: 'bg-blue-600',
    maintenance: 'bg-neutral-700',
    bulk: 'bg-green-600',
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Proteinbehov Kalkylator — Hur mycket protein per dag behöver du? (2026)"
        description="Gratis proteinbehov-kalkylator. Räkna ut hur mycket protein per dag du behöver baserat på vikt, mål och träningsstatus. Evidensbaserade intervall — inte linjära tumregler."
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
              <span className="text-neutral-700">Proteinbehov Kalkylator</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Proteinbehov
              </span>{' '}
              Kalkylator
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              Ditt proteinbehov beror på mål och träningsstatus — inte på hur aktiv du generellt är.
              Kalkylatorn använder evidensbaserade intervall per kombination, utan linjära
              tumregelsbonusar.
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-primary-900">Beräkna ditt proteinbehov</span>
              </div>

              <div className="p-6 space-y-5">
                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Vikt</label>
                  <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 max-w-[160px]">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      onFocus={e => e.target.select()}
                      placeholder="75"
                      className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0"
                    />
                    <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5">
                      kg
                    </span>
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Mål</label>
                  <div className="space-y-2">
                    {GOALS.map(({ value, label, description, color, ring }) => (
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
                          <div className="text-sm font-medium text-neutral-800">{label}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training status */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Träningsstatus
                  </label>
                  <div className="space-y-2">
                    {TRAINING_STATUSES.map(({ value, label, description }) => (
                      <button
                        key={value}
                        onClick={() => setTrainingStatus(value)}
                        className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                          trainingStatus === value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                            trainingStatus === value
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300 bg-white'
                          }`}
                        />
                        <div>
                          <div
                            className={`text-sm font-medium ${trainingStatus === value ? 'text-primary-700' : 'text-neutral-800'}`}
                          >
                            {label}
                          </div>
                          <div className="text-xs text-neutral-500">{description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Proteinbehovet drivs av träningsstatus och mål — inte av generell aktivitetsnivå
                    som steg eller PAL-värde.
                  </p>
                </div>

                {/* Meals per day */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Antal måltider per dag
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {MEALS_OPTIONS.map(n => (
                      <button
                        key={n}
                        onClick={() => setMealsPerDay(n)}
                        className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                          mealsPerDay === n
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Används för att beräkna protein per måltid
                  </p>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={!result}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Beräkna mitt proteinbehov
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">Ditt proteinbehov</h2>

                  {/* Main result */}
                  <div className={`rounded-xl ${goalBg[goal]} p-5 text-center`}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {result.minTotal}–{result.maxTotal} g
                    </div>
                    <div className="text-sm text-white/80">protein per dag</div>
                    <div className="text-xs text-white/60 mt-1">
                      {result.minPerKg.toFixed(1)}–{result.maxPerKg.toFixed(1)} g per kg kroppsvikt
                    </div>
                  </div>

                  {/* Plan breakdown */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="text-sm font-medium text-neutral-800 mb-3">
                      Fördelning per dag
                    </div>
                    <div className="space-y-2 text-sm text-neutral-700">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Dagligt proteinintervall</span>
                        <span className="font-medium">
                          {result.minTotal}–{result.maxTotal} g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Rekommenderat mål</span>
                        <span className={`font-bold ${goalColors[goal]}`}>
                          {result.midTotal} g/dag
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                        <span className="text-neutral-500">
                          Per måltid ({mealsPerDay} måltider/dag)
                        </span>
                        <span className="font-medium">
                          {result.perMealMin}–{result.perMealMax} g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                      Varför detta intervall?
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{rationale}</p>
                  </div>

                  {/* Cross-links to relevant calculators */}
                  <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4">
                    <p className="text-xs font-medium text-neutral-700 mb-2">
                      Nästa steg — räkna ut ditt kalorisbehov
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {goal === 'cut' && (
                        <>
                          <Link
                            to="/kalkylatorer/cut-kalkylator"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cut & Deff Kalkylator
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Link
                            to="/kalkylatorer/kaloriunderskott"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                          >
                            Kaloribrist Kalkylator
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </>
                      )}
                      {goal === 'bulk' && (
                        <Link
                          to="/kalkylatorer/bulk-kalkylator"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Bulk Kalkylator
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      <Link
                        to="/kalkylatorer/tdee-kalkylator"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                      >
                        TDEE Kalkylator
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <GuestOnly>
                    {/* Gated CTA */}
                    <div className="rounded-xl bg-white border border-primary-200 p-4">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        Spara din kostplan och följ ditt proteinintag
                      </p>
                      <p className="text-xs text-neutral-500 mb-3">
                        Skapa ett gratis konto för att logga mat, följa protein per dag och spara
                        dina mål.
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
                        <p>✓ Beräkna proteinbehov — alltid gratis</p>
                        <p>✓ Spara plan och logga mat — med konto</p>
                        <p>✓ Följ proteinintag dag för dag — med konto</p>
                        <p className="text-neutral-400 mt-1.5 italic">
                          Fler funktioner i premiumversionen framöver.
                        </p>
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
            <div className="space-y-5 text-neutral-700 text-base leading-relaxed">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                Varför skiljer sig proteinbehovet beroende på mål?
              </h2>
              <p>Protein fyller olika funktioner beroende på vad din kropp är i för fas:</p>
              <ul className="space-y-3 pl-4 list-disc">
                <li>
                  <strong>Under viktnedgång (cut):</strong> Kroppen saknar kalorier och riskerar att
                  bryta ned muskelvävnad för energi. Högt proteinintag (1,8–2,4 g/kg vid regelbunden
                  träning) motverkar muskelkatabolism, ger hög mättnadseffekt och har hög termisk
                  effekt (TEF).
                </li>
                <li>
                  <strong>Under underhåll (maintenance):</strong> Du behöver protein för att
                  reparera och bevara muskelvävnad, stötta immunsystem och enzymer. 1,4–1,8 g/kg
                  räcker för de flesta aktiva.
                </li>
                <li>
                  <strong>Under muskeluppbyggnad (bulk):</strong> Protein är råmaterialet för nya
                  muskelfibrer. 1,6–2,2 g/kg är det vetenskapligt stödda optimala intervallet
                  (Morton et al., 2018). Mer ger troligtvis inga ytterligare fördelar.
                </li>
              </ul>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                Varför frågar kalkylatorn om träningsstatus och inte aktivitetsnivå?
              </h2>
              <p>
                Generell aktivitetsnivå — hur många steg du tar, PAL-värde, hur aktiv du är på
                jobbet — driver kaloribehovet (TDEE), men inte proteinbehovet i samma utsträckning.
                Proteinbehov i litteraturen är primärt kopplat till träningsstatus och träningstyp:
                styrketräning stimulerar muskelproteinsyntes direkt och kräver mer protein än en
                aktiv kontorsdag med promenader.
              </p>
              <p>
                Kalkylatorn använder därför fasta, evidensbaserade intervall per kombination av mål
                och träningsstatus — utan linjära bonussteg.
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                Hur fördela protein på dagen?
              </h2>
              <p>
                Kroppen kan effektivt utnyttja ca 20–40 g protein per måltid för
                muskelproteinsyntes. Att äta 150 g protein i en enda måltid är suboptimalt — sprid
                ut intaget jämnt över 3–5 måltider. Det ger ett kontinuerligt flöde av aminosyror
                till muskelvävnaden.
              </p>
              <p>
                <strong>Praktisk tumregel:</strong> Sikta på 30–40 g protein per måltid, 3–4 gånger
                om dagen. Det är lättare att nå och ger bättre mättnadseffekt än få, stora
                portioner.
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                De bästa proteinkällorna
              </h2>
              <p>
                Kompletta proteiner (med alla essentiella aminosyror) ger störst stimulans av
                muskelproteinsyntes:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc">
                <li>
                  <strong>Animaliska:</strong> kyckling (31 g/100 g), torsk (23 g/100 g), ägg (13
                  g/100 g), cottage cheese (11 g/100 g), quark (11 g/100 g)
                </li>
                <li>
                  <strong>Vegetabiliska:</strong> linser (9 g/100 g kokt), tofu (8 g/100 g), edamame
                  (11 g/100 g), kvarg, bönor
                </li>
                <li>
                  <strong>Komplement:</strong> Proteinpulver (whey, kasein, ärt) är ett praktiskt
                  komplement — inte en ersättning för riktig mat
                </li>
              </ul>
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
                Följ ditt proteinintag dag för dag
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                Skapa ett gratis konto och logga mat mot ditt proteinmål — automatiskt beräknat för
                ditt mål.
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
                    { href: '/kalkylatorer/cut-kalkylator', label: 'Cut & Deff Kalkylator' },
                    { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
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
                    { href: '/artiklar/reverse-diet', label: 'Reverse Diet — efter cutten' },
                    { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut — komplett guide' },
                    { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
                    { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
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
