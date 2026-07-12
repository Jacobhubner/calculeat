/**
 * Blockmodell för datadrivna artiklar.
 * Innehållet bor i public/locales/{lng}/articles/{key}.json och renderas
 * av ArticleBody. En "run" är ett textsegment med valfri fet/kursiv stil.
 *
 * Blocken speglar exakt de DOM-mönster som fanns i de ursprungliga
 * artikel-TSX-filerna — layoutklasser återges av renderern, texten av JSON.
 */

export type Run = { text: string; strong?: boolean; em?: boolean } | { br: true }

/** Text i block: antingen en ren sträng eller en run-lista för blandad stil */
export type RichText = string | Run[]

export type Block =
  | { type: 'h2'; text: RichText; tight?: boolean } // tight = mt-6 (första h2), annars mt-8
  | { type: 'h3'; text: RichText }
  | { type: 'p'; text: RichText; flush?: boolean } // flush = utan mt-3
  | { type: 'note'; text: RichText; subtle?: boolean } // mindre dämpad text; subtle = ljusare utan mt-3
  | { type: 'formula'; text: RichText } // grå mono-box
  | { type: 'callout'; text: RichText } // blå centrerad box
  | { type: 'infoBox'; items: RichText[] } // grå box med flera textrader
  | {
      type: 'img'
      src: string
      alt: string
      width: number
      height: number
      webpSrc?: string
    }
  | { type: 'ul'; items: RichText[]; gap?: 1 | 2 | 4 }
  | { type: 'ol'; items: RichText[]; gap?: 1 | 2 | 4 }
  | {
      type: 'table'
      variant: 'plain' | 'bordered'
      headers: string[]
      rows: string[][]
    }
  | { type: 'tableGrid'; tables: { header: string; rows: [string, string][] }[] }
  | {
      type: 'cards'
      items: { title: string; label?: string; text: string; color: string }[]
    }
  // Delad React-komponent (src/components/info/*) inbäddad i artikeln
  | { type: 'component'; name: ComponentName; className?: string }

export type ComponentName =
  | 'FFMIContent'
  | 'NormalizedFFMIContent'
  | 'PALvsMETContent'
  | 'BMRvsRMRContent'

export interface ArticleContent {
  seo: { title: string; description: string }
  layout: {
    title: string
    intro: string
    moneyPageHref?: string
    moneyPageLabel?: string
    breadcrumb: { hubLabel: string; hubPath: string; pageLabel: string }
  }
  schema: { headline: string; description: string }
  body: Block[]
  faq?: { question: string; answer: string }[]
  sources?: { text: string; url?: string }[]
  related?: {
    calculators?: { href: string; label: string }[]
    articles?: { href: string; label: string }[]
  }
}

export interface ArticleMeta {
  key: string
  paths: { sv: string; en: string } // utan ledande slash, samma format som PAGE_CONFIGS
  datePublished: string // 'YYYY-MM-DD'
  dateModified: string
  priority?: number // sitemap-priority, default 0.7
}
