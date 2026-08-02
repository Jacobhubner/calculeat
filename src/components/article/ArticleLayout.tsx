import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, ShieldCheck, ChevronRight, FlaskConical } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import type { FaqItem } from './FaqBlock'
import { FaqBlock } from './FaqBlock'
import { ArticleToc } from './ArticleToc'
import type { TocItem } from '@/lib/articles/derive'

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
  authorName?: string
  dateModified?: string // 'YYYY-MM-DD'
  readingMinutes?: number
  tocItems?: TocItem[]
}

const KICKER =
  'text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500'

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
  authorName,
  dateModified,
  readingMinutes,
  tocItems,
}: ArticleLayoutProps) {
  const { pathname } = useLocation()
  const lng = pathname.startsWith('/en/') ? 'en' : 'sv'
  const { t } = useTranslation('article-layout', { lng })

  const formattedDate = dateModified
    ? new Intl.DateTimeFormat(lng === 'en' ? 'en-US' : 'sv-SE', { dateStyle: 'long' }).format(
        new Date(`${dateModified}T00:00:00`)
      )
    : undefined

  const hasToc = !!tocItems && tocItems.length >= 3

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero: tonad grön premium-yta i tre lager ─────────────────────── */}
        <section className="relative overflow-hidden border-b border-neutral-200/60 bg-white dark:bg-neutral-850">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-primary-50/80 via-primary-50/30 to-white dark:to-neutral-850 dark:from-primary-900/30 dark:via-primary-900/25"
          />
          <div
            aria-hidden
            className="absolute -top-32 right-[-10%] h-[24rem] w-[36rem] rounded-full bg-primary-200/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle,rgb(0_0_0/0.035)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
          />

          <div className="relative container mx-auto px-4 pt-10 pb-10 md:pt-16 md:pb-14 max-w-2xl">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-neutral-500 mb-6 dark:text-neutral-400">
                <Link
                  data-layout-text
                  to="/"
                  className="hover:text-neutral-900 transition-colors dark:hover:text-neutral-100"
                >
                  Calculeat
                </Link>
                {breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <ChevronRight aria-hidden className="h-3.5 w-3.5 text-neutral-300" />
                    {i === breadcrumb.length - 1 ? (
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.href}
                        className="hover:text-neutral-900 transition-colors dark:hover:text-neutral-100"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}

            <h1 className="text-[2rem] leading-[1.12] md:text-5xl md:leading-[1.08] font-bold tracking-tight text-neutral-900 text-balance mb-5 dark:text-neutral-100">
              {title}
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed text-pretty max-w-[38rem] dark:text-neutral-400">
              {intro}
            </p>

            {(formattedDate || readingMinutes) && (
              <p
                data-byline
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/70 px-3.5 py-1.5 text-[13px] text-neutral-500 shadow-xs dark:text-neutral-400 dark:border-neutral-700/80 dark:bg-neutral-800/70"
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                {formattedDate && (
                  <>
                    {t('byline.updatedLabel')} <time dateTime={dateModified}>{formattedDate}</time>
                  </>
                )}
                {formattedDate && readingMinutes ? (
                  <span className="text-neutral-300">·</span>
                ) : null}
                {readingMinutes ? t('byline.readingTime', { count: readingMinutes }) : null}
              </p>
            )}
          </div>
        </section>

        {/* ── Innehållszon (vit): byline-rad, TOC, brödtext ────────────────── */}
        <section className="bg-white py-10 md:py-16 dark:bg-neutral-850">
          <div className="xl:grid xl:grid-cols-[1fr_minmax(0,42rem)_1fr]">
            <div aria-hidden className="hidden xl:block" />
            <div className="container mx-auto px-4 max-w-2xl xl:max-w-none xl:w-full">
              {/* Författar-byline — diskret enrads. Innehåll tillskrivs
                  organisationen Calculeat (personnamn borttaget 2026-07-26). */}
              {authorName && (
                <p
                  data-byline
                  className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-neutral-200/70 pb-6 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400"
                >
                  <ShieldCheck
                    aria-hidden
                    className="h-4 w-4 text-primary-600 flex-shrink-0 dark:text-primary-300"
                  />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {t('byline.reviewedBy')}
                  </span>
                </p>
              )}

              {hasToc && (
                <ArticleToc items={tocItems} heading={t('toc.heading')} variant="inline" />
              )}

              {/* [&_strong] tvingar fetstil mörkare än brödtexten. Utan en
                  dark-variant blev all fetstil i artiklarna nästan svart —
                  osynlig mot mörk botten, mitt i läsbar löptext. */}
              <article className="max-w-none text-[17px] leading-[1.75] text-neutral-700 [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:text-neutral-200 dark:[&_strong]:text-neutral-50">
                {children}
              </article>
            </div>
            {hasToc ? (
              <ArticleToc items={tocItems} heading={t('toc.heading')} variant="rail" />
            ) : (
              <div aria-hidden className="hidden xl:block" />
            )}
          </div>
        </section>

        {/* ── Money-CTA: sidans starkaste yta ──────────────────────────────── */}
        {moneyPageHref && moneyPageLabel && (
          <section className="bg-white pb-16 dark:bg-neutral-850">
            <div className="container mx-auto px-4 max-w-2xl">
              {/* Helmättad grön lyser mot en dov mörk sida. I mörkt läge
                  dämpas gradienten så banderollen fortfarande är sidans
                  starkaste yta utan att skrika. */}
              <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="flex-1">
                  <p className="font-semibold text-white text-lg leading-snug mb-1">
                    {moneyPageLabel}
                  </p>
                  <p data-layout-text className="text-sm text-primary-100">
                    {t('moneyPageCta.subtitle')}
                  </p>
                </div>
                <Link
                  data-layout-text
                  to={moneyPageHref}
                  // Knappen behöll text-primary-800 när ytan blev mörk —
                  // mörkt på mörkt. Ljus text i mörkt läge i stället.
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-800 hover:bg-primary-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap shadow-xs w-full sm:w-auto dark:bg-neutral-100 dark:text-primary-900 dark:hover:bg-white"
                >
                  {t('moneyPageCta.button')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        {faqItems && faqItems.length > 0 && (
          <section className="bg-white pb-16 dark:bg-neutral-850">
            <div className="container mx-auto px-4 max-w-2xl">
              <FaqBlock items={faqItems} title={t('faqTitle')} />
            </div>
          </section>
        )}

        {/* ── Metazon (grå): källor + läs vidare ───────────────────────────── */}
        {sources && sources.length > 0 && (
          <section className="bg-neutral-50 border-t border-neutral-200/70 py-10 dark:bg-neutral-900">
            <div className="container mx-auto px-4 max-w-2xl">
              <h2 data-layout-text className={`${KICKER} mb-1 flex items-center gap-1.5`}>
                <FlaskConical
                  aria-hidden
                  className="h-3.5 w-3.5 text-primary-600 dark:text-primary-300"
                />
                {t('sources.heading')}
              </h2>
              <p
                data-layout-text
                className="text-[13px] text-neutral-400 mb-4 dark:text-neutral-500"
              >
                {t('sources.note')}
              </p>
              <ol className="space-y-2">
                {sources.map((s, i) => (
                  <li
                    key={i}
                    className="relative pl-7 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400"
                  >
                    <span
                      data-layout-text
                      className="absolute left-0 text-neutral-400 tabular-nums dark:text-neutral-500"
                    >
                      {i + 1}.
                    </span>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-800 hover:decoration-primary-400 transition-colors"
                      >
                        {s.text}
                      </a>
                    ) : (
                      s.text
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {((relatedArticles && relatedArticles.length > 0) ||
          (relatedCalculators && relatedCalculators.length > 0)) && (
          <section className="bg-neutral-50 py-14 dark:bg-neutral-900">
            <div className="container mx-auto px-4 max-w-2xl">
              <h2
                data-layout-text
                className="text-2xl font-semibold tracking-tight text-neutral-900 mb-8 dark:text-neutral-100"
              >
                {t('related.heading')}
              </h2>

              {relatedArticles && relatedArticles.length > 0 && (
                <div className="mb-10">
                  <h3 data-layout-text className={`${KICKER} mb-4`}>
                    {t('related.articlesHeading')}
                  </h3>
                  <div className="grid gap-3">
                    {relatedArticles.map((l, i) => (
                      <Link
                        key={i}
                        to={l.href}
                        className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-800 shadow-xs hover:border-primary-300 hover:shadow-card transition-all dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-200"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 flex-shrink-0 group-hover:bg-primary-100 transition-colors dark:bg-primary-900/25 dark:text-primary-300">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {relatedCalculators && relatedCalculators.length > 0 && (
                <div>
                  <h3 data-layout-text className={`${KICKER} mb-4`}>
                    {t('related.calculatorsHeading')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedCalculators.map((l, i) => (
                      <Link
                        key={i}
                        to={l.href}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/70 bg-white px-3.5 py-1.5 text-[13px] font-medium text-primary-800 shadow-xs hover:bg-primary-50 hover:border-primary-300 transition-colors dark:bg-neutral-850"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Mörk konto-CTA ───────────────────────────────────────────────── */}
        <section
          data-layout-text
          className="relative overflow-hidden bg-neutral-950 py-14 md:py-20"
        >
          <div
            aria-hidden
            className="absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(ellipse_at_center,hsl(108_100%_37%/0.16),transparent_65%)]"
          />
          <div className="relative container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              {t('bottomCta.h2')}
            </h2>
            <p className="text-neutral-400 text-base leading-relaxed mb-8 max-w-md mx-auto dark:text-neutral-500">
              {t('bottomCta.body')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {t('bottomCta.primary')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {moneyPageHref && (
                <Link
                  to={moneyPageHref}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-700 text-neutral-300 hover:bg-neutral-800/80 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {t('bottomCta.secondary')}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Tillbaka-länk ────────────────────────────────────────────────── */}
        <div
          data-layout-text
          className="bg-white py-8 border-t border-neutral-200/60 dark:bg-neutral-850"
        >
          <div className="container mx-auto px-4 max-w-2xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors dark:hover:text-neutral-200 dark:text-neutral-400"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backLink')}
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
