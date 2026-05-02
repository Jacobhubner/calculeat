import { Helmet } from 'react-helmet-async'

interface SeoProps {
  title: string
  description: string
  canonical: string
  ogImage?: string
  type?: 'website' | 'article'
}

export function Seo({ title, description, canonical, ogImage, type = 'website' }: SeoProps) {
  const image = ogImage ?? 'https://calculeat.se/og-default.png'

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="CalculEat" />
      <meta property="og:locale" content="sv_SE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
