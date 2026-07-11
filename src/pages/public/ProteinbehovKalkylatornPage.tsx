import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type Goal = 'cut' | 'maintenance' | 'bulk'
type TrainingStatus = 'inactive' | 'active' | 'elite'

type FaqItem = { question: string; answer: string }
type GoalConfig = { value: Goal; label: string; description: string }
type TrainingStatusConfig = { value: TrainingStatus; label: string; description: string }

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

const MEALS_OPTIONS = [2, 3, 4, 5, 6]

const GOAL_COLORS: Record<Goal, string> = {
  cut: 'text-blue-700',
  maintenance: 'text-neutral-700',
  bulk: 'text-green-700',
}

const GOAL_BG: Record<Goal, string> = {
  cut: 'bg-blue-600',
  maintenance: 'bg-neutral-700',
  bulk: 'bg-green-600',
}

const GOAL_RING_COLORS: Record<Goal, string> = {
  cut: 'border-blue-500 bg-blue-50',
  maintenance: 'border-neutral-500 bg-neutral-50',
  bulk: 'border-green-500 bg-green-50',
}

const GOAL_RINGS: Record<Goal, string> = {
  cut: 'border-blue-500 bg-blue-500',
  maintenance: 'border-neutral-500 bg-neutral-500',
  bulk: 'border-green-500 bg-green-500',
}

