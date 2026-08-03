import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle } from 'lucide-react'
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

// US Navy Method — calculation logic unchanged
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
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-800',
        nextStep: 'Fokus bör ligga på att öka kalorier och nå athletic-zonen.',
      }
    if (bf < 14)
      return {
        label: 'Athletic',
        description: 'Typisk nivå för aktiva tränare och idrottare. Väldigt låg fettprocent.',
        color: 'text-green-700 dark:text-green-300',
        bg: 'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
        nextStep: 'Du är i utmärkt form. TDEE och makroplanering håller dig här.',
      }
    if (bf < 18)
      return {
        label: 'Fit',
        description: 'Hälsosam och aktiv nivå. Tydlig muskeldefiniton, låg hälsorisk.',
        color: 'text-teal-700',
        bg: 'bg-teal-50 border-teal-200 dark:bg-teal-900/25 dark:border-teal-800',
        nextStep: 'Bra utgångspunkt för cut mot athletic eller bulk mot mer muskelmassa.',
      }
    if (bf < 25)
      return {
        label: 'Genomsnitt',
        description: 'Normalt intervall för männen. Muskler syns men med lager fett ovanpå.',
        color: 'text-yellow-700 dark:text-yellow-300',
        bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/25 dark:border-yellow-800',
        nextStep: 'En strukturerad cut med 300–500 kcal underskott per dag tar dig till fit-zonen.',
      }
    if (bf < 30)
      return {
        label: 'Övervikt',
        description: 'Ökad hälsorisk. Tydligt viktmål rekommenderas.',
        color: 'text-orange-700 dark:text-orange-300',
        bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/25 dark:border-orange-800',
        nextStep: 'Räkna ut ditt TDEE och sätt ett kalorimål med 400–600 kcal underskott.',
      }
    return {
      label: 'Fetma',
      description: 'Hög hälsorisk. Medicinsk rådgivning rekommenderas.',
      color: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-800',
      nextStep:
        'Räkna ut ditt TDEE och börja med ett måttligt kaloriunderskott. Rådgör med läkare.',
    }
  }

  if (bf < 14)
    return {
      label: 'Essentiellt fett',
      description: 'Under nivå för normala fysiologiska funktioner. Inte ett hållbart mål.',
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-800',
      nextStep: 'Fokus bör ligga på att öka kalorier och nå athletic-zonen.',
    }
  if (bf < 21)
    return {
      label: 'Athletic',
      description: 'Typisk nivå för aktiva tränare och idrottare.',
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
      nextStep: 'Du är i utmärkt form. TDEE och makroplanering håller dig här.',
    }
  if (bf < 25)
    return {
      label: 'Fit',
      description: 'Hälsosam och aktiv nivå. Låg hälsorisk.',
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200 dark:bg-teal-900/25 dark:border-teal-800',
      nextStep: 'Bra utgångspunkt för cut eller bulk beroende på ditt mål.',
    }
  if (bf < 32)
    return {
      label: 'Genomsnitt',
      description: 'Normalt intervall för kvinnor. Hälsosam men med utrymme för förbättring.',
      color: 'text-yellow-700 dark:text-yellow-300',
      bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/25 dark:border-yellow-800',
      nextStep: 'En strukturerad cut med 300–400 kcal underskott per dag tar dig till fit-zonen.',
    }
  if (bf < 40)
    return {
      label: 'Övervikt',
      description: 'Ökad hälsorisk. Tydligt viktmål rekommenderas.',
      color: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/25 dark:border-orange-800',
      nextStep: 'Räkna ut ditt TDEE och sätt ett kalorimål med 400–600 kcal underskott.',
    }
  return {
    label: 'Fetma',
    description: 'Hög hälsorisk. Medicinsk rådgivning rekommenderas.',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-800',
    nextStep: 'Räkna ut ditt TDEE och börja med ett måttligt kaloriunderskott. Rådgör med läkare.',
  }
}

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
      <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-200">
        {label}
      </label>
      {hint && <div className="text-xs text-neutral-400 mb-1 dark:text-neutral-500">{hint}</div>}
      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 dark:border-neutral-700">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0 dark:bg-neutral-850 dark:text-neutral-100"
        />
        <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
          {unit}
        </span>
      </div>
    </div>
  )
}

