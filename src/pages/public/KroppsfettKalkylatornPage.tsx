import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'

const CANONICAL = 'https://calculeat.se/kalkylatorer/kroppsfett'

type Gender = 'male' | 'female'

// US Navy Method
function navyBodyFat(
  gender: Gender,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm: number
): number {
  if (gender === 'male') {
    return (
      495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
    )
  }
  return (
    495 /
      (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) -
    450
  )
}

interface BfCategory {
  label: string
  description: string
  color: string
  bg: string
  nextStep: string
}

function getBfCategory(bf: number, gender: Gender): BfCategory {
  if (gender === 'male') {
    if (bf < 6)
      return {
        label: 'Essentiellt fett',
        description: 'Under nivå för normala fysiologiska funktioner. Inte ett hållbart mål.',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        nextStep: 'Fokus bör ligga på att öka kalorier och nå athletic-zonen.',
      }
    if (bf < 14)
      return {
        label: 'Athletic',
        description: 'Typisk nivå för aktiva tränare och idrottare. Väldigt låg fettprocent.',
        color: 'text-green-700',
        bg: 'bg-green-50 border-green-200',
        nextStep: 'Du är i utmärkt form. TDEE och makroplanering håller dig här.',
      }
    if (bf < 18)
      return {
        label: 'Fit',
        description: 'Hälsosam och aktiv nivå. Tydlig muskeldefiniton, låg hälsorisk.',
        color: 'text-teal-700',
        bg: 'bg-teal-50 border-teal-200',
        nextStep: 'Bra utgångspunkt för cut mot athletic eller bulk mot mer muskelmassa.',
      }
    if (bf < 25)
      return {
        label: 'Genomsnitt',
        description: 'Normalt intervall för männen. Muskler syns men med lager fett ovanpå.',
        color: 'text-yellow-700',
        bg: 'bg-yellow-50 border-yellow-200',
        nextStep: 'En strukturerad cut med 300–500 kcal underskott per dag tar dig till fit-zonen.',
      }
    if (bf < 30)
      return {
        label: 'Övervikt',
        description: 'Ökad hälsorisk. Tydligt viktmål rekommenderas.',
        color: 'text-orange-700',
        bg: 'bg-orange-50 border-orange-200',
        nextStep: 'Räkna ut ditt TDEE och sätt ett kalorimål med 400–600 kcal underskott.',
      }
    return {
      label: 'Fetma',
      description: 'Hög hälsorisk. Medicinsk rådgivning rekommenderas.',
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
      nextStep:
        'Räkna ut ditt TDEE och börja med ett måttligt kaloriunderskott. Rådgör med läkare.',
    }
  }

  // Female thresholds
  if (bf < 14)
    return {
      label: 'Essentiellt fett',
      description: 'Under nivå för normala fysiologiska funktioner. Inte ett hållbart mål.',
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
      nextStep: 'Fokus bör ligga på att öka kalorier och nå athletic-zonen.',
    }
  if (bf < 21)
    return {
      label: 'Athletic',
      description: 'Typisk nivå för aktiva tränare och idrottare.',
      color: 'text-green-700',
      bg: 'bg-green-50 border-green-200',
      nextStep: 'Du är i utmärkt form. TDEE och makroplanering håller dig här.',
    }
  if (bf < 25)
    return {
      label: 'Fit',
      description: 'Hälsosam och aktiv nivå. Låg hälsorisk.',
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200',
      nextStep: 'Bra utgångspunkt för cut eller bulk beroende på ditt mål.',
    }
  if (bf < 32)
    return {
      label: 'Genomsnitt',
      description: 'Normalt intervall för kvinnor. Hälsosam men med utrymme för förbättring.',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-200',
      nextStep: 'En strukturerad cut med 300–400 kcal underskott per dag tar dig till fit-zonen.',
    }
  if (bf < 40)
    return {
      label: 'Övervikt',
      description: 'Ökad hälsorisk. Tydligt viktmål rekommenderas.',
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-200',
      nextStep: 'Räkna ut ditt TDEE och sätt ett kalorimål med 400–600 kcal underskott.',
    }
  return {
    label: 'Fetma',
    description: 'Hög hälsorisk. Medicinsk rådgivning rekommenderas.',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    nextStep: 'Räkna ut ditt TDEE och börja med ett måttligt kaloriunderskott. Rådgör med läkare.',
  }
}

