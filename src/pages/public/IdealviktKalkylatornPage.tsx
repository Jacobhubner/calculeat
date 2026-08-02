import { useState, useMemo } from 'react'
import { RichParagraph } from '@/components/RichParagraph'
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
type Position = 'underweight' | 'below_ideal' | 'within' | 'above_ideal' | 'overweight'

type FaqItem = { question: string; answer: string }
type PositionLabel = { value: Position; label: string; desc: string }

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

function getPosition(currentWeight: number, rangeMin: number, rangeMax: number): Position {
  if (currentWeight < rangeMin - 2) return 'underweight'
  if (currentWeight < rangeMin) return 'below_ideal'
  if (currentWeight <= rangeMax) return 'within'
  if (currentWeight <= rangeMax + 5) return 'above_ideal'
  return 'overweight'
}

// Color/bg classes stay in TSX — not content
const POSITION_COLORS: Record<Position, string> = {
  underweight: 'text-blue-700 dark:text-blue-300',
  below_ideal: 'text-cyan-700',
  within: 'text-green-700 dark:text-green-300',
  above_ideal: 'text-yellow-700 dark:text-yellow-300',
  overweight: 'text-orange-700 dark:text-orange-300',
}

const POSITION_BG: Record<Position, string> = {
  underweight: 'bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-800',
  below_ideal: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/25 dark:border-cyan-800',
  within: 'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
  above_ideal: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/25 dark:border-yellow-800',
  overweight: 'bg-orange-50 border-orange-200 dark:bg-orange-900/25 dark:border-orange-800',
}

