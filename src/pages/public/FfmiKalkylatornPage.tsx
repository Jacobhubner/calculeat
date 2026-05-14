import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'

const CANONICAL = 'https://calculeat.se/kalkylatorer/ffmi-kalkylator'

type Gender = 'male' | 'female'

// FFMI = LBM (kg) / height² (m²)
// Normalized FFMI adjusts to a 1.8m baseline: FFMI + 6.1 × (1.8 - height)
function calcFfmi(
  weightKg: number,
  heightCm: number,
  bodyFatPct: number
): { lbm: number; ffmi: number; normalizedFfmi: number } {
  const heightM = heightCm / 100
  const lbm = weightKg * (1 - bodyFatPct / 100)
  const ffmi = lbm / (heightM * heightM)
  const normalizedFfmi = ffmi + 6.1 * (1.8 - heightM)
  return {
    lbm: Math.round(lbm * 10) / 10,
    ffmi: Math.round(ffmi * 10) / 10,
    normalizedFfmi: Math.round(normalizedFfmi * 10) / 10,
  }
}

interface FfmiCategory {
  label: string
  description: string
  color: string
  bg: string
  context: string
}

// Each row: ffmiMin (inclusive), ffmiMax (exclusive, null = no upper bound),
// bfMin/bfMax: body fat % range (null = any).
// Rows are matched top-to-bottom; first match wins.
const FFMI_MATRIX: {
  gender: Gender
  ffmiMin: number
  ffmiMax: number | null
  bfMin: number | null
  bfMax: number | null
  label: string
  description: string
  color: string
  bg: string
  context: string
}[] = [
  // ── MÄN ──
  {
    gender: 'male',
    ffmiMin: 0,
    ffmiMax: 17,
    bfMin: null,
    bfMax: null,
    label: 'Mycket låg',
    description: 'Kraftigt begränsad muskelmassa, möjlig undernäring eller sarkopeni.',
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
    context:
      'FFMI under 17 indikerar mycket låg mager kroppsmassa relativt längd. Kontakta läkare om detta är oväntat.',
  },
  {
    gender: 'male',
    ffmiMin: 17,
    ffmiMax: 18,
    bfMin: 10,
    bfMax: 18,
    label: 'Smal/Otränad',
    description: 'Under genomsnittlig muskelmassa, stillasittande livsstil, "smal" kroppsbyggnad.',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    context:
      'Typisk för den som inte styrketränat. Stor potential för muskeluppbyggnad med rätt träning och proteinintag.',
  },
  {
    gender: 'male',
    ffmiMin: 18,
    ffmiMax: 20,
    bfMin: 20,
    bfMax: 27,
    label: 'Genomsnittsbefolkning',
    description: 'Normal muskelmassa för otränade män, hälsosam grundnivå.',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
    context:
      'Genomsnittlig muskelmassa för en inaktiv man. Regelbunden träning och högt proteinintag kan förbättra FFMI markant.',
  },
  {
    gender: 'male',
    ffmiMin: 19,
    ffmiMax: 21,
    bfMin: 25,
    bfMax: 40,
    label: 'Överviktig/Fetma',
    description:
      'Genomsnittlig muskelmassa men hög kroppsfettsnivå, "kraftig" eller "bred" kroppsbyggnad.',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    context:
      'Muskelmassan är normal men fettprocenten är hög. Fokus på kaloribrist och bibehållen träning kan förbättra kroppssammansättningen.',
  },
  {
    gender: 'male',
    ffmiMin: 20,
    ffmiMax: 22,
    bfMin: 10,
    bfMax: 18,
    label: 'Atlet/Mellanliggande',
    description: 'Över genomsnittlig muskelmassa, 2–3 års träning, ser tydligt tränad ut.',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    context:
      'Tydligt synlig muskelmassa. Vidare progress kräver mer strukturerad kost och periodisering.',
  },
  {
    gender: 'male',
    ffmiMin: 22,
    ffmiMax: 24,
    bfMin: 6,
    bfMax: 12,
    label: 'Avancerad naturlig',
    description: 'Mycket välutvecklad fysik, 4–7 års träning, tävlingsliknande form.',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    context:
      'Att nå detta naturligt kräver flerårig dedikation, precis kost och bra genetik. Du befinner dig i ett sällsynt segment.',
  },
  {
    gender: 'male',
    ffmiMin: 24,
    ffmiMax: 25,
    bfMin: 8,
    bfMax: 20,
    label: 'Elit naturlig/Misstänkt',
    description: 'Nära genetiskt tak, 8+ års träning eller möjlig prestationshöjande användning.',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    context:
      'Vid denna nivå är genetisk outlier-status eller substansanvändning båda möjliga förklaringar. Sällsynt att nå naturligt.',
  },
  {
    gender: 'male',
    ffmiMin: 25,
    ffmiMax: 27,
    bfMin: null,
    bfMax: null,
    label: 'Troligen dopad',
    description:
      'Över typiska naturliga gränser, genetisk extremvariant eller sannolik PED-användning.',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    context:
      'Statistiskt sett är FFMI 25–27 ovanligt att nå naturligt. Majoriteten i detta spann använder prestationshöjande medel.',
  },
  {
    gender: 'male',
    ffmiMin: 27,
    ffmiMax: null,
    bfMin: null,
    bfMax: null,
    label: 'Nästan säkert dopad',
    description: 'Kräver prestationshöjande preparat i de allra flesta fall.',
    color: 'text-red-900',
    bg: 'bg-red-100 border-red-300',
    context:
      'FFMI över 27 är extremt sällsynt naturligt. Forskning och erfarenhet pekar starkt mot substansanvändning vid dessa nivåer.',
  },
  // ── KVINNOR ──
  {
    gender: 'female',
    ffmiMin: 0,
    ffmiMax: 14,
    bfMin: null,
    bfMax: null,
    label: 'Mycket låg',
    description: 'Kraftigt begränsad muskelmassa, möjliga hälsoproblem.',
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
    context:
      'FFMI under 14 för kvinnor indikerar mycket låg mager kroppsmassa. Kontakta läkare om detta är oväntat.',
  },
  {
    gender: 'female',
    ffmiMin: 14,
    ffmiMax: 15,
    bfMin: 20,
    bfMax: 25,
    label: 'Smal/Otränad',
    description: 'Under genomsnittlig muskelmassa, stillasittande, "smal" kroppsbyggnad.',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    context:
      'Typisk för den som inte styrketränat. Konsekvent träning och tillräckligt proteinintag ger tydlig progress.',
  },
  {
    gender: 'female',
    ffmiMin: 14,
    ffmiMax: 17,
    bfMin: 22,
    bfMax: 35,
    label: 'Genomsnittsbefolkning',
    description: 'Normal muskelmassa för otränade kvinnor.',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
    context:
      'Genomsnittlig muskelmassa för en inaktiv kvinna. Regelbunden träning förbättrar FFMI och kroppssammansättning.',
  },
  {
    gender: 'female',
    ffmiMin: 15,
    ffmiMax: 18,
    bfMin: 30,
    bfMax: 45,
    label: 'Överviktig/Fetma',
    description: 'Genomsnittlig muskelmassa men hög kroppsfettsnivå.',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    context:
      'Muskelmassan är normal men fettprocenten är hög. Fokus på kaloribrist och träning förbättrar kroppssammansättningen.',
  },
  {
    gender: 'female',
    ffmiMin: 16,
    ffmiMax: 17,
    bfMin: 18,
    bfMax: 25,
    label: 'Atlet/Mellanliggande',
    description: 'Över genomsnittlig muskelmassa, 2–3 års träning, atletisk kroppsbyggnad.',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    context:
      'Tydligt atletisk framtoning. Vidare progress kräver strukturerad kost och periodisering.',
  },
  {
    gender: 'female',
    ffmiMin: 18,
    ffmiMax: 20,
    bfMin: 15,
    bfMax: 22,
    label: 'Avancerad naturlig',
    description: 'Mycket välutvecklad fysik, 4–7 års träning, tävlingsnivå.',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    context:
      'Att nå detta naturligt som kvinna kräver många år av dedikation och bra genetik. Sällsynt segment.',
  },
  {
    gender: 'female',
    ffmiMin: 19,
    ffmiMax: 21,
    bfMin: 15,
    bfMax: 30,
    label: 'Elit naturlig/Misstänkt',
    description:
      'Närmar sig genetiskt tak, 8+ års träning eller möjlig prestationshöjande användning.',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    context:
      'Vid denna nivå är genetisk outlier-status eller substansanvändning möjliga förklaringar. Sällsynt att nå naturligt som kvinna.',
  },
  {
    gender: 'female',
    ffmiMin: 21,
    ffmiMax: 23,
    bfMin: null,
    bfMax: null,
    label: 'Troligen dopad',
    description: 'Över typiska naturliga gränser för kvinnor.',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    context:
      'Statistiskt sett är FFMI 21–23 ovanligt att nå naturligt som kvinna. Majoriteten i detta spann använder prestationshöjande medel.',
  },
  {
    gender: 'female',
    ffmiMin: 23,
    ffmiMax: null,
    bfMin: null,
    bfMax: null,
    label: 'Nästan säkert dopad',
    description: 'Kräver prestationshöjande preparat i de allra flesta fall.',
    color: 'text-red-900',
    bg: 'bg-red-100 border-red-300',
    context: 'FFMI över 23 är extremt sällsynt naturligt för kvinnor.',
  },
]