const pageConfig = getPageConfigByKey('bodyfat-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function KroppsfettKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bodyfat-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const relatedCalcs = t('bodyfat-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('bodyfat-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  type BfCategoryLocale = { label: string; description: string; nextStep: string }
  const bfLabels = t('bodyfat-calculator.categoryLabels', {
    returnObjects: true,
  }) as unknown as Record<string, Record<string, BfCategoryLocale>>

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('bodyfat-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('bodyfat-calculator.schema.webAppDescription'),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Calculeat', item: 'https://calculeat.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('bodyfat-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.com${t('bodyfat-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('bodyfat-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

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
    if (waistN <= neckN) return null
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
        title={t('bodyfat-calculator.seo.title')}
        description={t('bodyfat-calculator.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <JsonLd schema={pageSchema} />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden bg-white border-b border-neutral-100 dark:bg-neutral-850">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(87,134,29,0.07),transparent_60%)]" />
          <div className="relative container mx-auto px-4 pt-16 pb-14 max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6 dark:text-neutral-400">
              <Link
                to="/"
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                Calculeat
              </Link>
              <span>/</span>
              <Link
                to={t('bodyfat-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                {t('bodyfat-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-200">
                {t('bodyfat-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight dark:text-neutral-100">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('bodyfat-calculator.h1Prefix')}
              </span>{' '}
              {t('bodyfat-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl dark:text-neutral-400">
              {t('bodyfat-calculator.intro')}
            </p>
          </div>
        </section>

        {/* Calculator section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100 dark:bg-neutral-900">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden dark:border-neutral-700">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2 dark:bg-primary-900/25">
                <Calculator className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                <span className="font-semibold text-primary-900 dark:text-primary-300">
                  {t('bodyfat-calculator.calculator.header')}
                </span>
                <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
                  {t('bodyfat-calculator.calculator.methodLabel')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-200">
                    {t('bodyfat-calculator.calculator.genderLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'male', label: t('bodyfat-calculator.calculator.genderMale') },
                        { value: 'female', label: t('bodyfat-calculator.calculator.genderFemale') },
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
                            ? 'bg-primary-500 text-on-primary border-primary-600'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-200'
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
                    label={t('bodyfat-calculator.calculator.heightLabel')}
                    unit="cm"
                    value={height}
                    onChange={v => {
                      setHeight(v)
                      resetResult()
                    }}
                    placeholder="175"
                  />
                  <InputField
                    label={t('bodyfat-calculator.calculator.weightLabel')}
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
                    label={t('bodyfat-calculator.calculator.waistLabel')}
                    unit="cm"
                    value={waist}
                    onChange={v => {
                      setWaist(v)
                      resetResult()
                    }}
                    placeholder="85"
                    hint={t('bodyfat-calculator.calculator.waistHint')}
                  />
                  <InputField
                    label={t('bodyfat-calculator.calculator.neckLabel')}
                    unit="cm"
                    value={neck}
                    onChange={v => {
                      setNeck(v)
                      resetResult()
                    }}
                    placeholder="38"
                    hint={t('bodyfat-calculator.calculator.neckHint')}
                  />
                </div>

                {gender === 'female' && (
                  <InputField
                    label={t('bodyfat-calculator.calculator.hipLabel')}
                    unit="cm"
                    value={hip}
                    onChange={v => {
                      setHip(v)
                      resetResult()
                    }}
                    placeholder="95"
                    hint={t('bodyfat-calculator.calculator.hipHint')}
                  />
                )}

                <button
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  className="w-full bg-primary-500 hover:bg-primary-400 disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 text-on-primary font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  {t('bodyfat-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4 dark:bg-neutral-900">
                  <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {t('bodyfat-calculator.calculator.resultsTitle')}
                  </h2>

                  {/* Category card */}
                  <div className={`rounded-xl border p-5 ${result.category.bg}`}>
                    <div className="flex items-end gap-3 mb-2">
                      <span className={`text-4xl font-bold ${result.category.color}`}>
                        {result.bf}%
                      </span>
                      <span className={`text-lg font-semibold mb-0.5 ${result.category.color}`}>
                        {bfLabels[gender]?.[result.category.label]?.label ?? result.category.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-200">
                      {bfLabels[gender]?.[result.category.label]?.description ??
                        result.category.description}
                    </p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: t('bodyfat-calculator.calculator.lbmLabel'),
                        value: `${result.lbm} kg`,
                        desc: t('bodyfat-calculator.calculator.lbmDesc'),
                      },
                      {
                        label: t('bodyfat-calculator.calculator.fatMassLabel'),
                        value: `${result.fatMass} kg`,
                        desc: t('bodyfat-calculator.calculator.fatMassDesc'),
                      },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-850"
                      >
                        <div className="text-xs text-neutral-500 mb-1 dark:text-neutral-400">
                          {stat.label}
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                          {stat.value}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">
                          {stat.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next step */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4 dark:border-neutral-700 dark:bg-neutral-850">
                    <div className="text-sm font-medium text-neutral-800 mb-1 dark:text-neutral-200">
                      {t('bodyfat-calculator.calculator.nextStepTitle')}
                    </div>
                    <p className="text-xs text-neutral-600 mb-3 dark:text-neutral-400">
                      {bfLabels[gender]?.[result.category.label]?.nextStep ??
                        result.category.nextStep}
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 dark:bg-amber-900/25 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-300" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {t('bodyfat-calculator.calculator.disclaimerBody')}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="rounded-xl bg-white border border-primary-200 p-4 dark:bg-neutral-850">
                    <p className="text-sm font-medium text-neutral-800 mb-1 dark:text-neutral-200">
                      {t('bodyfat-calculator.calculator.ctaTitle')}
                    </p>
                    <p className="text-xs text-neutral-500 mb-3 dark:text-neutral-400">
                      {t('bodyfat-calculator.calculator.ctaBody')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={
                          relatedCalcs[0]?.href ?? t('bodyfat-calculator.schema.breadcrumb.hubPath')
                        }
                        className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-on-primary text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {t('bodyfat-calculator.calculator.ctaPrimary')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        to={relatedCalcs[3]?.href ?? '/kalkylatorer/ffmi-kalkylator'}
                        className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
                      >
                        {t('bodyfat-calculator.calculator.ctaSecondary')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Context/explanation section */}
        <section className="bg-white py-14 border-b border-neutral-100 dark:bg-neutral-850">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-5 dark:text-neutral-100">
              {t('bodyfat-calculator.explanation.h2_1')}
            </h2>
            <p className="text-base text-neutral-700 leading-relaxed mb-6 dark:text-neutral-200">
              {t('bodyfat-calculator.explanation.p_1')}
            </p>
            <div className="space-y-3 mb-8">
              {(
                t('bodyfat-calculator.explanation.cards', {
                  returnObjects: true,
                }) as { title: string; desc: string }[]
              ).map(({ title, desc }, i) => {
                const colors = [
                  'bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-800',
                  'bg-primary-50 border-primary-200 dark:bg-primary-900/25 dark:border-primary-800',
                  'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
                ]
                return (
                  <div key={title} className={`rounded-xl border p-4 ${colors[i]}`}>
                    <div className="font-semibold text-neutral-800 mb-1 dark:text-neutral-200">
                      {title}
                    </div>
                    <div className="text-base text-neutral-700 dark:text-neutral-200">{desc}</div>
                  </div>
                )
              })}
            </div>

            <h3 className="text-lg font-semibold text-neutral-800 mb-3 dark:text-neutral-200">
              {t('bodyfat-calculator.explanation.h3_1')}
            </h3>
            <ul className="space-y-1.5 pl-4 list-disc text-base text-neutral-700 leading-relaxed dark:text-neutral-200">
              {(
                t('bodyfat-calculator.explanation.list_1', { returnObjects: true }) as string[]
              ).map((item, i) => {
                const colonIdx = item.indexOf(':**')
                if (item.startsWith('**') && colonIdx > 0) {
                  const bold = item.substring(2, colonIdx)
                  const rest = item.substring(colonIdx + 3).trim()
                  return (
                    <li key={i}>
                      <strong>{bold}:</strong> {rest}
                    </li>
                  )
                }
                return <li key={i}>{item}</li>
              })}
            </ul>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100 dark:bg-neutral-900">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('bodyfat-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('bodyfat-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto dark:text-neutral-500">
                {t('bodyfat-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bodyfat-calculator.cta.bottom.primary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[0]?.href ?? t('bodyfat-calculator.schema.breadcrumb.hubPath')}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bodyfat-calculator.cta.bottom.secondary')}
                </Link>
              </div>
            </div>
          </section>
        </GuestOnly>

        {/* Related links section */}
        <section className="bg-white py-14 dark:bg-neutral-850">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid sm:grid-cols-2 gap-10">
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 dark:text-neutral-400">
                  {t('bodyfat-calculator.related.calculatorsTitle')}
                </h3>
                <div className="grid gap-3">
                  {relatedCalcs.map(l => (
                    <Link
                      key={l.href}
                      to={l.href}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all dark:border-neutral-700 dark:text-neutral-200"
                    >
                      <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 dark:text-neutral-400">
                  {t('bodyfat-calculator.related.articlesTitle')}
                </h3>
                <div className="grid gap-3">
                  {relatedArticles.map(l => (
                    <Link
                      key={l.href}
                      to={l.href}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all dark:border-neutral-700 dark:text-neutral-200"
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
