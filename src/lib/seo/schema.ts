import { SITE_ORIGIN } from '@/lib/config/pages'
import { AUTHOR, ORG_ID, ORG_LOGO_URL, ORG_NAME } from './constants'
import type { SupportedLocale } from '@/lib/config/pages'

interface BreadcrumbEntry {
  label: string
  href: string
}

interface ArticleSchemaInput {
  headline: string
  description: string
  canonical: string
  lng: SupportedLocale
  datePublished: string // 'YYYY-MM-DD'
  dateModified: string
  /** Absolut URL till artikelns OG-bild; utelämnas tills OG-pipelinen finns */
  image?: string
  breadcrumb: BreadcrumbEntry[]
}

/**
 * Bygger Article + BreadcrumbList JSON-LD för en artikelsida.
 * Publisher refererar Organization-noden i index.html via @id.
 */
export function buildArticleSchemas(input: ArticleSchemaInput) {
  const { headline, description, canonical, lng, datePublished, dateModified, image, breadcrumb } =
    input

  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: lng === 'en' ? 'en' : 'sv-SE',
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      jobTitle: AUTHOR.jobTitle[lng] ?? AUTHOR.jobTitle.sv,
      url: AUTHOR.url[lng] ?? AUTHOR.url.sv,
    },
    publisher: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: ORG_NAME,
      url: SITE_ORIGIN,
      logo: { '@type': 'ImageObject', url: ORG_LOGO_URL },
    },
  }
  if (image) article.image = image

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: ORG_NAME, item: `${SITE_ORIGIN}/` },
      ...breadcrumb.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: c.label,
        item: c.href.startsWith('http') ? c.href : `${SITE_ORIGIN}${c.href}`,
      })),
    ],
  }

  return [article, breadcrumbList]
}
