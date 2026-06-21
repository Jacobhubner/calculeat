import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Check, X, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqBlock } from '@/components/article/FaqBlock'
import { GuestOnly } from '@/components/GuestOnly'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import type { FaqItem } from '@/components/article/FaqBlock'

type CellType = 'yes' | 'no' | 'partial'
type RelatedLink = { href: string; label: string }
type LocaleRow = { feature: string; note: string | null }

function Cell({ type }: { type: CellType }) {
  if (type === 'yes')
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
        <Check className="h-3.5 w-3.5 text-green-700" />
      </span>
    )
  if (type === 'no')
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100">
        <X className="h-3.5 w-3.5 text-red-600" />
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100">
      <Minus className="h-3.5 w-3.5 text-yellow-600" />
    </span>
  )
}

// CellType values stay in TSX — not translatable content
const CELL_DATA: { lifesum: CellType; ce: CellType }[] = [
  { lifesum: 'yes', ce: 'yes' },
  { lifesum: 'yes', ce: 'partial' },
  { lifesum: 'yes', ce: 'no' },
  { lifesum: 'yes', ce: 'yes' },
  { lifesum: 'partial', ce: 'yes' },
  { lifesum: 'no', ce: 'yes' },
  { lifesum: 'no', ce: 'yes' },
  { lifesum: 'no', ce: 'yes' },
  { lifesum: 'no', ce: 'yes' },
  { lifesum: 'partial', ce: 'yes' },
  { lifesum: 'yes', ce: 'yes' },
  { lifesum: 'no', ce: 'yes' },
]

