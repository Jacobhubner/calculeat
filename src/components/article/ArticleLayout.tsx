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
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
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

          {/* Article header */}
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 leading-tight">
            {title}
          </h1>

          {/* Featured snippet block */}
          <p className="text-lg text-neutral-600 leading-relaxed mb-8 border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-lg">
            {intro}
          </p>

          {/* Main content */}
          <article className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed space-y-6">
            {children}
          </article>

          {/* Money page CTA */}
          {moneyPageHref && moneyPageLabel && (
            <div className="mt-10 rounded-2xl bg-primary-50 border border-primary-200 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-primary-900 mb-1">{moneyPageLabel}</p>
                <p className="text-sm text-primary-700">Gratis att använda — inget konto krävs.</p>
              </div>
              <Link
                to={moneyPageHref}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                Prova kalkylatorn
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* FAQ */}
          {faqItems && faqItems.length > 0 && <FaqBlock items={faqItems} />}

          {/* Sources */}
          {sources && sources.length > 0 && (
            <section className="mt-10 pt-8 border-t border-neutral-200">
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Källor
              </h2>
              <ol className="space-y-1">
                {sources.map((s, i) => (
                  <li key={i} className="text-sm text-neutral-600">
                    [{i + 1}]{' '}
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-primary-600"
                      >
                        {s.text}
                      </a>
                    ) : (
                      s.text
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Related content */}
          {((relatedArticles && relatedArticles.length > 0) ||
            (relatedCalculators && relatedCalculators.length > 0)) && (
            <section className="mt-10 pt-8 border-t border-neutral-200 grid sm:grid-cols-2 gap-6">
              {relatedCalculators && relatedCalculators.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    Relaterade kalkylatorer
                  </h3>
                  <ul className="space-y-2">
                    {relatedCalculators.map((l, i) => (
                      <li key={i}>
                        <Link
                          to={l.href}
                          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {relatedArticles && relatedArticles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    Relaterade artiklar
                  </h3>
                  <ul className="space-y-2">
                    {relatedArticles.map((l, i) => (
                      <li key={i}>
                        <Link
                          to={l.href}
                          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-neutral-100">
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