function getFfmiCategory(ffmi: number, bodyFatPct: number, gender: Gender): FfmiCategory {
  const rows = FFMI_MATRIX.filter(r => r.gender === gender)
  // First pass: full match (FFMI + body fat)
  for (const row of rows) {
    const ffmiOk = ffmi >= row.ffmiMin && (row.ffmiMax === null || ffmi < row.ffmiMax)
    const bfOk =
      row.bfMin === null ||
      (bodyFatPct >= row.bfMin && (row.bfMax === null || bodyFatPct < row.bfMax))
    if (ffmiOk && bfOk) return row
  }
  // Second pass: FFMI-only match (body fat outside all defined ranges for this FFMI level)
  for (const row of rows) {
    const ffmiOk = ffmi >= row.ffmiMin && (row.ffmiMax === null || ffmi < row.ffmiMax)
    if (ffmiOk) return row
  }
  return rows[rows.length - 1]
}

const MEN_TABLE_ROWS = [
  {
    range: 'Under 17',
    bf: 'Valfri',
    category: 'Mycket låg',
    desc: 'Kraftigt begränsad muskelmassa, möjlig undernäring eller sarkopeni',
  },
  {
    range: '17–18',
    bf: '10–18 %',
    category: 'Smal/Otränad',
    desc: 'Under genomsnittlig muskelmassa, stillasittande livsstil, "smal" kroppsbyggnad',
  },
  {
    range: '18–20',
    bf: '20–27 %',
    category: 'Genomsnittsbefolkning',
    desc: 'Normal muskelmassa för otränade män, hälsosam grundnivå',
  },
  {
    range: '19–21',
    bf: '25–40 %',
    category: 'Överviktig/Fetma',
    desc: 'Genomsnittlig muskelmassa men hög kroppsfettsnivå, "kraftig" eller "bred" kroppsbyggnad',
  },
  {
    range: '20–21',
    bf: '10–18 %',
    category: 'Atlet/Mellanliggande',
    desc: 'Över genomsnittlig muskelmassa, 2–3 års träning, ser tydligt tränad ut',
  },
  {
    range: '22–23',
    bf: '6–12 %',
    category: 'Avancerad naturlig',
    desc: 'Mycket välutvecklad fysik, 4–7 års träning, tävlingsliknande form',
  },
  {
    range: '24–25',
    bf: '8–20 %',
    category: 'Elit naturlig/Misstänkt',
    desc: 'Nära genetiskt tak, 8+ års träning eller möjlig prestationshöjande användning',
  },
  {
    range: '25–27',
    bf: 'Valfri',
    category: 'Troligen dopad',
    desc: 'Över typiska naturliga gränser, genetisk extremvariant eller sannolik PED-användning',
  },
  {
    range: 'Över 27',
    bf: 'Valfri',
    category: 'Nästan säkert dopad',
    desc: 'Kräver prestationshöjande preparat i de allra flesta fall',
  },
]