const pageConfig = getPageConfigByKey('protein-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function ProteinbehovKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('protein-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const goals = t('protein-calculator.goals', { returnObjects: true }) as unknown as GoalConfig[]
  const trainingStatuses = t('protein-calculator.trainingStatuses', {
    returnObjects: true,
  }) as unknown as TrainingStatusConfig[]
  const ctaFeatures = t('protein-calculator.calculator.features', {
    returnObjects: true,
  }) as unknown as string[]
  const relatedCalcs = t('protein-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('protein-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('protein-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('protein-calculator.schema.webAppDescription'),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'CalculEat', item: 'https://calculeat.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('protein-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.com${t('protein-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('protein-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState<Goal>('maintenance')
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('active')
  const [mealsPerDay, setMealsPerDay] = useState(4)
  const [hasResult, setHasResult] = useState(false)

  const range = PROTEIN_RANGES[goal][trainingStatus]
  // Rationale is locale-driven
  const rationale =
    (
      t('protein-calculator.rationale', { returnObjects: true }) as unknown as Record<
        Goal,
        Record<TrainingStatus, string>
      >
    )[goal]?.[trainingStatus] ?? ''

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

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={t('protein-calculator.seo.title')}
        description={t('protein-calculator.seo.description')}
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
            <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
              <Link to="/" className="hover:text-neutral-700 transition-colors">
                CalculEat
              </Link>
              <span>/</span>
              <Link
                to={t('protein-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors"
              >
                {t('protein-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700">
                {t('protein-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('protein-calculator.h1Prefix')}
              </span>{' '}
              {t('protein-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              {t('protein-calculator.intro')}
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
                  {t('protein-calculator.calculator.header')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('protein-calculator.calculator.weightLabel')}
                  </label>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('protein-calculator.calculator.goalLabel')}
                  </label>
                  <div className="space-y-2">
                    {goals.map(({ value, label, description }) => (
                      <button
                        key={value}
                        onClick={() => setGoal(value)}
                        className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                          goal === value
                            ? GOAL_RING_COLORS[value]
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${goal === value ? GOAL_RINGS[value] : 'border-neutral-300 bg-white'}`}
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
                    {t('protein-calculator.calculator.trainingLabel')}
                  </label>
                  <div className="space-y-2">
                    {trainingStatuses.map(({ value, label, description }) => (
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
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${trainingStatus === value ? 'border-primary-500 bg-primary-500' : 'border-neutral-300 bg-white'}`}
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
                    {t('protein-calculator.calculator.trainingNote')}
                  </p>
                </div>

                {/* Meals per day */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('protein-calculator.calculator.mealsLabel')}
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
                    {t('protein-calculator.calculator.mealsNote')}
                  </p>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={!result}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  {t('protein-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">
                    {t('protein-calculator.calculator.resultsTitle')}
                  </h2>

                  {/* Main result */}
                  <div className={`rounded-xl ${GOAL_BG[goal]} p-5 text-center`}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {result.minTotal}–{result.maxTotal} g
                    </div>
                    <div className="text-sm text-white/80">
                      {t('protein-calculator.calculator.perDaySub')}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {result.minPerKg.toFixed(1)}–{result.maxPerKg.toFixed(1)}{' '}
                      {t('protein-calculator.calculator.perKgSub')}
                    </div>
                  </div>

                  {/* Plan breakdown */}
                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="text-sm font-medium text-neutral-800 mb-3">
                      {t('protein-calculator.calculator.breakdownTitle')}
                    </div>
                    <div className="space-y-2 text-sm text-neutral-700">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">
                          {t('protein-calculator.calculator.dailyRangeRow')}
                        </span>
                        <span className="font-medium">
                          {result.minTotal}–{result.maxTotal} g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">
                          {t('protein-calculator.calculator.recommendedRow')}
                        </span>
                        <span className={`font-bold ${GOAL_COLORS[goal]}`}>
                          {result.midTotal} g/dag
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                        <span className="text-neutral-500">
                          {t('protein-calculator.calculator.perMealRowTemplate').replace(
                            '{{n}}',
                            String(mealsPerDay)
                          )}
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
                      {t('protein-calculator.calculator.rationaleTitle')}
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{rationale}</p>
                  </div>

                  {/* Cross-links to relevant calculators */}
                  <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4">
                    <p className="text-xs font-medium text-neutral-700 mb-2">
                      {t('protein-calculator.calculator.nextStepTitle')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {goal === 'cut' && (
                        <>
                          <Link
                            to={relatedCalcs[1]?.href ?? '/kalkylatorer/cut-kalkylator'}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {relatedCalcs[1]?.label}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Link
                            to={relatedCalcs[3]?.href ?? '/kalkylatorer/kaloriunderskott'}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                          >
                            {relatedCalcs[3]?.label}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </>
                      )}
                      {goal === 'bulk' && (
                        <Link
                          to={relatedCalcs[2]?.href ?? '/kalkylatorer/bulk-kalkylator'}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {relatedCalcs[2]?.label}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      <Link
                        to={relatedCalcs[0]?.href ?? '/kalkylatorer/tdee-kalkylator'}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                      >
                        {relatedCalcs[0]?.label}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <GuestOnly>
                    <div className="rounded-xl bg-white border border-primary-200 p-4">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        {t('protein-calculator.calculator.saveCtaTitle')}
                      </p>
                      <p className="text-xs text-neutral-500 mb-3">
                        {t('protein-calculator.calculator.saveCtaBody')}
                      </p>
                      <Link
                        to="/register"
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {t('protein-calculator.calculator.saveCtaButton')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-0.5">
                        <p className="font-medium text-neutral-700 mb-1">
                          {t('protein-calculator.calculator.featuresTitle')}
                        </p>
                        {ctaFeatures.map(f => (
                          <p key={f}>✓ {f}</p>
                        ))}
                        <p className="text-neutral-400 mt-1.5 italic">
                          {t('protein-calculator.calculator.premium')}
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
                {t('protein-calculator.explanation.h2_1')}
              </h2>
              <p>{t('protein-calculator.explanation.p_1')}</p>
              <ul className="space-y-3 pl-4 list-disc">
                {(
                  t('protein-calculator.explanation.list_1', { returnObjects: true }) as string[]
                ).map((item, i) => {
                  const colonIdx = item.indexOf(':')
                  const bold = item.substring(2, colonIdx - 2)
                  const rest = item.substring(colonIdx + 2)
                  return (
                    <li key={i}>
                      <strong>{bold}:</strong> {rest}
                    </li>
                  )
                })}
              </ul>

              {/* Reference table */}
              <div className="overflow-x-auto rounded-xl border border-neutral-200 mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100 text-left">
                      {(
                        t('protein-calculator.explanation.table_headers', {
                          returnObjects: true,
                        }) as string[]
                      ).map((header, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 font-semibold text-neutral-700 border-b border-neutral-200"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      t('protein-calculator.explanation.table_rows', {
                        returnObjects: true,
                      }) as { label: string; cols: string[] }[]
                    ).map((row, ri) => (
                      <tr key={ri} className={ri < 2 ? 'border-b border-neutral-100' : ''}>
                        <td className="px-4 py-3 font-medium text-neutral-700 bg-neutral-50">
                          {row.label}
                        </td>
                        {row.cols.map((col, ci) => (
                          <td key={ci} className="px-4 py-3 text-neutral-600">
                            {col}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                {t('protein-calculator.explanation.table_note')}
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                {t('protein-calculator.explanation.h2_2')}
              </h2>
              <p>{t('protein-calculator.explanation.p_2')}</p>
              <p>{t('protein-calculator.explanation.p_3')}</p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                {t('protein-calculator.explanation.h2_3')}
              </h2>
              <p>{t('protein-calculator.explanation.p_4')}</p>
              <p>{t('protein-calculator.explanation.p_5')}</p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                {t('protein-calculator.explanation.h2_4')}
              </h2>
              <p>{t('protein-calculator.explanation.p_6')}</p>
              <ul className="space-y-1.5 pl-4 list-disc">
                {(
                  t('protein-calculator.explanation.list_2', { returnObjects: true }) as string[]
                ).map((item, i) => {
                  const colonIdx = item.indexOf(':')
                  const bold = item.substring(2, colonIdx - 2)
                  const rest = item.substring(colonIdx + 2)
                  return (
                    <li key={i}>
                      <strong>{bold}:</strong>
                      {rest}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('protein-calculator.faqTitle')} />
          </div>
        </section>

        {/* Sources */}
        <section className="bg-white py-10 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Källor
            </h2>
            <ol className="space-y-1">
              {[
                {
                  text: 'Phillips SM, Van Loon LJC. Dietary protein for athletes: From requirements to optimum adaptation. J Sports Sci. 2011;29(sup1):S29–S38.',
                },
                {
                  text: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376–384.',
                },
                {
                  text: 'Stout JR, et al. (ISSN). International Society of Sports Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.',
                },
                {
                  text: 'WHO. Protein and amino acid requirements in human nutrition. WHO Technical Report Series 935. Geneva: World Health Organization; 2007.',
                },
              ].map((s, i) => (
                <li key={i} className="text-sm text-neutral-600">
                  [{i + 1}] {s.text}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('protein-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                {t('protein-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('protein-calculator.cta.bottom.primary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[0]?.href ?? '/kalkylatorer'}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('protein-calculator.cta.bottom.secondary')}
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
                  {t('protein-calculator.related.calculatorsTitle')}
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
                  {t('protein-calculator.related.articlesTitle')}
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
