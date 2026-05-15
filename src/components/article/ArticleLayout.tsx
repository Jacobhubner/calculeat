import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import type { FaqItem } from './FaqBlock'
import { FaqBlock } from './FaqBlock'

interface RelatedLink {
  href: string
  label: string
}

interface Source {
  text: string
  url?: string
}

interface ArticleLayoutProps {
  children: React.ReactNode
  title: string
  intro: string
  faqItems?: FaqItem[]
  sources?: Source[]
  moneyPageHref?: string
  moneyPageLabel?: string
  relatedArticles?: RelatedLink[]
  relatedCalculators?: RelatedLink[]
  breadcrumb?: { label: string; href: string }[]
}

export function ArticleLayout({
  children,
  title,
  intro,
  faqItems,
  sources,
  moneyPageHref,
  moneyPageLabel,
  relatedArticles,
  relatedCalculators,
  breadcrumb,
}: ArticleLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-white border-b border-neutral-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(37,189,0,0.07),transparent_60%)]" />
          <div className="relative container mx-auto px-4 pt-16 pb-14 max-w-3xl">
            {/* Breadcrumb */}
            {breadcrumb && breadcrumb.length > 0 && (
              <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
                <Link to="/" className="hover:text-neutral-700 transition-colors">
                  CalculEat
                </Link>
                {breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span>/</span>
                    {i === breadcrumb.length - 1 ? (
                      <span className="text-neutral-700">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.href} className="hover:text-neutral-700 transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
              {title}
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">{intro}</p>
          </div>
        </section>

        {/* Article body */}
        <section className="bg-neutral-50 py-14 border-b border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <article className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed space-y-6 text-base">
              {children}
            </article>
          </div>
        </section>

        {/* Money page CTA */}
        {moneyPageHref && moneyPageLabel && (
          <section className="bg-white py-10 border-b border-neutral-100">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-primary-900 mb-1">{moneyPageLabel}</p>
                  <p className="text-sm text-primary-700">
                    Gratis att använda — inget konto krävs.
                  </p>
                </div>
                <Link
                  to={moneyPageHref}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
                >
                  Prova kalkylatorn
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {faqItems && faqItems.length > 0 && (
          <section className="bg-neutral-50 py-14 border-b border-neutral-100">
            <div className="container mx-auto px-4 max-w-3xl">
              <FaqBlock items={faqItems} />
            </div>
          </section>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <section className="bg-white py-10 border-b border-neutral-100">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Källor
              </h2>
              <ol className="space-y-1">
                {sources.map((s, i) => (
                  <li key={i} className="text-sm text-neutral-600">
                    [{i + 1}] {s.text}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Related content */}
        {((relatedArticles && relatedArticles.length > 0) ||
          (relatedCalculators && relatedCalculators.length > 0)) && (
          <section className="bg-white py-14">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid sm:grid-cols-2 gap-10">
                {relatedCalculators && relatedCalculators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                      Relaterade kalkylatorer
                    </h3>
                    <div className="grid gap-3">
                      {relatedCalculators.map((l, i) => (
                        <Link
                          key={i}
                          to={l.href}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all"
                        >
                          <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {relatedArticles && relatedArticles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                      Relaterade artiklar
                    </h3>
                    <div className="grid gap-3">
                      {relatedArticles.map((l, i) => (
                        <Link
                          key={i}
                          to={l.href}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 hover:shadow-md hover:border-primary-200 transition-all"
                        >
                          <ArrowRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="bg-neutral-900 py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Redo att omsätta kunskapen i praktiken?
            </h2>
            <p className="text-neutral-400 text-base mb-8 max-w-md mx-auto">
              Skapa ett gratis konto och börja logga mat mot dina kalorimål — automatiskt beräknade
              från ditt TDEE.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Skapa gratis konto
                <ArrowRight className="h-4 w-4" />
              </Link>
              {moneyPageHref && (
                <Link
                  to={moneyPageHref}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-600 text-neutral-300 hover:bg-neutral-800 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Prova kalkylatorn gratis
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Back link */}
        <div className="bg-white py-8 border-t border-neutral-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till CalculEat
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