const FAQ_ITEMS = [
  {
    question: 'Hur exakt är en kroppsfett-kalkylator?',
    answer:
      'US Navy-metoden har ett typiskt felmarginal på ±3–4 procentenheter jämfört med DEXA-scanning (guldstandarden). Den är tillräckligt exakt för att följa trend över tid men ger inte ett exakt värde. Mät alltid på samma sätt och tid på dagen för att jämföra resultat — relativ förändring är mer informativ än absolut värde.',
  },
  {
    question: 'Är kroppsfett ett bättre mått än BMI?',
    answer:
      'Ja, för de flesta syften. BMI berättar bara om relationen vikt/längd. Kroppsfett säger hur stor andel av din kropp som faktiskt är fett — vilket är det hälsorelevanta. Två personer med samma BMI kan ha 15% respektive 30% kroppsfett. För träningssyfte är kroppsfett nästan alltid mer informativt.',
  },
  {
    question: 'Vad är en bra kroppsfettprocent?',
    answer:
      'Det beror på kön och mål. För män: athletic (6–13%), fit (14–17%), genomsnitt (18–24%). För kvinnor: athletic (14–20%), fit (21–24%), genomsnitt (25–31%). Dessa är riktmärken — inte medicinska gränsvärden. Det viktigaste är att din fettprocent inte ökar okontrollerat och att du kan upprätthålla din nivå långsiktigt.',
  },
  {
    question: 'Kan man se magrutor vid samma fettprocent?',
    answer:
      'Ja. Hur synliga magrutor är beror på muskelmassa, fettdistribution och genetik — inte bara fettprocent. En person med 12% kroppsfett men lite muskelmassa kan ha osynliga magrutor, medan en person med 14% och mer muskelmassa kan ha tydliga. Det är därför FFMI (Fat Free Mass Index) kompletterar fettprocent bra som mått.',
  },
  {
    question: 'Hur snabbt kan man sänka kroppsfett?',
    answer:
      'En realistisk minskning är 0,5–1% kroppsfett per vecka vid ett välplanerat kaloriunderskott på 400–600 kcal/dag. Snabbare är möjligt men ökar risken för muskelförlust. Högt proteinintag (1,8–2,4 g/kg) och styrketräning är avgörande för att behålla muskelmassa under en cut.',
  },
]

const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Kroppsfett Kalkylator',
    url: CANONICAL,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description:
      'Gratis kroppsfett-kalkylator (US Navy Method). Uppskatta din kroppsfettprocent och lean body mass. Resultat direkt utan konto.',
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
      { '@type': 'ListItem', position: 3, name: 'Kroppsfett Kalkylator', item: CANONICAL },
    ],
  },
]

function InputField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {hint && <div className="text-xs text-neutral-400 mb-1">{hint}</div>}
      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0"
        />
        <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5">
          {unit}
        </span>
      </div>
    </div>
  )
}

