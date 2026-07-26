import { Helmet } from 'react-helmet-async'
import { SITE_ORIGIN, getPageConfigByPath } from '@/lib/config/pages'
import type { SupportedLocale } from '@/lib/config/pages'

interface HreflangEntry {
  hreflang: string
  href: string
}

/**
 * Härleder sidans genererade OG-bild (/og/{key}-{locale}.png, se
 * scripts/og/generate-og.ts) från canonical-URL:en. Fallback: default-bilden.
 */
function defaultOgImage(canonical: string): string {
  const pathname = new URL(canonical).pathname.replace(/^\//, '')
  const cfg = getPageConfigByPath(pathname)
  if (cfg) {
    const locale =
      (Object.entries(cfg.locales).find(([, e]) => e?.path === pathname)?.[0] as
        | SupportedLocale
        | undefined) ?? 'sv'
    return `${SITE_ORIGIN}/og/${cfg.key}-${locale}.png`
  }
  return `${SITE_ORIGIN}/og/default.png`
}

interface SeoProps {
  title: string
  description: string
  canonical: string
  ogImage?: string
  type?: 'website' | 'article'
  hreflangAlternates?: HreflangEntry[]
  locale?: 'sv_SE' | 'en_US' | 'de_DE' | 'es_ES'
  /**
   * Sätt true för sidor som inte ska indexeras av sökmotorer (t.ex. sidor
   * under arbete). Skriver <meta robots noindex, follow> och utelämnar
   * canonical + hreflang så inga blandade indexeringssignaler skickas.
   * Länkar följs fortfarande (follow) så internt länkvärde inte fastnar.
   */
  noindex?: boolean
}

export function Seo({
  title,
  description,
  canonical,
  ogImage,
  type = 'website',
  hreflangAlternates,
  locale,
  noindex = false,
}: SeoProps) {
  const image = ogImage ?? defaultOgImage(canonical)
  const ogLocale = locale ?? (canonical.includes('/en/') ? 'en_US' : 'sv_SE')
  const htmlLang = ogLocale.startsWith('en') ? 'en' : 'sv'

  return (
    // defer={false}: applicera head-taggar synkront vid commit. Default (rAF-
    // deferred) gör att taggarna aldrig skrivs i bakgrundsflikar — vilket
    // bryter prerendering och gör crawler-innehåll timing-beroende.
    <Helmet defer={false} htmlAttributes={{ lang: htmlLang }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      {!noindex && <link rel="canonical" href={canonical} />}

      {!noindex &&
        hreflangAlternates?.map(({ hreflang, href }) => (
          <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
        ))}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="Calculeat" />
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