const pageConfig = getPageConfigByKey('lifesum-vs-calculeat')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function LifesumVsCalculEatPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-compare', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const faqItems = t('lifesum-vs-calculeat.faq', { returnObjects: true }) as unknown as FaqItem[]
  const localeRows = t('lifesum-vs-calculeat.comparisonRows', {
    returnObjects: true,
  }) as unknown as LocaleRow[]
  const relatedCalcs = t('lifesum-vs-calculeat.related.calculators', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const relatedArticles = t('lifesum-vs-calculeat.related.articles', {
    returnObjects: true,
  }) as unknown as RelatedLink[]
  const quickPoints = t('lifesum-vs-calculeat.quickAnswer.points', {
    returnObjects: true,
  }) as unknown as string[]

  const pageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t('lifesum-vs-calculeat.schema.headline'),
      description: t('lifesum-vs-calculeat.schema.description'),
      url: localeEntry.canonical,
      publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
      inLanguage: lng === 'en' ? 'en' : 'sv-SE',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'CalculEat', item: 'https://calculeat.se/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('lifesum-vs-calculeat.breadcrumb.comparisons'),
          item: `https://calculeat.se/${lng === 'en' ? 'en/compare' : 'jamfor'}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: t('lifesum-vs-calculeat.breadcrumb.pageLabel'),
          item: localeEntry.canonical,
        },
      ],
    },
  ]

  const calcHubHref = lng === 'en' ? '/en/calculators' : '/kalkylatorer'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title={t('lifesum-vs-calculeat.seo.title')}
        description={t('lifesum-vs-calculeat.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={pageSchema} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <Link to="/" className="hover:text-neutral-700 transition-colors">
              CalculEat
            </Link>
            <span>/</span>
            <span className="text-neutral-700">
              {t('lifesum-vs-calculeat.breadcrumb.comparisons')}
            </span>
            <span>/</span>
            <span className="text-neutral-700">
              {t('lifesum-vs-calculeat.breadcrumb.pageLabel')}
            </span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
            {t('lifesum-vs-calculeat.h1')}
          </h1>

          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">
              {t('lifesum-vs-calculeat.quickAnswer.label')}
            </p>
            <p className="text-sm font-semibold text-primary-900 mb-3">
              {t('lifesum-vs-calculeat.quickAnswer.verdict')}
            </p>
            <ul className="space-y-1.5 text-sm text-primary-800">
              {quickPoints.map(pt => (
                <li key={pt} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" /> {pt}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                to={calcHubHref}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                {t('lifesum-vs-calculeat.quickAnswer.ctaCalc')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <GuestOnly>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 border border-primary-300 text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-100 transition-colors text-sm"
                >
                  {t('lifesum-vs-calculeat.quickAnswer.ctaRegister')}
                </Link>
              </GuestOnly>
            </div>
          </div>

          <p className="text-base text-neutral-600 leading-relaxed mb-6">
            {t('lifesum-vs-calculeat.intro')}
          </p>

          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-900 mb-0.5">
                {t('lifesum-vs-calculeat.midPageCta.title')}
              </p>
              <p className="text-xs text-primary-700">
                {t('lifesum-vs-calculeat.midPageCta.body')}
              </p>
            </div>
            <Link
              to={calcHubHref}
              className="shrink-0 inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {t('lifesum-vs-calculeat.midPageCta.button')}
            </Link>
          </div>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              {t('lifesum-vs-calculeat.comparisonTable.h2')}
            </h2>
            <div className="rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-0 bg-neutral-50 border-b border-neutral-200">
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {t('lifesum-vs-calculeat.comparisonTable.colFeature')}
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center w-28">
                  {t('lifesum-vs-calculeat.comparisonTable.colOther')}
                </div>
                <div className="px-4 py-3 text-xs font-semibold text-primary-600 uppercase tracking-wider text-center w-28">
                  {t('lifesum-vs-calculeat.comparisonTable.colCalculEat')}
                </div>
              </div>
              {localeRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_auto_auto] gap-0 border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
                >
                  <div className="px-4 py-3">
                    <div className="text-sm text-neutral-800 font-medium">{row.feature}</div>
                    {row.note && <div className="text-xs text-neutral-400 mt-0.5">{row.note}</div>}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center w-28">
                    <Cell type={CELL_DATA[i]?.lifesum ?? 'no'} />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center w-28">
                    <Cell type={CELL_DATA[i]?.ce ?? 'no'} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                  <Check className="h-3 w-3 text-green-700" />
                </span>
                {t('lifesum-vs-calculeat.comparisonTable.legendYes')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100">
                  <Minus className="h-3 w-3 text-yellow-600" />
                </span>
                {t('lifesum-vs-calculeat.comparisonTable.legendPartial')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
                  <X className="h-3 w-3 text-red-600" />
                </span>
                {t('lifesum-vs-calculeat.comparisonTable.legendNo')}
              </span>
            </div>
          </section>

          {/* Article prose — stays in TSX */}
          <section className="space-y-5 text-neutral-700 text-sm leading-relaxed mb-8">
            <h2 className="text-xl font-semibold text-neutral-900">För vem passar Lifesum?</h2>
            <p>
              Lifesum är ett bra val om du vill ha struktur via ett färdigt program snarare än att
              räkna kalorier manuellt. Det passar dig som:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Vill ha ett färdigt kostprogram att följa (5:2, ketodiet, LCHF etc.)</li>
              <li>Föredrar recept och måltidsförslag framför fri loggning</li>
              <li>Inte primärt tränar med mål kring kroppskomposition</li>
              <li>Vill ha en helhetsapp för kost, hälsa och livsstil i en och samma plattform</li>
            </ul>
            <p>
              <strong>Begränsningen:</strong> Lifesums styrka är bredden — kostplaner, recept,
              hälsoinsikter. Men bredden innebär kompromisser i precision. TDEE-beräkningen är
              grundläggande, kalorimålet är statiskt och det saknas stöd för seriösa
              kroppskompositionsmål.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-2">
              För vem passar CalculEat?
            </h2>
            <p>
              CalculEat passar dig som vill att siffrorna faktiskt stämmer. Det är rätt app om du:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                Vill ha ett <strong>individuellt TDEE</strong> — inte ett populationsgenomsnitt
              </li>
              <li>
                Arbetar med{' '}
                <Link to="/kalkylatorer/cut-kalkylator" className="text-primary-600 underline">
                  cut
                </Link>
                {'/'}
                <Link to="/kalkylatorer/bulk-kalkylator" className="text-primary-600 underline">
                  bulk-cykler
                </Link>{' '}
                och behöver rätt kalorimål per fas
              </li>
              <li>
                Märker att loggningen inte ger förväntat resultat och vill ha{' '}
                <strong>metabolisk kalibrering</strong> — börja med att räkna ut ditt{' '}
                <Link to="/kalkylatorer/kaloriunderskott" className="text-primary-600 underline">
                  exakta kaloriunderskott
                </Link>
              </li>
              <li>
                Planerar eller håller på med en <strong>reverse diet</strong>
              </li>
              <li>Vill använda en gratis app utan att låsa upp allt via premium</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Kostprogram vs kroppskomposition
            </h2>
            <p>
              Lifesums modell är: ge användaren ett program att följa. CalculEats modell är: ge
              användaren rätt tal baserat på deras kropp och mål.
            </p>
            <p className="mt-2">
              Om du följer ett kostprogram och det fungerar för dig behöver du inte byta. Men om du
              märker att du loggat noggrant men inte ser resultat — eller att du inte vet{' '}
              <em>varför</em> vikten rör sig eller inte — är precision i TDEE-målet mer värdefullt
              än fler recept.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 pt-4">
              Tre saker Lifesum inte löser
            </h2>
            <div className="space-y-3 mt-3">
              {[
                {
                  title: 'Fel TDEE från start',
                  desc: 'Lifesums kalorimål baseras på en standardformel utan kalibrering. Om din metabolism avviker från genomsnittet — och det gör den — är kalorimålet fel från dag ett.',
                  color: 'bg-red-50 border-red-200',
                },
                {
                  title: 'Inga fasbyten',
                  desc: 'Ska du byta från cut till maintenance eller starta en bulk? Lifesum saknar inbyggt stöd för fasbyten. Du får manuellt räkna ut och ändra kalorimål — utan vägledning om rätt nivå.',
                  color: 'bg-orange-50 border-orange-200',
                },
                {
                  title: 'Kalorimålet uppdateras aldrig',
                  desc: 'Under en cut sjunker ditt TDEE i takt med att du tappar vikt. Lifesums kalorimål är statiskt — det du satte i vecka 1 gäller fortfarande i vecka 12, även om din kropp har förändrats.',
                  color: 'bg-yellow-50 border-yellow-200',
                },
              ].map(({ title, desc, color }) => (
                <div key={title} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-neutral-800 mb-1 text-sm">{title}</div>
                  <div className="text-sm text-neutral-700">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <FaqBlock items={faqItems} title={t('lifesum-vs-calculeat.faqTitle')} />

          <GuestOnly>
            <section className="mt-10 rounded-2xl bg-primary-600 p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-2">
                {t('lifesum-vs-calculeat.bottomCta.h2')}
              </h2>
              <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
                {t('lifesum-vs-calculeat.bottomCta.body')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm"
                >
                  {t('lifesum-vs-calculeat.bottomCta.primary')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={calcHubHref}
                  className="inline-flex items-center justify-center gap-2 border border-primary-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
                >
                  {t('lifesum-vs-calculeat.bottomCta.secondary')}
                </Link>
              </div>
            </section>
          </GuestOnly>

          <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                {t('lifesum-vs-calculeat.related.calculatorsTitle')}
              </h3>
              <ul className="space-y-2">
                {relatedCalcs.map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                {t('lifesum-vs-calculeat.related.articlesTitle')}
              </h3>
              <ul className="space-y-2">
                {relatedArticles.map(l => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
