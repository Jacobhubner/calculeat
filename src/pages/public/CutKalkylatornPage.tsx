import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Calculator, AlertTriangle, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { mifflinStJeor } from '@/lib/calculations/bmr'
import type { Gender } from '@/lib/types'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type ActivityLevel =
  | 'Sedentary'
  | 'Lightly active'
  | 'Moderately active'
  | 'Very active'
  | 'Extremely active'

type CutMode = 'mild' | 'moderate' | 'aggressive'

type FaqItem = { question: string; answer: string }
type ActivityLevelConfig = { value: ActivityLevel; label: string; description: string }
type CutModeConfig = { value: CutMode; label: string; weeklyLoss: string; description: string }

// Calculation constants stay in TSX
const PAL_MULTIPLIERS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
  'Extremely active': 1.9,
}

const CUT_DEFICITS: Record<CutMode, number> = {
  mild: 250,
  moderate: 400,
  aggressive: 700,
}

const CUT_COLORS: Record<CutMode, string> = {
  mild: 'border-blue-500 bg-blue-50',
  moderate: 'border-primary-500 bg-primary-50',
  aggressive: 'border-orange-500 bg-orange-50',
}

const CUT_RINGS: Record<CutMode, string> = {
  mild: 'border-blue-500 bg-blue-500',
  moderate: 'border-primary-500 bg-primary-500',
  aggressive: 'border-orange-500 bg-orange-500',
}