const WOMEN_TABLE_ROWS = [
  {
    range: 'Under 14',
    bf: 'Valfri',
    category: 'Mycket låg',
    desc: 'Kraftigt begränsad muskelmassa, möjliga hälsoproblem',
  },
  {
    range: '14–15',
    bf: '20–25 %',
    category: 'Smal/Otränad',
    desc: 'Under genomsnittlig muskelmassa, stillasittande, "smal" kroppsbyggnad',
  },
  {
    range: '14–17',
    bf: '22–35 %',
    category: 'Genomsnittsbefolkning',
    desc: 'Normal muskelmassa för otränade kvinnor',
  },
  {
    range: '15–18',
    bf: '30–45 %',
    category: 'Överviktig/Fetma',
    desc: 'Genomsnittlig muskelmassa men hög kroppsfettsnivå',
  },
  {
    range: '16–17',
    bf: '18–25 %',
    category: 'Atlet/Mellanliggande',
    desc: 'Över genomsnittlig muskelmassa, 2–3 års träning, atletisk kroppsbyggnad',
  },
  {
    range: '18–20',
    bf: '15–22 %',
    category: 'Avancerad naturlig',
    desc: 'Mycket välutvecklad fysik, 4–7 års träning, tävlingsnivå',
  },
  {
    range: '19–21',
    bf: '15–30 %',
    category: 'Elit naturlig/Misstänkt',
    desc: 'Närmar sig genetiskt tak, 8+ års träning eller möjlig prestationshöjande användning',
  },
  {
    range: '21–23',
    bf: 'Valfri',
    category: 'Troligen dopad',
    desc: 'Över typiska naturliga gränser för kvinnor',
  },
  {
    range: 'Över 23',
    bf: 'Valfri',
    category: 'Nästan säkert dopad',
    desc: 'Kräver prestationshöjande preparat i de allra flesta fall',
  },
]

