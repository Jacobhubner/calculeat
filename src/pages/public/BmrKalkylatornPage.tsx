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
import { mifflinStJeor, revisedHarrisBenedict } from '@/lib/calculations/bmr'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type Gender = 'male' | 'female'
type FaqItem = { question: string; answer: string }
type PalLevel = { label: string; description: string }

// Multipliers stay in TSX — pure calculation constants
const PAL_MULTIPLIERS = [1.2, 1.375, 1.55, 1.725, 1.9] as const

const pageConfig = getPageConfigByKey('bmr-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BmrKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bmr-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const palLevels = t('bmr-calculator.palLevels', { returnObjects: true }) as unknown as PalLevel[]
  const relatedCalcs = t('bmr-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('bmr-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('bmr-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('bmr-calculator.schema.webAppDescription'),
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
          name: t('bmr-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.com${t('bmr-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('bmr-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const resetResult = () => setHasResult(false)

  const result = useMemo(() => {
    const a = parseFloat(age)
    const w = parseFloat(weight)
    const h = parseFloat(height)
    if (!a || !w || !h || a < 10 || a > 120 || w <= 0 || h < 100 || h > 250) return null

    const params = { age: a, weight: w, height: h, gender }
    const bmrMifflin = mifflinStJeor(params)
    const bmrHarris = revisedHarrisBenedict(params)
    if (!bmrMifflin) return null

    const tdeeEstimates = PAL_MULTIPLIERS.map((multiplier, i) => ({
      multiplier,
      label: palLevels[i]?.label ?? '',
      description: palLevels[i]?.description ?? '',
      tdee: Math.round(bmrMifflin * multiplier),
    }))

    return {
      bmr: Math.round(bmrMifflin),
      bmrHarris: bmrHarris ? Math.round(bmrHarris) : null,
      tdeeEstimates,
    }
  }, [age, weight, height, gender, palLevels])

  const handleCalculate = () => {
    if (result) setHasResult(true)
  }

  const tdeeLocale = lng === 'en' ? 'en-US' : 'sv-SE'

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={t('bmr-calculator.seo.title')}
        description={t('bmr-calculator.seo.description')}
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
                to={t('bmr-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
              >
                {t('bmr-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-200">
                {t('bmr-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight dark:text-neutral-100">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('bmr-calculator.h1Prefix')}
              </span>{' '}
              {t('bmr-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl dark:text-neutral-400">
              {t('bmr-calculator.intro')}
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
                  {t('bmr-calculator.calculator.header')}
                </span>
                <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
                  {t('bmr-calculator.calculator.formulaLabel')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-200">
                    {t('bmr-calculator.calculator.genderLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'male', label: t('bmr-calculator.calculator.genderMale') },
                        { value: 'female', label: t('bmr-calculator.calculator.genderFemale') },
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
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-200">
                    {t('bmr-calculator.calculator.ageLabel')}
                  </label>
                  <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 max-w-40 dark:border-neutral-700">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={e => {
                        setAge(e.target.value)
                        resetResult()
                      }}
                      onFocus={e => e.target.select()}
                      placeholder="30"
                      className="flex-1 px-3 py-2.5 text-sm text-neutral-900 bg-white outline-none min-w-0 dark:bg-neutral-850 dark:text-neutral-100"
                    />
                    <span className="px-2 text-xs text-neutral-400 bg-neutral-50 border-l border-neutral-200 py-2.5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
                      {t('bmr-calculator.calculator.ageUnit')}
                    </span>
                  </div>
                </div>

                {/* Weight + Height */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: t('bmr-calculator.calculator.weightLabel'),
                      unit: 'kg',
                      value: weight,
                      setter: setWeight,
                      placeholder: '75',
                    },
                    {
                      label: t('bmr-calculator.calculator.heightLabel'),
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
                          onChange={e => {
                            setter(e.target.value)
                            resetResult()
                          }}
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
                  disabled={!result}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  {t('bmr-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && result && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4 dark:bg-neutral-900">
                  <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {t('bmr-calculator.calculator.resultsTitle')}
                  </h2>

                  {/* BMR card */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-850">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 dark:text-neutral-400">
                      {t('bmr-calculator.calculator.bmrCardLabel')}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-primary-600 dark:text-primary-300">
                        {result.bmr}
                      </span>
                      <span className="text-neutral-500 mb-1 dark:text-neutral-400">
                        {t('bmr-calculator.calculator.bmrUnit')}
                      </span>
                    </div>
                  </div>

                  {/* Key warning */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 dark:bg-amber-900/25 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-300" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1 dark:text-amber-300">
                        {t('bmr-calculator.calculator.warningTitle')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {t('bmr-calculator.calculator.warningBody')}
                      </p>
                    </div>
                  </div>

                  {/* TDEE preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2 dark:text-neutral-200">
                      {t('bmr-calculator.calculator.tdeePreviewTitle')}
                    </h3>
                    <div className="rounded-xl border border-neutral-200 overflow-hidden dark:border-neutral-700">
                      {result.tdeeEstimates.map((level, i) => (
                        <div
                          key={level.label}
                          className={`flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0 ${
                            i % 2 === 0 ? 'bg-white dark:bg-neutral-850' : 'bg-neutral-50/50'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                              {level.label}
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              {level.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {level.tdee.toLocaleString(tdeeLocale)} kcal
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              × {level.multiplier}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                      {t('bmr-calculator.calculator.tdeeNote')}
                    </p>
                  </div>

                  <GuestOnly>
                    {/* CTA to TDEE */}
                    <div className="rounded-xl bg-white border border-primary-200 p-4 dark:bg-neutral-850">
                      <p className="text-sm font-medium text-neutral-800 mb-1 dark:text-neutral-200">
                        {t('bmr-calculator.calculator.ctaTitle')}
                      </p>
                      <p className="text-xs text-neutral-500 mb-3 dark:text-neutral-400">
                        {t('bmr-calculator.calculator.ctaBody')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          to={
                            relatedCalcs[0]?.href ?? t('bmr-calculator.schema.breadcrumb.hubPath')
                          }
                          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          {t('bmr-calculator.calculator.ctaPrimary')}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/register"
                          className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
                        >
                          {t('bmr-calculator.calculator.ctaSecondary')}
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
                {t('bmr-calculator.explanation.h2_1')}
              </h2>
              <p>{t('bmr-calculator.explanation.p_1')}</p>
              <p>{t('bmr-calculator.explanation.p_2')}</p>

              <div className="rounded-2xl bg-primary-50 border border-primary-200 p-5 dark:bg-primary-900/25 dark:border-primary-800">
                <div className="font-semibold text-neutral-800 mb-3 dark:text-neutral-200">
                  {t('bmr-calculator.explanation.box_title')}
                </div>
                <div className="space-y-3">
                  {(
                    t('bmr-calculator.explanation.box_items', {
                      returnObjects: true,
                    }) as { title: string; desc: string }[]
                  ).map(({ title, desc }) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                      <div>
                        <div className="font-medium text-neutral-800 mb-0.5 dark:text-neutral-200">
                          {title}
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-400">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to={relatedCalcs[0]?.href ?? t('bmr-calculator.schema.breadcrumb.hubPath')}
                  className="inline-flex items-center gap-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  {t('bmr-calculator.explanation.box_link')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 pt-2 dark:text-neutral-100">
                {t('bmr-calculator.explanation.h2_2')}
              </h2>
              <p>{t('bmr-calculator.explanation.p_3')}</p>
              <div className="rounded-xl border border-neutral-200 overflow-hidden dark:border-neutral-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900">
                      {(
                        t('bmr-calculator.explanation.table_headers', {
                          returnObjects: true,
                        }) as string[]
                      ).map(header => (
                        <th
                          key={header}
                          className="text-left px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      t('bmr-calculator.explanation.table_rows', {
                        returnObjects: true,
                      }) as { name: string; strength: string; best: string }[]
                    ).map((row, i) => (
                      <tr
                        key={row.name}
                        className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white dark:bg-neutral-850' : 'bg-neutral-50/50'}`}
                      >
                        <td className="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">
                          {row.name}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                          {row.strength}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                          {row.best}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {t('bmr-calculator.explanation.note')}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100 dark:bg-neutral-900">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('bmr-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('bmr-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto dark:text-neutral-500">
                {t('bmr-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bmr-calculator.cta.bottom.primary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[0]?.href ?? t('bmr-calculator.schema.breadcrumb.hubPath')}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bmr-calculator.cta.bottom.secondary')}
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
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 dark:text-neutral-200">
                  {t('bmr-calculator.related.calculatorsTitle')}
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
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 dark:text-neutral-200">
                  {t('bmr-calculator.related.articlesTitle')}
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
