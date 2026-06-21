import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'

type CtaLink = { href: string; label: string }

const pageConfig = getPageConfigByKey('about')!
const hreflangAlternates = getHreflangAlternates(pageConfig)

export default function OmOssPage() {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('pages-other', { lng })

  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const ctaLinks = t('about.cta.links', { returnObjects: true }) as unknown as CtaLink[]

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: t('about.schema.pageName'),
    url: localeEntry.canonical,
    description: t('about.schema.pageDescription'),
    publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  }

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CalculEat',
    url: 'https://calculeat.se',
    description: t('about.schema.orgDescription'),
    sameAs: [],
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Seo
        title={t('about.seo.title')}
        description={t('about.seo.description')}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
      />
      <JsonLd schema={[pageSchema, orgSchema]} />

      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
            <Link to="/" className="hover:text-neutral-700 transition-colors">
              CalculEat
            </Link>
            <span>/</span>
            <span className="text-neutral-700">{t('about.breadcrumb')}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">{t('about.h1')}</h1>

          <p className="text-lg text-neutral-600 leading-relaxed mb-10">{t('about.intro')}</p>

          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('about.sections.whatIs.h2')}
              </h2>
              <p className="text-neutral-600 leading-relaxed">{t('about.sections.whatIs.body')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('about.sections.methodology.h2')}
              </h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  <strong>{t('about.sections.methodology.calculatorsLabel')}</strong>{' '}
                  {t('about.sections.methodology.calculatorsBody')}
                </p>
                <p>
                  <strong>{t('about.sections.methodology.databaseLabel')}</strong>{' '}
                  {t('about.sections.methodology.databaseBody')}
                </p>
                <p>
                  <strong>{t('about.sections.methodology.contentLabel')}</strong>{' '}
                  {t('about.sections.methodology.contentBody')}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('about.sections.limitations.h2')}
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                {t('about.sections.limitations.body1')}
              </p>
              <p className="mt-3 text-neutral-600 leading-relaxed">
                {t('about.sections.limitations.body2')}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                {t('about.sections.contact.h2')}
              </h2>
              <p className="text-neutral-600">
                {t('about.sections.contact.body')}{' '}
                <a href="mailto:kontakt@calculeat.se" className="text-primary-600 hover:underline">
                  kontakt@calculeat.se
                </a>
                .
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">{t('about.cta.h2')}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ctaLinks.map(l => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
