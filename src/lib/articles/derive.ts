import type { Block, RichText } from '@/content/articles/types'

/**
 * Rena härledningsfunktioner över artikelns blocklista (TOC, lästid).
 * Deterministiska = prerender-säkra: samma output i Node-snapshot och klient.
 */

export interface TocItem {
  id: string
  label: string
}

export function richTextToPlain(text: RichText): string {
  if (typeof text === 'string') return text
  return text.map(run => ('br' in run ? ' ' : run.text)).join('')
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[éè]/g, 'e')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** TOC från h2-blocken. Dublett-slugs får suffix -2, -3 … */
export function deriveToc(blocks: Block[]): {
  items: TocItem[]
  idByBlockIndex: Record<number, string>
} {
  const items: TocItem[] = []
  const idByBlockIndex: Record<number, string> = {}
  const seen = new Map<string, number>()

  blocks.forEach((block, i) => {
    if (block.type !== 'h2') return
    const label = richTextToPlain(block.text)
    let id = slugify(label) || `avsnitt-${i}`
    const count = (seen.get(id) ?? 0) + 1
    seen.set(id, count)
    if (count > 1) id = `${id}-${count}`
    items.push({ id, label })
    idByBlockIndex[i] = id
  })

  return { items, idByBlockIndex }
}

function blockWords(block: Block): number {
  const count = (t: RichText) => richTextToPlain(t).split(/\s+/).filter(Boolean).length
  switch (block.type) {
    case 'h2':
    case 'h3':
    case 'p':
    case 'note':
    case 'formula':
    case 'callout':
      return count(block.text)
    case 'infoBox':
      return block.items.reduce((n, item) => n + count(item), 0)
    case 'ul':
    case 'ol':
      return block.items.reduce((n, item) => n + count(item), 0)
    case 'table':
      return block.rows.flat().join(' ').split(/\s+/).filter(Boolean).length
    case 'tableGrid':
      return block.tables.reduce(
        (n, t) => n + t.rows.flat().join(' ').split(/\s+/).filter(Boolean).length,
        0
      )
    case 'cards':
      return block.items.reduce(
        (n, c) => n + `${c.title} ${c.label ?? ''} ${c.text}`.split(/\s+/).filter(Boolean).length,
        0
      )
    case 'component':
      return 250 // schablon: inbäddade info-komponenter är ~1–2 min läsning
    default:
      return 0
  }
}

/** Lästid i minuter, 200 ord/min (svensk sakprosa), alltid ≥ 1 */
export function deriveReadingMinutes(blocks: Block[], wpm = 200): number {
  const words = blocks.reduce((n, b) => n + blockWords(b), 0)
  return Math.max(1, Math.round(words / wpm))
}