const pageConfig = getPageConfigByKey('idealweight-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function IdealviktKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('idealweight-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const positionLabels = t('idealweight-calculator.positionLabels', {
    returnObjects: true,
  }) as unknown as PositionLabel[]
  const relatedCalcs = t('idealweight-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('idealweight-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]

  const getPositionLabel = (pos: Position) => positionLabels.find(p => p.value === pos)

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('idealweight-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('idealweight-calculator.schema.webAppDescription'),
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
          name: t('idealweight-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.com${t('idealweight-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('idealweight-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

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
      return {
        range,
        ideal,
        position: null as Position | null,
        currentWeight: null as number | null,
        diff: null as number | null,
      }
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
        title={t('idealweight-calculator.seo.title')}
        description={t('idealweight-calculator.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <JsonLd schema={pageSchema} />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden bg-white border-b border-neutral-100 dark:bg-neutral-850">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(37,189,0,0.07),transparent_60%)]" />
          <div className="relative container mx-auto px-4 pt-16 pb-14 max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6 dark:text-neutral-400">
              <Link
                to="/"
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                Calculeat
              </Link>
              <span>/</span>
              <Link
                to={t('idealweight-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                {t('idealweight-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-200">
                {t('idealweight-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight dark:text-neutral-100">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('idealweight-calculator.h1Prefix')}
              </span>{' '}
              {t('idealweight-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl dark:text-neutral-400">
              {t('idealweight-calculator.intro')}
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
                  {t('idealweight-calculator.calculator.header')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-200">
                    {t('idealweight-calculator.calculator.genderLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'male', label: t('idealweight-calculator.calculator.genderMale') },
                        {
                          value: 'female',
                          label: t('idealweight-calculator.calculator.genderFemale'),
                        },
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
                  {[
                    {
                      label: t('idealweight-calculator.calculator.heightLabel'),
                      unit: 'cm',
                      value: height,
                      setter: (v: string) => {
                        setHeight(v)
                        setHasResult(false)
                      },
                      placeholder: '175',
                    },
                    {
                      label: t('idealweight-calculator.calculator.weightLabel'),
                      unit: 'kg',
                      value: weight,
                      setter: (v: string) => {
                        setWeight(v)
                        setHasResult(false)
                      },
                      placeholder: '75',
                    },
                  ].map(({ label, unit, value, setter, placeholder }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-200">
                        {label}
                      </label>
                      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 dark:border-neutral-700">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={value}
                          onChange={e => setter(e.target.value)}
                          onFocus={e => e.target.select()}
                          placeholder={placeholder}
                          className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0 dark:bg-neutral-850 dark:text-neutral-100"
                        />
                        <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
                          {unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  {t('idealweight-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4 dark:bg-neutral-900">
                  <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {t('idealweight-calculator.calculator.resultsTitle')}
                  </h2>

                  {/* Main range card */}
                  <div className="rounded-xl border bg-white border-neutral-200 p-5 dark:border-neutral-700 dark:bg-neutral-850">
                    <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-3 dark:text-neutral-400">
                      {t('idealweight-calculator.calculator.rangeLabel')}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                        {result.range.min}–{result.range.max}
                      </span>
                      <span className="text-neutral-500 mb-1 dark:text-neutral-400">kg</span>
                    </div>
                    <div className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                      {t('idealweight-calculator.calculator.formulaLabel')}{' '}
                      <strong className="text-neutral-700 dark:text-neutral-200">
                        {result.ideal} kg
                      </strong>
                    </div>
                  </div>

                  {/* Position card — only when current weight provided */}
                  {result.position &&
                    result.currentWeight &&
                    (() => {
                      const posLabel = getPositionLabel(result.position)
                      if (!posLabel) return null
                      return (
                        <div className={`rounded-xl border p-4 ${POSITION_BG[result.position]}`}>
                          <div className={`font-semibold mb-1 ${POSITION_COLORS[result.position]}`}>
                            {posLabel.label}
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-200">
                            {posLabel.desc}
                          </p>
                          {result.diff !== null && result.diff !== 0 && (
                            <div className="mt-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              {result.diff > 0
                                ? `${result.diff} ${t('idealweight-calculator.calculator.diffOverLabel')}`
                                : `${Math.abs(result.diff)} ${t('idealweight-calculator.calculator.diffUnderLabel')}`}
                            </div>
                          )}
                        </div>
                      )
                    })()}

                  {/* Key insight box */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 dark:bg-amber-900/25 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-300" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1 dark:text-amber-300">
                        {t('idealweight-calculator.calculator.insightTitle')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {t('idealweight-calculator.calculator.insightBody')}
                      </p>
                    </div>
                  </div>

                  <GuestOnly>
                    <div className="rounded-xl bg-white border border-primary-200 p-4 dark:bg-neutral-850">
                      <p className="text-sm font-medium text-neutral-800 mb-1 dark:text-neutral-200">
                        {t('idealweight-calculator.calculator.nextStepTitle')}
                      </p>
                      <p className="text-xs text-neutral-500 mb-3 dark:text-neutral-400">
                        {t('idealweight-calculator.calculator.nextStepBody')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          to={
                            relatedCalcs[0]?.href ??
                            t('idealweight-calculator.schema.breadcrumb.hubPath')
                          }
                          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          {t('idealweight-calculator.calculator.nextStepPrimary')}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/register"
                          className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
                        >
                          {t('idealweight-calculator.calculator.nextStepSecondary')}
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
        <section className="bg-white py-14 border-b border-neutral-100 dark:bg-neutral-850">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-4 text-neutral-700 text-base leading-relaxed dark:text-neutral-200">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t('idealweight-calculator.explanation.h2_1')}
              </h2>
              <p>
                <RichParagraph text={t('idealweight-calculator.explanation.p_1')} />
              </p>
              <p>
                <RichParagraph text={t('idealweight-calculator.explanation.p_2')} />
              </p>

              <h3 className="text-lg font-semibold text-neutral-800 mt-4 dark:text-neutral-200">
                {t('idealweight-calculator.explanation.h3_1')}
              </h3>
              <ul className="space-y-1.5 pl-4 list-disc">
                {(
                  t('idealweight-calculator.explanation.list_1', {
                    returnObjects: true,
                  }) as string[]
                ).map((item, i) => {
                  const dashIdx = item.indexOf(' — ')
                  const bold = item.substring(2, dashIdx - 2)
                  const rest = item.substring(dashIdx)
                  return (
                    <li key={i}>
                      <strong>{bold}</strong>
                      {rest}
                    </li>
                  )
                })}
              </ul>

              <div className="rounded-xl bg-primary-50 border border-primary-200 p-5 mt-4 dark:bg-primary-900/25 dark:border-primary-800">
                <div className="font-semibold text-neutral-800 mb-2 dark:text-neutral-200">
                  {t('idealweight-calculator.explanation.box_title')}
                </div>
                <ol className="space-y-1.5 pl-4 list-decimal text-base text-neutral-700 dark:text-neutral-200">
                  {(
                    t('idealweight-calculator.explanation.box_steps', {
                      returnObjects: true,
                    }) as string[]
                  ).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <Link
                  to={
                    relatedCalcs[0]?.href ?? t('idealweight-calculator.schema.breadcrumb.hubPath')
                  }
                  className="inline-flex items-center gap-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  {t('idealweight-calculator.explanation.box_link')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100 dark:bg-neutral-900">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('idealweight-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('idealweight-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto dark:text-neutral-500">
                {t('idealweight-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('idealweight-calculator.cta.bottom.primary')}{' '}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={
                    relatedCalcs[0]?.href ?? t('idealweight-calculator.schema.breadcrumb.hubPath')
                  }
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('idealweight-calculator.cta.bottom.secondary')}
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
                  {t('idealweight-calculator.related.calculatorsTitle')}
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
                  {t('idealweight-calculator.related.articlesTitle')}
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