export default function KroppsfettKalkylatornPage() {
  const [gender, setGender] = useState<Gender>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hip, setHip] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const resetResult = () => setHasResult(false)

  const result = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const waistN = parseFloat(waist)
    const neckN = parseFloat(neck)
    const hipN = parseFloat(hip)

    if (!h || !w || !waistN || !neckN || h <= 0 || w <= 0 || waistN <= 0 || neckN <= 0) return null
    if (gender === 'female' && (!hipN || hipN <= 0)) return null
    if (waistN <= neckN) return null // log of negative
    if (gender === 'female' && waistN + hipN <= neckN) return null

    const bf = navyBodyFat(gender, h, waistN, neckN, hipN)
    if (bf < 2 || bf > 70) return null

    const bfRounded = Math.round(bf * 10) / 10
    const lbm = Math.round(w * (1 - bf / 100) * 10) / 10
    const fatMass = Math.round(w * (bf / 100) * 10) / 10
    const category = getBfCategory(bfRounded, gender)

    return { bf: bfRounded, lbm, fatMass, category }
  }, [gender, height, weight, waist, neck, hip])

  const canCalculate = !!result

  const handleCalculate = () => {
    if (canCalculate) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Kroppsfett Kalkylator — Räkna ut din kroppsfettprocent (2026) | CalculEat"
        description="Gratis kroppsfett-kalkylator (US Navy Method). Räkna ut din kroppsfettprocent, lean body mass och se din kategori. Resultat direkt — inget konto krävs."
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
              <span className="text-neutral-700">Kroppsfett Kalkylator</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Kroppsfett
              </span>{' '}
              Kalkylator
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              Kroppsfettprocent visar hur stor del av din kroppsvikt som består av fettmassa. Det
              ger en mer användbar bild än BMI när du vill bedöma form, hälsa och planera
              viktnedgång eller muskeluppbyggnad.
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-primary-900">Beräkna din kroppsfett%</span>
                <span className="ml-auto text-xs text-neutral-400">US Navy Method</span>
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

                {/* Height + Weight */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Längd"
                    unit="cm"
                    value={height}
                    onChange={v => {
                      setHeight(v)
                      resetResult()
                    }}
                    placeholder="175"
                  />
                  <InputField
                    label="Vikt"
                    unit="kg"
                    value={weight}
                    onChange={v => {
                      setWeight(v)
                      resetResult()
                    }}
                    placeholder="75"
                  />
                </div>

                {/* Circumferences */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Midjemått"
                    unit="cm"
                    value={waist}
                    onChange={v => {
                      setWaist(v)
                      resetResult()
                    }}
                    placeholder="85"
                    hint="Mät vid naveln"
                  />
                  <InputField
                    label="Halsmått"
                    unit="cm"
                    value={neck}
                    onChange={v => {
                      setNeck(v)
                      resetResult()
                    }}
                    placeholder="38"
                    hint="Mät under adamsäpplet"
                  />
                </div>

                {gender === 'female' && (
                  <InputField
                    label="Höftmått"
                    unit="cm"
                    value={hip}
                    onChange={v => {
                      setHip(v)
                      resetResult()
                    }}
                    placeholder="95"
                    hint="Mät vid det bredaste stället"
                  />
                )}

                <button
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Beräkna min kroppsfett%
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
                        {result.bf}%
                      </span>
                      <span className={`text-lg font-semibold mb-0.5 ${result.category.color}`}>
                        {result.category.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{result.category.description}</p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: 'Lean body mass',
                        value: `${result.lbm} kg`,
                        desc: 'Muskler, organ, ben',
                      },
                      {
                        label: 'Fettmassa',
                        value: `${result.fatMass} kg`,
                        desc: 'Total fettmassa',
                      },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-neutral-200 bg-white p-4"
                      >
                        <div className="text-xs text-neutral-500 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{stat.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Next step */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="text-sm font-medium text-neutral-800 mb-1">
                      Rekommenderat nästa steg
                    </div>
                    <p className="text-xs text-neutral-600 mb-3">{result.category.nextStep}</p>
                  </div>

                  {/* Disclaimer */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      US Navy-metoden ger en uppskattning med ±3–4% felmarginal. Resultatet speglar
                      trend — inte ett exakt värde. DEXA-scanning är guldstandarden om du behöver
                      precision.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="rounded-xl bg-white border border-primary-200 p-4">
                    <p className="text-sm font-medium text-neutral-800 mb-1">
                      Nu vet du din kroppssammansättning — räkna ut rätt kaloriplan
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      TDEE-kalkylatorn tar din kroppsvikt och aktivitetsnivå och ger dig det
                      kalorimål du faktiskt ska logga mot.
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
                        to="/kalkylatorer/ffmi-kalkylator"
                        className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        Beräkna ditt FFMI
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Context/explanation section */}
        <section className="bg-white py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-5">
              Varför kroppsfett är mer användbart än BMI
            </h2>
            <p className="text-base text-neutral-700 leading-relaxed mb-6">
              BMI berättar bara om förhållandet mellan din vikt och längd. Det skiljer inte på
              muskler och fett — vilket är det enda som faktiskt spelar roll för hälsa och
              kroppskomposition.
            </p>
            <div className="space-y-3 mb-8">
              {[
                {
                  title: 'Samma BMI — helt olika kroppssammansättning',
                  desc: 'En vältränad person med 75 kg och 175 cm (BMI 24,5) kan ha 12% kroppsfett. En inaktiv person med samma mått kan ha 28%. BMI ser identiskt ut — kroppen är fundamentalt annorlunda.',
                  color: 'bg-blue-50 border-blue-200',
                },
                {
                  title: 'Fettprocent styr ditt faktiska kalorimål',
                  desc: 'Lean body mass (LBM) är den starkaste prediktorn för BMR. Ju mer muskelmassa du har, desto högre är ditt kaloribehov. Två personer med samma vikt och aktivitetsnivå kan ha 200–300 kcal skillnad i TDEE enbart p.g.a. skillnad i LBM.',
                  color: 'bg-primary-50 border-primary-200',
                },
                {
                  title: 'Bryggan till FFMI och muskeluppbyggnad',
                  desc: 'FFMI (Fat Free Mass Index) mäter muskelmassa i relation till längd och är det bästa måttet för den som tränar. Det beräknas direkt från din fettprocent och vikt — och ger ett mycket mer precist mål att jobba mot än en idealviktssiffra.',
                  color: 'bg-green-50 border-green-200',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-neutral-800 mb-1">{title}</div>
                  <div className="text-base text-neutral-700">{desc}</div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-neutral-800 mb-3">
              Hur du mäter rätt (US Navy Method)
            </h3>
            <ul className="space-y-1.5 pl-4 list-disc text-base text-neutral-700 leading-relaxed">
              <li>
                <strong>Midjemått:</strong> Mät horisontellt vid naveln — inte vid det smalaste
                stället. Håll bandet snug men utan att trycka in huden.
              </li>
              <li>
                <strong>Halsmått:</strong> Mät precis under adamsäpplet. Håll bandet plant runt
                halsen.
              </li>
              <li>
                <strong>Höftmått (kvinnor):</strong> Mät vid det bredaste stället på höfterna.
              </li>
              <li>
                Mät alltid på morgonen, fastande, och på samma dag i veckan för jämförbara resultat.
              </li>
            </ul>
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
                Sätt ett kalorimål som matchar din kropp
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                Nu vet du din fettprocent. Räkna ut TDEE och börja logga mot ett mål som faktiskt
                stämmer.
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
                    { href: '/kalkylatorer/idealvikt', label: 'Idealvikt Kalkylator' },
                    { href: '/kalkylatorer/ffmi-kalkylator', label: 'FFMI Kalkylator' },
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
                    { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut' },
                    { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
                    { href: '/artiklar/bmi-vs-kroppsfett', label: 'BMI vs Kroppsfett' },
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
