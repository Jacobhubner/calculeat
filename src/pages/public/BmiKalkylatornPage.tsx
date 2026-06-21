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

interface BmiCategory {
  label: string
  range: string
  color: string
  bg: string
}

function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5)
    return {
      label: 'Undervikt',
      range: '< 18.5',
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
    }
  if (bmi < 25)
    return {
      label: 'Normalvikt',
      range: '18.5 – 24.9',
      color: 'text-green-700',
      bg: 'bg-green-50 border-green-200',
    }
  if (bmi < 30)
    return {
      label: 'Övervikt',
      range: '25 – 29.9',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-200',
    }
  return { label: 'Fetma', range: '≥ 30', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
}

type FaqItem = { question: string; answer: string }
type BmiScaleRow = { range: string; label: string }

const pageConfig = getPageConfigByKey('bmi-calculator')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function BmiKalkylatornPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-tools', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('bmi-calculator.faq', { returnObjects: true }) as unknown as FaqItem[]
  const bmiScale = t('bmi-calculator.bmiScale', { returnObjects: true }) as unknown as BmiScaleRow[]
  const bmiLabels = t('bmi-calculator.categoryLabels', {
    returnObjects: true,
  }) as unknown as Record<string, string>
  const relatedCalcs = t('bmi-calculator.related.calculators', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]
  const relatedArticles = t('bmi-calculator.related.articles', {
    returnObjects: true,
  }) as unknown as { href: string; label: string }[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('bmi-calculator.schema.webAppName'),
      url: localeEntry.canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: t('bmi-calculator.schema.webAppDescription'),
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
          name: t('bmi-calculator.schema.breadcrumb.hubLabel'),
          item: `https://calculeat.se${t('bmi-calculator.schema.breadcrumb.hubPath')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('bmi-calculator.schema.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const bmi = useMemo(() => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    if (!w || !h || w <= 0 || h <= 0) return null
    return w / ((h / 100) * (h / 100))
  }, [weight, height])

  const category = useMemo(() => (bmi ? getBmiCategory(bmi) : null), [bmi])

  const handleCalculate = () => {
    if (bmi) setHasResult(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={t('bmi-calculator.seo.title')}
        description={t('bmi-calculator.seo.description')}
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
                to={t('bmi-calculator.schema.breadcrumb.hubPath')}
                className="hover:text-neutral-700 transition-colors"
              >
                {t('bmi-calculator.schema.breadcrumb.hubLabel')}
              </Link>
              <span>/</span>
              <span className="text-neutral-700">
                {t('bmi-calculator.schema.breadcrumb.pageLabel')}
              </span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                {t('bmi-calculator.h1Prefix')}
              </span>{' '}
              {t('bmi-calculator.h1Suffix')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
              {t('bmi-calculator.intro')}
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
                  {t('bmi-calculator.calculator.header')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: t('bmi-calculator.calculator.weightLabel'),
                      unit: 'kg',
                      value: weight,
                      setter: setWeight,
                      placeholder: '75',
                    },
                    {
                      label: t('bmi-calculator.calculator.heightLabel'),
                      unit: 'cm',
                      value: height,
                      setter: setHeight,
                      placeholder: '175',
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

                <button
                  onClick={handleCalculate}
                  disabled={!bmi}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  {t('bmi-calculator.calculator.button')}
                </button>
              </div>

              {/* Results */}
              {hasResult && bmi && category && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-6 space-y-4">
                  <h2 className="font-semibold text-neutral-800">
                    {t('bmi-calculator.calculator.resultsTitle')}
                  </h2>

                  <div className={`rounded-xl border p-5 flex items-center gap-5 ${category.bg}`}>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${category.color}`}>{bmi.toFixed(1)}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">BMI</div>
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${category.color}`}>
                        {bmiLabels[category.label] ?? category.label}
                      </div>
                      <div className="text-sm text-neutral-600">BMI {category.range}</div>
                    </div>
                  </div>

                  {/* BMI scale */}
                  <div className="rounded-lg bg-white border border-neutral-200 p-4">
                    <div className="text-xs font-medium text-neutral-500 mb-2">
                      {t('bmi-calculator.calculator.bmiScaleTitle')}
                    </div>
                    <div className="space-y-1.5">
                      {bmiScale.map((row, i) => {
                        const colors = [
                          'bg-blue-400',
                          'bg-green-400',
                          'bg-yellow-400',
                          'bg-red-400',
                        ]
                        return (
                          <div key={row.range} className="flex items-center gap-3 text-xs">
                            <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${colors[i]}`} />
                            <span className="text-neutral-500 w-24">{row.range}</span>
                            <span className="text-neutral-700">{row.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Warning box */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        {t('bmi-calculator.calculator.warningTitle')}
                      </p>
                      <p className="text-xs text-amber-700">
                        {t('bmi-calculator.calculator.warningBody')}
                      </p>
                    </div>
                  </div>

                  {/* CTA to money page */}
                  <div className="rounded-xl bg-white border border-primary-200 p-4">
                    <p className="text-sm font-medium text-neutral-800 mb-1">
                      {t('bmi-calculator.calculator.ctaTitle')}
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      {t('bmi-calculator.calculator.ctaBody')}
                    </p>
                    <Link
                      to={t('bmi-calculator.schema.breadcrumb.hubPath')}
                      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {t('bmi-calculator.calculator.ctaButton')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Explanation section — prose stays in TSX */}
        <section className="bg-white py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-4 text-neutral-700 text-base leading-relaxed">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                Vad är BMI och hur räknar man?
              </h2>
              <p>
                BMI beräknas med formeln: <strong>BMI = vikt (kg) ÷ längd² (m²)</strong>.
              </p>
              <p>
                Det är ett enkelt screeningverktyg som WHO använder för att klassificera vikt på
                befolkningsnivå. Det är <em>inte</em> ett diagnostiskt verktyg — det räcker inte
                ensamt för att bedöma hälsorisk på individnivå.
              </p>
              <h3 className="text-lg font-semibold text-neutral-800 mt-4">Begränsningar med BMI</h3>
              <ul className="space-y-1.5 pl-4 list-disc">
                <li>
                  Tar inte hänsyn till muskelmassa — muskulösa personer kan hamna i
                  &ldquo;övervikt&rdquo;
                </li>
                <li>Skiljer inte på fett och muskler</li>
                <li>Tar inte hänsyn till var fettet sitter (bukfetma vs. underhudsfett)</li>
                <li>Kan vara missvisande för äldre (lägre muskelmassa)</li>
                <li>Gäller inte direkt för barn</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <FaqBlock items={faqItems} title={t('bmi-calculator.faqTitle')} />
          </div>
        </section>

        {/* Bottom CTA */}
        <GuestOnly>
          <section className="bg-neutral-900 py-16 md:py-20">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('bmi-calculator.cta.bottom.h2')}
              </h2>
              <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
                {t('bmi-calculator.cta.bottom.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bmi-calculator.cta.bottom.primary')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={relatedCalcs[0]?.href ?? t('bmi-calculator.schema.breadcrumb.hubPath')}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bmi-calculator.cta.bottom.secondary')}
                </Link>
              </div>
            </div>
          </section>
        </GuestOnly>

        {/* Related links */}
        <section className="bg-white py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid sm:grid-cols-2 gap-10">
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  {t('bmi-calculator.related.calculatorsTitle')}
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
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  {t('bmi-calculator.related.articlesTitle')}
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
