import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

interface LegalSection {
  h2: string
  body: string
}

interface LegalPageProps {
  /** pages.ts-nyckel och i18n-prefix i pages-other: 'terms' | 'privacy' */
  pageKey: 'terms' | 'privacy'
}

/**
 * Gemensam mall för juridiksidorna (/villkor, /integritetspolicy).
 * Innehållet är UTKAST skrivna för Calculeat — granska innan skarp
 * lansering; detta är inte juridisk rådgivning.
 */
export default function LegalPage({ pageKey }: LegalPageProps) {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-other', { lng })

  const pageConfig = getPageConfigByKey(pageKey)!
  const hreflangAlternates = getHreflangAlternates(pageConfig)
  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!

  const sections = t(`${pageKey}.sections`, { returnObjects: true }) as unknown as LegalSection[]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-850">
      <Seo
        title={t(`${pageKey}.seo.title`)}
        description={t(`${pageKey}.seo.description`)}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8 dark:text-neutral-400">
            <Link
              to="/"
              className="hover:text-neutral-700 transition-colors dark:hover:text-neutral-200"
            >
              Calculeat
            </Link>
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-200">
              {t(`${pageKey}.breadcrumb`)}
            </span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2 dark:text-neutral-100">
            {t(`${pageKey}.h1`)}
          </h1>
          <p className="text-sm text-neutral-400 mb-6 dark:text-neutral-500">
            {t(`${pageKey}.updated`)}
          </p>

          <p className="text-lg text-neutral-600 leading-relaxed mb-10 dark:text-neutral-400">
            {t(`${pageKey}.intro`)}
          </p>

          <section className="space-y-8">
            {sections.map(section => (
              <div key={section.h2}>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3 dark:text-neutral-100">
                  {section.h2}
                </h2>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line dark:text-neutral-400">
                  {section.body}
                </p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
