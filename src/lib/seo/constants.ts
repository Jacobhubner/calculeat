import { SITE_ORIGIN } from '@/lib/config/pages'

/**
 * Författare för allt artikelinnehåll (E-E-A-T-signal i Article-schema
 * och synlig byline). Nutrition är YMYL — namngiven människa med
 * kvalifikationer väger tyngre än anonym organisation.
 */
export const AUTHOR = {
  name: 'Jacob Hübner',
  jobTitle: {
    sv: 'Legitimerad naprapat, certifierad kostrådgivare och personlig tränare EQF Level 4',
    en: 'Doctor of Naprapathy, Certified Nutrition Advisor and EQF Level 4 Personal Trainer',
  },
  url: {
    sv: `${SITE_ORIGIN}/om-oss`,
    en: `${SITE_ORIGIN}/en/about`,
  },
} as const

/** Stabilt @id så Article.publisher refererar samma nod som Organization-schemat i index.html */
export const ORG_ID = `${SITE_ORIGIN}/#organization`
export const ORG_NAME = 'CalculEat'
export const ORG_LOGO_URL = `${SITE_ORIGIN}/logo-512.png`
