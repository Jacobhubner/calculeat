import { SITE_ORIGIN } from '@/lib/config/pages'

/** Stabilt @id så Article.publisher refererar samma nod som Organization-schemat i index.html */
export const ORG_ID = `${SITE_ORIGIN}/#organization`
export const ORG_NAME = 'Calculeat'
export const ORG_LOGO_URL = `${SITE_ORIGIN}/calculeat-logo-512.png`

/**
 * Författare för allt artikelinnehåll (Article-schema + synlig byline).
 * Innehållet tillskrivs organisationen Calculeat (beslut 2026-07-26 —
 * personnamn borttaget).
 */
export const AUTHOR = {
  name: ORG_NAME,
  url: {
    sv: `${SITE_ORIGIN}/om-oss`,
    en: `${SITE_ORIGIN}/en/about`,
  },
} as const
