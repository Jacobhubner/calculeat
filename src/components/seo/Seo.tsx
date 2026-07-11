import { Helmet } from 'react-helmet-async'

interface HreflangEntry {
  hreflang: string
  href: string
}

interface SeoProps {
  title: string
  description: string
  canonical: string
  ogImage?: string
  type?: 'website' | 'article'
  hreflangAlternates?: HreflangEntry[]
  locale?: 'sv_SE' | 'en_US' | 'de_DE' | 'es_ES'
}

export function Seo({
  title,
  description,
  canonical,
  ogImage,
  type = 'website',
  hreflangAlternates,
  locale,
}: SeoProps) {
  const image = ogImage ?? 'https://calculeat.com/og-default.png'
  const ogLocale = locale ?? (canonical.includes('/en/') ? 'en_US' : 'sv_SE')

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {hreflangAlternates?.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="CalculEat" />
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
