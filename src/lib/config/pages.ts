import { ARTICLES } from '@/content/articles/registry'
import type { ArticleMeta } from '@/content/articles/types'

export type SupportedLocale = 'sv' | 'en' // utöka: | 'de' | 'es'

export interface PageLocaleEntry {
  path: string // URL-stig utan ledande slash
  canonical: string
}

export interface PageConfig {
  key: string
  category: 'calculator' | 'article' | 'comparison' | 'hub' | 'other'
  locales: Partial<Record<SupportedLocale, PageLocaleEntry>>
  xDefault: string // x-default → svenska URL (ingen prefix = default)
  priority: number
  changefreq?: string
  /** 'YYYY-MM-DD' — sätts redaktionellt; artiklar får den från registryts dateModified */
  lastmod?: string
  /**
   * true = sidan är under arbete och ska inte indexeras. Utesluts ur
   * sitemap-generering och prerendering, och sidkomponenten sätter
   * <meta robots noindex>. Rutten finns kvar (nåbar via direkt-URL).
   */
  noindex?: boolean
}

/**
 * Kanonisk produktions-origin. Används för canonical, hreflang, sitemap och JSON-LD.
 * Medvetet INTE en env-var: preview-deploys ska också peka canonicals mot produktion.
 * scripts/check-domain.mjs failar bygget om den gamla .se-domänen smyger in igen.
 */
export const SITE_ORIGIN = 'https://calculeat.com'
const BASE = SITE_ORIGIN