function FfmiReferenceTable() {
  const [showMale, setShowMale] = useState(true)
  const rows = showMale ? MEN_TABLE_ROWS : WOMEN_TABLE_ROWS

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-neutral-800">FFMI-referensvärden</h3>
        <button
          onClick={() => setShowMale(v => !v)}
          className="text-xs text-primary-600 hover:underline"
        >
          {showMale ? 'Visa kvinnors värden' : 'Visa mäns värden'}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                FFMI
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                Kroppsfett %
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                Kategori
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 hidden sm:table-cell">
                Beskrivning
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
              >
                <td className="px-4 py-2.5 font-medium text-neutral-800 whitespace-nowrap">
                  {row.range}
                </td>
                <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{row.bf}</td>
                <td className="px-4 py-2.5 font-medium text-neutral-700 whitespace-nowrap">
                  {row.category}
                </td>
                <td className="px-4 py-2.5 text-neutral-500 hidden sm:table-cell">{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 mt-2">
        Källa:{' '}
        <a
          href="https://leanffmi.com/guides/ffmi/ffmi-interpretation-guide/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-primary-500"
        >
          LeanFFMI.com — FFMI Interpretation Guide
        </a>
      </p>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    question: 'Vad är ett bra FFMI?',
    answer:
      'Det beror på kön och träningsbakgrund. För män: nybörjare (<18), tränad (18–19), avancerad (20–21), exceptionell (22+). För kvinnor är värdena ca 4–5 enheter lägre. FFMI 20–22 för en naturlig man kräver flerårig konsekvent träning. Det är ett relativt mått — jämför din progress med dig själv snarare än med andra.',
  },
  {
    question: 'Är 25 FFMI den naturliga gränsen?',
    answer:
      'Kouri et al. (1995) fann att naturliga manliga idrottare sällan översteg normaliserat FFMI 25. Det är en observation, inte en hård biologisk gräns. Individer med exceptionell genetik kan nå 25–26 naturligt. Men ett normaliserat FFMI konsekvent över 25 är statistiskt sällsynt bland naturliga utövare och ökar sannolikheten för substansanvändning avsevärt.',
  },
  {
    question: 'Är FFMI ett bättre mått än BMI?',
    answer:
      'För den som styrketränar: ja. BMI skiljer inte på muskler och fett. FFMI mäter specifikt fettfri massa (muskler, organ, ben) i relation till längd, vilket är mer relevant för att bedöma muskeluppbyggnad och fysik. En vältränad person med högt BMI kan ha lågt FFMI — och tvärtom.',
  },
  {
    question: 'Hur räknar man ut FFMI?',
    answer:
      'FFMI = (kroppsvikt × (1 − fettprocent/100)) ÷ längd². Normaliserat FFMI = FFMI + 6,1 × (1,8 − längd i meter). Exempel: 80 kg, 175 cm, 15% kroppsfett → LBM = 80 × 0,85 = 68 kg → FFMI = 68 ÷ 1,75² = 22,2 → Normaliserat = 22,2 + 6,1 × (1,8 − 1,75) = 22,5.',
  },
  {
    question: 'Kan man ha högt FFMI utan att vara stark?',
    answer:
      'Ja. FFMI mäter muskelmassa, inte styrka eller prestation. En person med naturligt stor skelettstruktur och hög muskelmassa utan träning kan ha ett FFMI på 20 utan att lyfta tungt. Och en person med FFMI 19 kan vara starkare än någon med FFMI 22 beroende på neuromuskulär effektivitet och teknik.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FFMI Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis FFMI-kalkylator. Räkna ut ditt Fat-Free Mass Index och normaliserat FFMI. Bedöm din muskelmassa relativt längd utan att ta hänsyn till fettvikt.',
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
      { '@type': 'ListItem', position: 3, name: 'FFMI Kalkylator', item: CANONICAL },
    ],
  },
]

