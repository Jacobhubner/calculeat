import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type Gender = 'male' | 'female'
type FaqItem = { question: string; answer: string }

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
    ffmiMax: 18,
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

  // Second pass: bf outside all ranges for this FFMI — pick closest bf row.
  // "any bf" rows (bfMin === null) are always eligible; among bf-ranged rows
  // pick the one whose interval is nearest to the user's actual bf.
  const ffmiMatches = rows.filter(
    r => ffmi >= r.ffmiMin && (r.ffmiMax === null || ffmi < r.ffmiMax)
  )
  if (ffmiMatches.length === 0) return rows[rows.length - 1]

  return ffmiMatches.reduce((best, row) => {
    // "any bf" rows are a perfect fit for the bf dimension — always prefer them
    if (row.bfMin === null) return row
    if (best.bfMin === null) return best
    // Both have a bf range — pick the one whose nearest boundary is closest
    const rowDist = Math.min(
      Math.abs(bodyFatPct - row.bfMin),
      row.bfMax != null ? Math.abs(bodyFatPct - row.bfMax) : Infinity
    )
    const bestDist = Math.min(
      Math.abs(bodyFatPct - best.bfMin),
      best.bfMax != null ? Math.abs(bodyFatPct - best.bfMax) : Infinity
    )
    return rowDist < bestDist ? row : best
  })
}

type TFn = ((key: string) => string) & ((key: string, options: { returnObjects: true }) => unknown)

type TableRow = { range: string; bf: string; category: string; desc: string }

