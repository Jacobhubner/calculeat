import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Calculator, Info } from 'lucide-react'
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

type ActivityLevelConfig = { value: ActivityLevel; label: string; description: string }
type FaqItem = { question: string; answer: string }

const PAL_MULTIPLIERS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
  'Extremely active': 1.9,
}

const pageConfig = getPageConfigByKey('tdee-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function TdeeKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const activityLevels = t('tdee-calculator.activityLevels', {
    returnObjects: true,
  }) as unknown as ActivityLevelConfig[]
  const faqItems = t('tdee-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const relatedCalcs = t('tdee-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('tdee-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const ctaFeatures = t('tdee-calculator.cta.gated.features', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('tdee-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('tdee-calculator.schema.webAppDescription'),
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
          name: t('tdee-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.com${t('tdee-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('tdee-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | 'other'>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Moderately active')
  const [hasResult, setHasResult] = useState(false)

  const bmr = useMemo(() => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)
    if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0 || gender === 'other') return null
    return mifflinStJeor({ weight: w, height: h, age: a, gender })
  }, [weight, height, age, gender])

  const tdee = useMemo(() => {
    if (!bmr || gender === 'other') return null
    return Math.round(bmr * PAL_MULTIPLIERS[activityLevel])
  }, [bmr, gender, activityLevel])

  const cutTarget = tdee ? Math.round(tdee - 400) : null
  const bulkTarget = tdee ? Math.round(tdee + 300) : null

  const handleCalculate = () => {
    if (bmr && tdee) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={t('tdee-calculator.seo.title')}
        description={t('tdee-calculator.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <JsonLd schema={pageSchema} />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-white border-b border-neutral-100 dark:bg-neutral-850">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(37,189,0,0.07),transparent_60%)]" />
          <div className="relative container mx-auto px-4 pt-16 pb-14 max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8 dark:text-neutral-400">
              <Link
                to="/"
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                Calculeat
              </Link>
              <span>/</span>
              <Link
                to={t('tdee-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                {t('tdee-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-200">
                {t('tdee-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight dark:text-neutral-100">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('tdee-calculator.h1Prefix')}
              </span>{' '}
              {t('tdee-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl dark:text-neutral-400">
              {t('tdee-calculator.intro')}
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100 dark:bg-neutral-900">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden bg-white dark:border-neutral-700 dark:bg-neutral-850">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex items-center gap-2 dark:bg-primary-900/25">
                <Calculator className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                <span className="font-semibold text-primary-900 dark:text-primary-300">
                  {t('tdee-calculator.calculator.header')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-200">
                    {t('tdee-calculator.calculator.genderLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: 'male', label: t('tdee-calculator.calculator.genderMale') },
                        { value: 'female', label: t('tdee-calculator.calculator.genderFemale') },
                        { value: 'other', label: t('tdee-calculator.calculator.genderOther') },
                      ] as { value: Gender | 'other'; label: string }[]
                    ).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setGender(opt.value)
                          setHasResult(false)
                        }}
                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          gender === opt.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {gender === 'other' && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 dark:bg-amber-900/25 dark:border-amber-800">
                      <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-300" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        {t('tdee-calculator.calculator.genderError')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Age, Weight, Height */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: t('tdee-calculator.calculator.ageLabel'),
                      unit: t('tdee-calculator.calculator.ageUnit'),
                      value: age,
                      setter: setAge,
                      placeholder: '30',
                    },
                    {
                      label: t('tdee-calculator.calculator.weightLabel'),
                      unit: 'kg',
                      value: weight,
                      setter: setWeight,
                      placeholder: '75',
                    },
                    {
                      label: t('tdee-calculator.calculator.heightLabel'),
                      unit: 'cm',
                      value: height,
                      setter: setHeight,
                      placeholder: '175',
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

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-200">
                    {t('tdee-calculator.calculator.activityLabel')}
                  </label>
                  <div className="space-y-2">
                    {activityLevels.map(({ value, label, description }) => (
                      <button
                        key={value}
                        onClick={() => setActivityLevel(value)}
                        className={`w-full flex items-start gap-3 py-2.5 px-4 rounded-lg border text-left transition-colors ${
                          activityLevel === value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/25'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-850'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                            activityLevel === value
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-850'
                          }`}
                        />
                        <div>
                          <div
                            className={`text-sm font-medium ${activityLevel === value ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-800 dark:text-neutral-200'}`}
                          >
                            {label}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {description}
                          </div>
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
                  {t('tdee-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && tdee && bmr && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 dark:bg-neutral-900">
                  <h2 className="font-semibold text-neutral-800 mb-4 dark:text-neutral-200">
                    {t('tdee-calculator.calculator.resultsTitle')}
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-xl bg-white border border-neutral-200 p-4 text-center dark:border-neutral-700 dark:bg-neutral-850">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                        {Math.round(bmr)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">
                        {t('tdee-calculator.calculator.bmrLabel')}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500">
                        {t('tdee-calculator.calculator.bmrSub')}
                      </div>
                    </div>
                    <div className="rounded-xl bg-primary-600 p-4 text-center">
                      <div className="text-2xl font-bold text-white">{tdee}</div>
                      <div className="text-xs text-primary-200 mt-0.5">
                        {t('tdee-calculator.calculator.tdeeLabel')}
                      </div>
                      <div className="text-xs text-primary-300">
                        {t('tdee-calculator.calculator.tdeeSub')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-primary-50 border border-primary-100 p-3 text-center dark:bg-primary-900/25">
                      <div className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                        {cutTarget}
                      </div>
                      <div className="text-xs text-primary-600 dark:text-primary-300">
                        {t('tdee-calculator.calculator.cutLabel')}
                      </div>
                      <div className="text-xs text-primary-400">
                        {t('tdee-calculator.calculator.cutSub')}
                      </div>
                    </div>
                    <div className="rounded-lg bg-accent-50 border border-accent-100 p-3 text-center dark:bg-accent-900/25">
                      <div className="text-lg font-semibold text-accent-700 dark:text-accent-300">
                        {bulkTarget}
                      </div>
                      <div className="text-xs text-accent-600 dark:text-accent-300">
                        {t('tdee-calculator.calculator.bulkLabel')}
                      </div>
                      <div className="text-xs text-accent-400">
                        {t('tdee-calculator.calculator.bulkSub')}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 text-center mb-2 dark:text-neutral-500">
                    {t('tdee-calculator.calculator.formulaNote')}
                  </p>
                  <p className="text-xs text-neutral-400 text-center mb-4 dark:text-neutral-500">
                    {t('tdee-calculator.calculator.adjustNote')}
                  </p>

                  <GuestOnly>
                    {/* Gated CTA */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-850">
                      <p className="text-sm font-bold text-neutral-900 mb-1 dark:text-neutral-100">
                        {t('tdee-calculator.cta.gated.title')}
                      </p>
                      <p className="text-xs text-neutral-600 mb-4 dark:text-neutral-400">
                        {t('tdee-calculator.cta.gated.body')}
                      </p>
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm w-full sm:w-auto"
                      >
                        {t('tdee-calculator.cta.gated.button')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                        {t('tdee-calculator.cta.gated.subtext')}
                      </p>
                      <div className="mt-3 text-left text-xs space-y-0.5 border-t border-neutral-100 pt-3">
                        <p className="text-neutral-500 font-medium mb-1 dark:text-neutral-400">
                          {t('tdee-calculator.cta.gated.featuresTitle')}
                        </p>
                        {ctaFeatures.map(f => (
                          <p key={f} className="text-neutral-500 dark:text-neutral-400">
                            ✓ {f}
                          </p>
                        ))}
                        <p className="text-neutral-400 mt-1.5 italic dark:text-neutral-500">
                          {t('tdee-calculator.cta.gated.premium')}
                        </p>
                      </div>
                    </div>
                  </GuestOnly>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Explanation */}
        <section className="bg-white py-14 border-b border-neutral-100 dark:bg-neutral-850">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-6 text-neutral-700 leading-relaxed dark:text-neutral-200">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t('tdee-calculator.explanation.h2_1')}
              </h2>
              <p className="text-base">{t('tdee-calculator.explanation.p_1')}</p>
              <ul className="space-y-3 pl-4 list-disc text-base">
                {(t('tdee-calculator.explanation.list_1', { returnObjects: true }) as string[]).map(
                  (item, i) => {
                    const colonIdx = item.indexOf(': ')
                    const bold = item.substring(0, colonIdx)
                    const rest = item.substring(colonIdx + 2)
                    return (
                      <li key={i}>
                        <strong>{bold}:</strong> {rest}
                      </li>
                    )
                  }
                )}
              </ul>
              <p className="text-base">{t('tdee-calculator.explanation.p_2')}</p>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-4 dark:text-neutral-100">
                {t('tdee-calculator.explanation.h2_2')}
              </h2>
              <p className="text-base">{t('tdee-calculator.explanation.p_3')}</p>
              <ul className="space-y-3 pl-4 list-disc text-base">
                {(t('tdee-calculator.explanation.list_2', { returnObjects: true }) as string[]).map(
                  (item, i) => {
                    const colonIdx = item.indexOf(': ')
                    const bold = item.substring(0, colonIdx)
                    const rest = item.substring(colonIdx + 2)
                    return (
                      <li key={i}>
                        <strong>{bold}:</strong> {rest}
                      </li>
                    )
                  }
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100 dark:bg-neutral-900">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('tdee-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('tdee-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto dark:text-neutral-500">
                {t('tdee-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('tdee-calculator.cta.bottom.primary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[0]?.href ?? '/kalkylatorer/kaloriunderskott'}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('tdee-calculator.cta.bottom.secondary')}
                </Link>
              </div>
            </div>
          </section>
        </GuestOnly>

        {/* Related */}
        <section className="bg-white py-14 dark:bg-neutral-850">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid sm:grid-cols-2 gap-10">
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 dark:text-neutral-400">
                  {t('tdee-calculator.related.calculatorsTitle')}
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
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 dark:text-neutral-400">
                  {t('tdee-calculator.related.articlesTitle')}
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