export default function FfmiKalkylatornPage() {
  const [gender, setGender] = useState<Gender>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const resetResult = () => setHasResult(false)

  const result = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const bf = parseFloat(bodyFat)
    if (!h || !w || !bf || h < 100 || h > 250 || w <= 0 || bf < 2 || bf > 60) return null
    const { lbm, ffmi, normalizedFfmi } = calcFfmi(w, h, bf)
    if (ffmi < 10 || ffmi > 40) return null
    const category = getFfmiCategory(ffmi, bf, gender)
    return { lbm, ffmi, normalizedFfmi, category }
  }, [height, weight, bodyFat, gender])

  const handleCalculate = () => {
    if (result) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="FFMI Kalkylator — Räkna ut ditt Fat-Free Mass Index (2026) | CalculEat"
        description="Gratis FFMI-kalkylator. Räkna ut ditt Fat-Free Mass Index och normaliserat FFMI. Bedöm din muskelmassa, kategori och natural limit i kontext."
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
              <span className="text-neutral-700">FFMI Kalkylator</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                FFMI
              </span>{' '}
              Kalkylator
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              FFMI (Fat-Free Mass Index) visar hur mycket muskelmassa du har i förhållande till din
              längd. Det används för att bedöma fysik, mäta progression och ge kontext kring vad som
              är möjligt att uppnå naturligt.
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-primary-900">Beräkna ditt FFMI</span>
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

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: 'Längd',
                      unit: 'cm',
                      value: height,
                      setter: setHeight,
                      placeholder: '175',
                    },
                    {
                      label: 'Vikt',
                      unit: 'kg',
                      value: weight,
                      setter: setWeight,
                      placeholder: '80',
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

                {/* Body fat */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Kroppsfettprocent
                  </label>
                  <div className="text-xs text-neutral-400 mb-1">
                    Vet du inte din fettprocent?{' '}
                    <Link
                      to="/kalkylatorer/kroppsfett"
                      className="text-primary-600 hover:underline"
                    >
                      Räkna ut den här
                    </Link>
                  </div>
                  <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 max-w-40">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={bodyFat}
                      onChange={e => {
                        setBodyFat(e.target.value)
                        resetResult()
                      }}
                      onFocus={e => e.target.select()}
                      placeholder="15"
                      className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0"
                    />
                    <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5">
                      %
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={!result}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Beräkna mitt FFMI
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">Ditt resultat</h2>

                  {/* Category card */}
                  <div className={`rounded-xl border p-5 ${result.category.bg}`}>
                    <div className="flex items-end gap-3 mb-2">
                      <span className={`text-4xl font-bold ${result.category.color}`}>
                        {result.ffmi}
                      </span>
                      <span className={`text-lg font-semibold mb-0.5 ${result.category.color}`}>
                        {result.category.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">{result.category.description}</p>
                    <p className="text-xs text-neutral-500 italic">{result.category.context}</p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'FFMI', value: result.ffmi, desc: 'Fat-Free Mass Index' },
                      {
                        label: 'Normaliserat',
                        value: result.normalizedFfmi,
                        desc: 'Justerat till 180 cm',
                      },
                      { label: 'Lean body mass', value: `${result.lbm} kg`, desc: 'Fettfri massa' },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-neutral-200 bg-white p-4"
                      >
                        <div className="text-xs text-neutral-500 mb-1">{stat.label}</div>
                        <div className="text-xl font-bold text-neutral-900">{stat.value}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{stat.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Natural limit context */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">FFMI är ett estimat</p>
                      <p className="text-xs text-amber-700">
                        FFMI beror direkt på fettprocent-uppskattningen — om den är +3% fel blir
                        FFMI också fel. Normaliserat FFMI ≥ 25 (män) är statistiskt sällsynt
                        naturligt men inte omöjligt. Tolka ditt FFMI som ett relativt mått, inte ett
                        absolut värde.
                      </p>
                    </div>
                  </div>

                  <GuestOnly>
                    {/* CTA */}
                    <div className="rounded-xl bg-white border border-primary-200 p-4">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        Matcha din muskelmassa med rätt kalorimål
                      </p>
                      <p className="text-xs text-neutral-500 mb-3">
                        Lean body mass är den starkaste prediktorn för ditt BMR. Räkna ut ditt
                        exakta TDEE och sätt ett kalorimål som matchar din kroppssammansättning.
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

        {/* Context/explanation section */}
        <section className="bg-white py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-5">
              Vad FFMI mäter — och vad det inte mäter
            </h2>
            <div className="space-y-4 text-neutral-700 text-base leading-relaxed">
              <p>
                FFMI mäter muskelmassa i förhållande till längd. Det är ett bättre mått än BMI för
                den som tränar eftersom det isolerar fettfri massa och inte straffar muskelvolym.
              </p>
              <p>
                Men det är <strong>inte ett hälsomått</strong> och inte ett styrke- eller
                prestationsmått. Det är ett fysikmått som ger kontext kring var du befinner dig i
                muskelutvecklingen — och vad som är ett realistiskt mål.
              </p>

              <div className="space-y-3 mt-2">
                {[
                  {
                    title: 'FFMI vs BMI',
                    desc: 'En vältränad man, 80 kg och 175 cm (BMI 26,1 — övervikt) med 12% kroppsfett har FFMI 22,2. BMI klassificerar honom som överviktig. FFMI visar att han är i avancerad kategori. För den som tränar är FFMI nästan alltid mer informativt.',
                    color: 'bg-blue-50 border-blue-200',
                  },
                  {
                    title: 'Naturliga gränser i kontext',
                    desc: 'Kouri et al. (1995) analyserade naturliga idrottare och fann ett normaliserat FFMI-tak runt 25 för män. Det är en statistisk observation — inte en hård biologisk gräns. Genetiska outliers kan nå 25–26 naturligt. Men det är sällsynt nog att vara ett signifikant avvikande resultat.',
                    color: 'bg-primary-50 border-primary-200',
                  },
                  {
                    title: 'Hur du förbättrar ditt FFMI',
                    desc: 'FFMI ökar genom att bygga muskelmassa (bulk med kaloriöverskott + styrketräning) eller behålla muskelmassa medan fettprocent minskar (cut eller recomp). Rätt kalorimål per fas, högt proteinintag (1,6–2,2 g/kg) och progressiv träning är de tre faktorerna som driver FFMI uppåt.',
                    color: 'bg-green-50 border-green-200',
                  },
                ].map(({ title, desc, color }) => (
                  <div key={title} className={`rounded-xl border p-4 ${color}`}>
                    <div className="font-semibold text-neutral-800 mb-1">{title}</div>
                    <div className="text-neutral-700">{desc}</div>
                  </div>
                ))}
              </div>

              <FfmiReferenceTable />
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
                Matcha din muskelmassa med rätt kalorimål
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                FFMI visar var du är. TDEE och makroplanering visar hur du tar dig dit du vill.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Skapa gratis konto <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/kalkylatorer/bulk-kalkylator"
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Räkna ut dina bulk-kalorier
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
                    { href: '/kalkylatorer/kroppsfett', label: 'Kroppsfett Kalkylator' },
                    { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
                    { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
                    { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
                    { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
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
                    { href: '/artiklar/vad-ar-ffmi', label: 'Vad är FFMI?' },
                    { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut — komplett guide' },
                    { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
                    { href: '/artiklar/reverse-diet', label: 'Reverse Diet' },
                    { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
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