function FfmiReferenceTable({ t }: { t: TFn }) {
  const [showMale, setShowMale] = useState(true)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const menRows = t('ffmi-calculator.referenceTable.menRows', {
    returnObjects: true,
  }) as unknown as TableRow[]
  const womenRows = t('ffmi-calculator.referenceTable.womenRows', {
    returnObjects: true,
  }) as unknown as TableRow[]
  const rows = showMale ? menRows : womenRows

  const toggleRow = (i: number) => setExpandedRow(prev => (prev === i ? null : i))

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-neutral-800">
          {t('ffmi-calculator.referenceTable.title')}
        </h3>
        <button
          onClick={() => {
            setShowMale(v => !v)
            setExpandedRow(null)
          }}
          className="text-xs text-primary-600 hover:underline"
        >
          {showMale
            ? t('ffmi-calculator.referenceTable.showFemale')
            : t('ffmi-calculator.referenceTable.showMale')}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                {t('ffmi-calculator.referenceTable.colFfmi')}
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                {t('ffmi-calculator.referenceTable.colBf')}
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                {t('ffmi-calculator.referenceTable.colCategory')}
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 hidden sm:table-cell">
                {t('ffmi-calculator.referenceTable.colDesc')}
              </th>
              <th className="px-2 py-2.5 border-b border-neutral-200 sm:hidden" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isExpanded = expandedRow === i
              const rowClass = `border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`
              return (
                <>
                  <tr key={i} className={rowClass}>
                    <td className="px-4 py-2.5 font-medium text-neutral-800 whitespace-nowrap">
                      {row.range}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{row.bf}</td>
                    <td className="px-4 py-2.5 font-medium text-neutral-700 whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500 hidden sm:table-cell">
                      {row.desc}
                    </td>
                    <td className="px-2 py-2.5 sm:hidden">
                      <button
                        type="button"
                        onClick={() => toggleRow(i)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                        aria-label={t('ffmi-calculator.referenceTable.expandAriaLabel')}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${i}-desc`} className={`${rowClass} sm:hidden`}>
                      <td colSpan={4} className="px-4 pb-3 pt-0 text-xs text-neutral-500 italic">
                        {row.desc}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 mt-2">
        Källa: LeanFFMI.com — FFMI Interpretation Guide
      </p>
    </div>
  )
}

const pageConfig = getPageConfigByKey('ffmi-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function FfmiKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('ffmi-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const relatedCalcs = t('ffmi-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('ffmi-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  type FfmiMatrixLocale = { label: string; description: string; context: string }
  const ffmiLabels = t('ffmi-calculator.matrixLabels', {
    returnObjects: true,
  }) as unknown as Record<string, Record<string, FfmiMatrixLocale>>

  const tSimple = t as unknown as TFn

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('ffmi-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('ffmi-calculator.schema.webAppDescription'),
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
          name: t('ffmi-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.se${t('ffmi-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('ffmi-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

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
        title={t('ffmi-calculator.seo.title')}
        description={t('ffmi-calculator.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <JsonLd schema={pageSchema} />

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
                to={t('ffmi-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors"
              >
                {t('ffmi-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700">
                {t('ffmi-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('ffmi-calculator.h1Prefix')}
              </span>{' '}
              {t('ffmi-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              {t('ffmi-calculator.intro')}
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-primary-900">
                  {t('ffmi-calculator.calculator.header')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('ffmi-calculator.calculator.genderLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'male', label: t('ffmi-calculator.calculator.genderMale') },
                        { value: 'female', label: t('ffmi-calculator.calculator.genderFemale') },
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
                      label: t('ffmi-calculator.calculator.heightLabel'),
                      unit: 'cm',
                      value: height,
                      setter: setHeight,
                      placeholder: '175',
                    },
                    {
                      label: t('ffmi-calculator.calculator.weightLabel'),
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
                    {t('ffmi-calculator.calculator.bfLabel')}
                  </label>
                  <div className="text-xs text-neutral-400 mb-1">
                    {t('ffmi-calculator.calculator.bfHintPrefix')}{' '}
                    <Link
                      to={relatedCalcs[0]?.href ?? '/kalkylatorer/kroppsfett'}
                      className="text-primary-600 hover:underline"
                    >
                      {t('ffmi-calculator.calculator.bfHintLink')}
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
                  {t('ffmi-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">
                    {t('ffmi-calculator.calculator.resultsTitle')}
                  </h2>

                  {/* Category card */}
                  <div className={`rounded-xl border p-5 ${result.category.bg}`}>
                    <div className="flex items-end gap-3 mb-2">
                      <span className={`text-4xl font-bold ${result.category.color}`}>
                        {result.ffmi}
                      </span>
                      <span className={`text-lg font-semibold mb-0.5 ${result.category.color}`}>
                        {ffmiLabels[gender]?.[result.category.label]?.label ??
                          result.category.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">
                      {ffmiLabels[gender]?.[result.category.label]?.description ??
                        result.category.description}
                    </p>
                    <p className="text-xs text-neutral-500 italic">
                      {ffmiLabels[gender]?.[result.category.label]?.context ??
                        result.category.context}
                    </p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: t('ffmi-calculator.calculator.ffmiStatLabel'),
                        value: result.ffmi,
                        desc: t('ffmi-calculator.calculator.ffmiStatDesc'),
                      },
                      {
                        label: t('ffmi-calculator.calculator.normalizedLabel'),
                        value: result.normalizedFfmi,
                        desc: t('ffmi-calculator.calculator.normalizedDesc'),
                      },
                      {
                        label: t('ffmi-calculator.calculator.lbmLabel'),
                        value: `${result.lbm} kg`,
                        desc: t('ffmi-calculator.calculator.lbmDesc'),
                      },
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
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        {t('ffmi-calculator.calculator.warningTitle')}
                      </p>
                      <p className="text-xs text-amber-700">
                        {t('ffmi-calculator.calculator.warningBody')}
                      </p>
                    </div>
                  </div>

                  <GuestOnly>
                    {/* CTA */}
                    <div className="rounded-xl bg-white border border-primary-200 p-4">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        {t('ffmi-calculator.calculator.ctaTitle')}
                      </p>
                      <p className="text-xs text-neutral-500 mb-3">
                        {t('ffmi-calculator.calculator.ctaBody')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          to={
                            relatedCalcs[1]?.href ?? t('ffmi-calculator.schema.breadcrumb.hubPath')
                          }
                          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          {t('ffmi-calculator.calculator.ctaPrimary')}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/register"
                          className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          {t('ffmi-calculator.calculator.ctaSecondary')}
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

              <FfmiReferenceTable t={tSimple} />
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('ffmi-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('ffmi-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                {t('ffmi-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('ffmi-calculator.cta.bottom.primary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[4]?.href ?? '/kalkylatorer/bulk-kalkylator'}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('ffmi-calculator.cta.bottom.secondary')}
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
                  {t('ffmi-calculator.related.calculatorsTitle')}
                </h3>
                <div className="grid gap-3">
                  {relatedCalcs.map(l => (
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
                  {t('ffmi-calculator.related.articlesTitle')}
                </h3>
                <div className="grid gap-3">
                  {relatedArticles.map(l => (
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