const pageConfig = getPageConfigByKey('cut-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function CutKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('cut-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const activityLevels = t('cut-calculator.activityLevels', {
    returnObjects: true,
  }) as unknown as ActivityLevelConfig[]
  const cutModes = t('cut-calculator.cutModes', {
    returnObjects: true,
  }) as unknown as CutModeConfig[]
  const ctaFeatures = t('cut-calculator.calculator.features', {
    returnObjects: true,
  }) as unknown as string[]
  const relatedCalcs = t('cut-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('cut-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('cut-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('cut-calculator.schema.webAppDescription'),
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
          name: t('cut-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.com${t('cut-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('cut-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Moderately active')
  const [cutMode, setCutMode] = useState<CutMode>('moderate')
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

  const deficit = CUT_DEFICITS[cutMode]
  const selectedModeConfig = cutModes.find(m => m.value === cutMode) ?? cutModes[1]
  const targetCalories = tdee ? Math.round(tdee - deficit) : null

  const w = parseFloat(weight)
  const proteinMin = w > 0 ? Math.round(w * 1.8) : null
  const proteinMax = w > 0 ? Math.round(w * 2.4) : null

  const handleCalculate = () => {
    if (bmr && tdee) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={t('cut-calculator.seo.title')}
        description={t('cut-calculator.seo.description')}
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
                Calculeat
              </Link>
              <span>/</span>
              <Link
                to={t('cut-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors"
              >
                {t('cut-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700">
                {t('cut-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('cut-calculator.h1Prefix')}
              </span>{' '}
              {t('cut-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              {t('cut-calculator.intro')}
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
                  {t('cut-calculator.calculator.header')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('cut-calculator.calculator.genderLabel')}
                  </label>
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
                        {g === 'male'
                          ? t('cut-calculator.calculator.genderMale')
                          : t('cut-calculator.calculator.genderFemale')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age, Weight, Height */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: t('cut-calculator.calculator.ageLabel'),
                      unit: t('cut-calculator.calculator.ageUnit'),
                      value: age,
                      setter: setAge,
                      placeholder: '28',
                    },
                    {
                      label: t('cut-calculator.calculator.weightLabel'),
                      unit: 'kg',
                      value: weight,
                      setter: setWeight,
                      placeholder: '80',
                    },
                    {
                      label: t('cut-calculator.calculator.heightLabel'),
                      unit: 'cm',
                      value: height,
                      setter: setHeight,
                      placeholder: '178',
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
                    {t('cut-calculator.calculator.activityLabel')}
                  </label>
                  <div className="space-y-2">
                    {activityLevels.map(({ value, label, description }) => (
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
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${activityLevel === value ? 'border-primary-500 bg-primary-500' : 'border-neutral-300 bg-white'}`}
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

                {/* Cut Mode */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('cut-calculator.calculator.strategyLabel')}
                  </label>
                  <div className="space-y-2">
                    {cutModes.map(({ value, label, weeklyLoss, description }) => (
                      <button
                        key={value}
                        onClick={() => setCutMode(value)}
                        className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                          cutMode === value
                            ? CUT_COLORS[value]
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${cutMode === value ? CUT_RINGS[value] : 'border-neutral-300 bg-white'}`}
                        />
                        <div>
                          <div className="text-sm font-medium text-neutral-800">
                            {label} — −{CUT_DEFICITS[value]} kcal/dag
                            <span className="ml-2 text-xs font-normal text-neutral-500">
                              {weeklyLoss}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">{description}</div>
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
                  {t('cut-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && tdee && bmr && targetCalories && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">
                    {t('cut-calculator.calculator.resultsTitle')}
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white border border-neutral-200 p-4 text-center">
                      <div className="text-2xl font-bold text-neutral-700">{tdee}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {t('cut-calculator.calculator.tdeeLabel')}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {t('cut-calculator.calculator.tdeeSub')}
                      </div>
                    </div>
                    <div className="rounded-xl bg-primary-600 p-4 text-center">
                      <div className="text-2xl font-bold text-white">{targetCalories}</div>
                      <div className="text-xs text-primary-200 mt-0.5">
                        {t('cut-calculator.calculator.cutTargetLabel')}
                      </div>
                      <div className="text-xs text-primary-300">−{deficit} kcal/dag</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-medium text-neutral-800">
                        {t('cut-calculator.calculator.planHeading')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-700">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">
                          {t('cut-calculator.calculator.maintenanceRow')}
                        </span>
                        <span className="font-medium">{tdee} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">
                          {t('cut-calculator.calculator.deficitRow')}
                        </span>
                        <span className="font-medium text-orange-600">−{deficit} kcal</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                        <span className="font-medium">
                          {t('cut-calculator.calculator.intakeRow')}
                        </span>
                        <span className="font-bold text-primary-600">{targetCalories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">
                          {t('cut-calculator.calculator.rateRow')}
                        </span>
                        <span className="font-medium">{selectedModeConfig?.weeklyLoss}</span>
                      </div>
                      {proteinMin && proteinMax && (
                        <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                          <span className="text-neutral-500">
                            {t('cut-calculator.calculator.proteinRow')}
                          </span>
                          <span className="font-medium">
                            {proteinMin}–{proteinMax} g/dag
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {cutMode === 'aggressive' && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          {t('cut-calculator.calculator.warningTitle')}
                        </p>
                        <p className="text-xs text-amber-700">
                          {t('cut-calculator.calculator.warningBodyTemplate').replace(
                            '{{proteinMax}}',
                            String(proteinMax ?? '')
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cross-link to bulk */}
                  <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        {t('cut-calculator.calculator.crossLinkTitle')}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {t('cut-calculator.calculator.crossLinkBody')}
                      </p>
                    </div>
                    <Link
                      to={relatedCalcs[0]?.href ?? '/kalkylatorer/bulk-kalkylator'}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                    >
                      {t('cut-calculator.calculator.crossLinkButton')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <GuestOnly>
                    <div className="rounded-xl bg-white border border-primary-200 p-4">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        {t('cut-calculator.calculator.saveCtaTitle')}
                      </p>
                      <p className="text-xs text-neutral-500 mb-3">
                        {t('cut-calculator.calculator.saveCtaBody')}
                      </p>
                      <Link
                        to="/register"
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {t('cut-calculator.calculator.saveCtaButton')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-0.5">
                        <p className="font-medium text-neutral-700 mb-1">
                          {t('cut-calculator.calculator.featuresTitle')}
                        </p>
                        {ctaFeatures.map(f => (
                          <p key={f}>✓ {f}</p>
                        ))}
                        <p className="text-neutral-400 mt-1.5 italic">
                          {t('cut-calculator.calculator.premium')}
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
                {t('cut-calculator.explanation.h2_1')}
              </h2>
              <p>{t('cut-calculator.explanation.p_1')}</p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                {t('cut-calculator.explanation.h2_2')}
              </h2>
              <p>{t('cut-calculator.explanation.p_2')}</p>
              <ul className="space-y-2 pl-4 list-disc">
                {(t('cut-calculator.explanation.list_1', { returnObjects: true }) as string[]).map(
                  (item, i) => {
                    const colonIdx = item.indexOf(':')
                    const bold = item.substring(2, colonIdx - 2)
                    const rest = item.substring(colonIdx + 2)
                    return (
                      <li key={i}>
                        <strong>{bold}:</strong> {rest}
                      </li>
                    )
                  }
                )}
              </ul>
              <p>{t('cut-calculator.explanation.p_3')}</p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4">
                {t('cut-calculator.explanation.h2_3')}
              </h2>
              <p>{t('cut-calculator.explanation.p_4')}</p>
              <p>{t('cut-calculator.explanation.p_5')}</p>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('cut-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('cut-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                {t('cut-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('cut-calculator.cta.bottom.primary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[1]?.href ?? '/kalkylatorer/proteinbehov'}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('cut-calculator.cta.bottom.secondary')}
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
                  {t('cut-calculator.related.calculatorsTitle')}
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
                  {t('cut-calculator.related.articlesTitle')}
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