const STATIC_PAGE_CONFIGS: PageConfig[] = [
  // ── Kalkylatorer ─────────────────────────────────────────────────────────
  {
    key: 'tdee-calculator',
    category: 'calculator',
    locales: {
      sv: {
        path: 'kalkylatorer/tdee-kalkylator',
        canonical: `${BASE}/kalkylatorer/tdee-kalkylator`,
      },
      en: {
        path: 'en/calculators/tdee-calculator',
        canonical: `${BASE}/en/calculators/tdee-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/tdee-kalkylator`,
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    key: 'bmi-calculator',
    category: 'calculator',
    locales: {
      sv: { path: 'kalkylatorer/bmi-kalkylator', canonical: `${BASE}/kalkylatorer/bmi-kalkylator` },
      en: {
        path: 'en/calculators/bmi-calculator',
        canonical: `${BASE}/en/calculators/bmi-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/bmi-kalkylator`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'calorie-deficit-calculator',
    category: 'calculator',
    locales: {
      sv: {
        path: 'kalkylatorer/kaloriunderskott',
        canonical: `${BASE}/kalkylatorer/kaloriunderskott`,
      },
      en: {
        path: 'en/calculators/calorie-deficit-calculator',
        canonical: `${BASE}/en/calculators/calorie-deficit-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/kaloriunderskott`,
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    key: 'bulk-calculator',
    category: 'calculator',
    locales: {
      sv: {
        path: 'kalkylatorer/bulk-kalkylator',
        canonical: `${BASE}/kalkylatorer/bulk-kalkylator`,
      },
      en: {
        path: 'en/calculators/bulk-calculator',
        canonical: `${BASE}/en/calculators/bulk-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/bulk-kalkylator`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'cut-calculator',
    category: 'calculator',
    locales: {
      sv: { path: 'kalkylatorer/cut-kalkylator', canonical: `${BASE}/kalkylatorer/cut-kalkylator` },
      en: {
        path: 'en/calculators/cut-calculator',
        canonical: `${BASE}/en/calculators/cut-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/cut-kalkylator`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'protein-calculator',
    category: 'calculator',
    locales: {
      sv: { path: 'kalkylatorer/proteinbehov', canonical: `${BASE}/kalkylatorer/proteinbehov` },
      en: {
        path: 'en/calculators/protein-calculator',
        canonical: `${BASE}/en/calculators/protein-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/proteinbehov`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'idealweight-calculator',
    category: 'calculator',
    locales: {
      sv: { path: 'kalkylatorer/idealvikt', canonical: `${BASE}/kalkylatorer/idealvikt` },
      en: {
        path: 'en/calculators/ideal-weight-calculator',
        canonical: `${BASE}/en/calculators/ideal-weight-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/idealvikt`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'bodyfat-calculator',
    category: 'calculator',
    locales: {
      sv: { path: 'kalkylatorer/kroppsfett', canonical: `${BASE}/kalkylatorer/kroppsfett` },
      en: {
        path: 'en/calculators/body-fat-calculator',
        canonical: `${BASE}/en/calculators/body-fat-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/kroppsfett`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'ffmi-calculator',
    category: 'calculator',
    locales: {
      sv: {
        path: 'kalkylatorer/ffmi-kalkylator',
        canonical: `${BASE}/kalkylatorer/ffmi-kalkylator`,
      },
      en: {
        path: 'en/calculators/ffmi-calculator',
        canonical: `${BASE}/en/calculators/ffmi-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/ffmi-kalkylator`,
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    key: 'bmr-calculator',
    category: 'calculator',
    locales: {
      sv: { path: 'kalkylatorer/bmr-kalkylator', canonical: `${BASE}/kalkylatorer/bmr-kalkylator` },
      en: {
        path: 'en/calculators/bmr-calculator',
        canonical: `${BASE}/en/calculators/bmr-calculator`,
      },
    },
    xDefault: `${BASE}/kalkylatorer/bmr-kalkylator`,
    priority: 0.7,
    changefreq: 'monthly',
  },

  // ── Artiklar: genereras från src/content/articles/registry.ts (se nedan) ──

  // ── Jämförelser ───────────────────────────────────────────────────────────
  {
    key: 'myfitnesspal-vs-calculeat',
    category: 'comparison',
    locales: {
      sv: {
        path: 'jamfor/myfitnesspal-vs-calculeat',
        canonical: `${BASE}/jamfor/myfitnesspal-vs-calculeat`,
      },
      en: {
        path: 'en/compare/myfitnesspal-vs-calculeat',
        canonical: `${BASE}/en/compare/myfitnesspal-vs-calculeat`,
      },
    },
    xDefault: `${BASE}/jamfor/myfitnesspal-vs-calculeat`,
    priority: 0.8,
    changefreq: 'monthly',
    noindex: true, // under arbete — ej publik ännu
  },
  {
    key: 'lifesum-vs-calculeat',
    category: 'comparison',
    locales: {
      sv: { path: 'jamfor/lifesum-vs-calculeat', canonical: `${BASE}/jamfor/lifesum-vs-calculeat` },
      en: {
        path: 'en/compare/lifesum-vs-calculeat',
        canonical: `${BASE}/en/compare/lifesum-vs-calculeat`,
      },
    },
    xDefault: `${BASE}/jamfor/lifesum-vs-calculeat`,
    priority: 0.8,
    changefreq: 'monthly',
    noindex: true, // under arbete — ej publik ännu
  },
  {
    key: 'yazio-vs-calculeat',
    category: 'comparison',
    locales: {
      sv: { path: 'jamfor/yazio-vs-calculeat', canonical: `${BASE}/jamfor/yazio-vs-calculeat` },
      en: {
        path: 'en/compare/yazio-vs-calculeat',
        canonical: `${BASE}/en/compare/yazio-vs-calculeat`,
      },
    },
    xDefault: `${BASE}/jamfor/yazio-vs-calculeat`,
    priority: 0.8,
    changefreq: 'monthly',
    noindex: true, // under arbete — ej publik ännu
  },
  {
    key: 'macrofactor-vs-calculeat',
    category: 'comparison',
    locales: {
      sv: {
        path: 'jamfor/macrofactor-vs-calculeat',
        canonical: `${BASE}/jamfor/macrofactor-vs-calculeat`,
      },
      en: {
        path: 'en/compare/macrofactor-vs-calculeat',
        canonical: `${BASE}/en/compare/macrofactor-vs-calculeat`,
      },
    },
    xDefault: `${BASE}/jamfor/macrofactor-vs-calculeat`,
    priority: 0.8,
    changefreq: 'monthly',
    noindex: true, // under arbete — ej publik ännu
  },

  // ── Hubbar & övrigt ───────────────────────────────────────────────────────
  {
    key: 'calculators-hub',
    category: 'hub',
    locales: {
      sv: { path: 'kalkylatorer', canonical: `${BASE}/kalkylatorer` },
      en: { path: 'en/calculators', canonical: `${BASE}/en/calculators` },
    },
    xDefault: `${BASE}/kalkylatorer`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'articles-hub',
    category: 'hub',
    locales: {
      sv: { path: 'artiklar', canonical: `${BASE}/artiklar` },
      en: { path: 'en/articles', canonical: `${BASE}/en/articles` },
    },
    xDefault: `${BASE}/artiklar`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'best-calorie-app',
    category: 'other',
    locales: {
      sv: { path: 'basta-kaloriappen', canonical: `${BASE}/basta-kaloriappen` },
      en: { path: 'en/compare/best-calorie-app', canonical: `${BASE}/en/compare/best-calorie-app` },
    },
    xDefault: `${BASE}/basta-kaloriappen`,
    priority: 0.8,
    changefreq: 'monthly',
    noindex: true, // under arbete — ej publik ännu
  },
  {
    key: 'best-tdee-calculator',
    category: 'other',
    locales: {
      sv: { path: 'basta-tdee-kalkylatorn', canonical: `${BASE}/basta-tdee-kalkylatorn` },
      en: {
        path: 'en/compare/best-tdee-calculator',
        canonical: `${BASE}/en/compare/best-tdee-calculator`,
      },
    },
    xDefault: `${BASE}/basta-tdee-kalkylatorn`,
    priority: 0.8,
    changefreq: 'monthly',
    noindex: true, // under arbete — ej publik ännu
  },
  {
    key: 'about',
    category: 'other',
    locales: {
      sv: { path: 'om-oss', canonical: `${BASE}/om-oss` },
      en: { path: 'en/about', canonical: `${BASE}/en/about` },
    },
    xDefault: `${BASE}/om-oss`,
    priority: 0.5,
    changefreq: 'yearly',
  },
  {
    key: 'premium',
    category: 'other',
    locales: {
      sv: { path: 'premium', canonical: `${BASE}/premium` },
      en: { path: 'en/premium', canonical: `${BASE}/en/premium` },
    },
    xDefault: `${BASE}/premium`,
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    key: 'terms',
    category: 'other',
    locales: {
      sv: { path: 'villkor', canonical: `${BASE}/villkor` },
      en: { path: 'en/terms', canonical: `${BASE}/en/terms` },
    },
    xDefault: `${BASE}/villkor`,
    priority: 0.3,
    changefreq: 'yearly',
  },
  {
    key: 'privacy',
    category: 'other',
    locales: {
      sv: { path: 'integritetspolicy', canonical: `${BASE}/integritetspolicy` },
      en: { path: 'en/privacy', canonical: `${BASE}/en/privacy` },
    },
    xDefault: `${BASE}/integritetspolicy`,
    priority: 0.3,
    changefreq: 'yearly',
  },
]

function articleToPageConfig(a: ArticleMeta): PageConfig {
  return {
    key: a.key,
    category: 'article',
    locales: {
      sv: { path: a.paths.sv, canonical: `${BASE}/${a.paths.sv}` },
      en: { path: a.paths.en, canonical: `${BASE}/${a.paths.en}` },
    },
    xDefault: `${BASE}/${a.paths.sv}`,
    priority: a.priority ?? 0.7,
    changefreq: 'monthly',
    lastmod: a.dateModified,
  }
}

/** Alla publika sidor: statiska configs + artiklar genererade från registryt */
export const PAGE_CONFIGS: PageConfig[] = [
  ...STATIC_PAGE_CONFIGS,
  ...ARTICLES.map(articleToPageConfig),
]

const LOCALE_TO_HREFLANG: Record<SupportedLocale, string> = {
  sv: 'sv',
  en: 'en',
}

export function getPageConfigByKey(key: string): PageConfig | undefined {
  return PAGE_CONFIGS.find(p => p.key === key)
}

// Lookup by URL path (without leading slash) — used by LanguageSwitcher
export function getPageConfigByPath(pathname: string): PageConfig | undefined {
  const path = pathname.replace(/^\//, '')
  return PAGE_CONFIGS.find(p => Object.values(p.locales).some(entry => entry?.path === path))
}

export function getHreflangAlternates(
  config: PageConfig
): Array<{ hreflang: string; href: string }> {
  const alts: Array<{ hreflang: string; href: string }> = []
  for (const [locale, entry] of Object.entries(config.locales) as [
    SupportedLocale,
    PageLocaleEntry,
  ][]) {
    if (entry) {
      alts.push({ hreflang: LOCALE_TO_HREFLANG[locale], href: entry.canonical })
    }
  }
  alts.push({ hreflang: 'x-default', href: config.xDefault })
  return alts
}
