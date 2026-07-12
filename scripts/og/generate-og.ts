/**
 * OG-bildpipeline (Fas 5 i SEO-överhalningen).
 * Genererar en unik Open Graph-bild (1200×630 PNG) per publik sida × språk
 * från en SVG-mall med sidans titel + CalculEat-branding.
 *
 * - Rastrering: @resvg/resvg-js med bundlade Inter-fonter (loadSystemFonts: false
 *   → pixelidentiskt på Windows-dev och Vercel-Linux)
 * - Radbrytning: glyf-för-glyf-mätning med opentype.js (Inters GSUB stöds inte
 *   av opentype.js shaping — därför manuell advanceWidth-summering + marginal)
 * - Cache: node_modules/.cache/calculeat-og/ med innehållshash — omkörningar
 *   renderar bara nya/ändrade titlar (Vercel bevarar node_modules mellan builds)
 *
 * Körs i prebuild (se package.json). Output: public/og/{key}-{lng}.png + default.png
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  copyFileSync,
  rmSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import opentype from 'opentype.js'
import { PAGE_CONFIGS } from '../../src/lib/config/pages'
import type { SupportedLocale } from '../../src/lib/config/pages'

const ROOT = process.cwd()
const OG_DIR = path.join(ROOT, 'public', 'og')
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'calculeat-og')
const FONT_BOLD = path.join(ROOT, 'scripts', 'og', 'fonts', 'Inter-Bold.ttf')
const FONT_REGULAR = path.join(ROOT, 'scripts', 'og', 'fonts', 'Inter-Regular.ttf')
const LOGO = path.join(ROOT, 'scripts', 'og', 'assets', 'logo-og.png')

/** Bumpa vid designändring i mallen så alla bilder renderas om */
const TEMPLATE_VERSION = '1'

// ── Fontmätning ─────────────────────────────────────────────────────────────
function parseFont(file: string) {
  const buf = readFileSync(file)
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}
const boldFont = parseFont(FONT_BOLD)

function textWidth(text: string, fontSize: number): number {
  const scale = fontSize / boldFont.unitsPerEm
  let w = 0
  for (const ch of text) w += (boldFont.charToGlyph(ch).advanceWidth ?? 0) * scale
  return w * 1.02 // liten marginal — resvg kernar vid rendering, opentype.js gör det inte här
}

function wrapTitle(text: string, maxWidth: number): { lines: string[]; fontSize: number } {
  for (const fontSize of [64, 58, 52, 46, 40]) {
    const lines: string[] = []
    let line = ''
    for (const word of text.split(/\s+/)) {
      const probe = line ? `${line} ${word}` : word
      if (textWidth(probe, fontSize) <= maxWidth) line = probe
      else {
        if (line) lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
    if (lines.length <= 3 && lines.every(l => textWidth(l, fontSize) <= maxWidth)) {
      return { lines, fontSize }
    }
  }
  throw new Error(`Titel går inte att bryta till ≤3 rader: "${text}"`)
}

// ── SVG-mall ────────────────────────────────────────────────────────────────
const logoDataUri = `data:image/png;base64,${readFileSync(LOGO).toString('base64')}`

const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

function ogSvg(title: string): string {
  const { lines, fontSize } = wrapTitle(title, 1040)
  const lineHeight = fontSize * 1.22
  // Vertikalt centrera titelblocket i ytan mellan logga (~200) och footer (~540)
  const blockHeight = lines.length * lineHeight
  const firstBaseline = 200 + (340 - blockHeight) / 2 + fontSize

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="15%" cy="0%" r="95%">
      <stop offset="0%" stop-color="rgb(37,189,0)" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="rgb(37,189,0)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="618" width="1200" height="12" fill="rgb(37,189,0)"/>
  <image href="${logoDataUri}" x="80" y="64" width="300" height="102"/>
  <text font-family="Inter" font-weight="700" font-size="${fontSize}" fill="#111827">
    ${lines
      .map(
        (l, i) =>
          `<tspan x="80" y="${(firstBaseline + i * lineHeight).toFixed(1)}">${escapeXml(l)}</tspan>`
      )
      .join('\n    ')}
  </text>
  <text x="80" y="574" font-family="Inter" font-weight="400" font-size="28" fill="#4b5563">calculeat.com</text>
</svg>`
}

function renderPng(svg: string): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      fontFiles: [FONT_BOLD, FONT_REGULAR],
      defaultFontFamily: 'Inter',
      loadSystemFonts: false, // KRITISKT: identisk rendering på Windows och Linux
    },
  })
    .render()
    .asPng()
}

// ── Titeluppslag ────────────────────────────────────────────────────────────
// key → seo.title per locale. Artiklar bor i articles/{key}.json, övriga sidor
// i pages-*.json (toppnivånyckel = page key, oberoende av category).
function loadTitles(locale: SupportedLocale): Map<string, string> {
  const dir = path.join(ROOT, 'public', 'locales', locale)
  const map = new Map<string, string>()
  for (const f of readdirSync(dir).filter(f => f.startsWith('pages-') && f.endsWith('.json'))) {
    const json = JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as Record<
      string,
      { seo?: { title?: string } }
    >
    for (const [key, val] of Object.entries(json)) {
      if (val?.seo?.title) map.set(key, val.seo.title)
    }
  }
  const articlesDir = path.join(dir, 'articles')
  if (existsSync(articlesDir)) {
    for (const f of readdirSync(articlesDir).filter(f => f.endsWith('.json'))) {
      const json = JSON.parse(readFileSync(path.join(articlesDir, f), 'utf8')) as {
        seo?: { title?: string }
      }
      if (json?.seo?.title) map.set(f.replace(/\.json$/, ''), json.seo.title)
    }
  }
  return map
}

const stripSuffix = (title: string) => title.replace(/\s*\|\s*CalculEat\s*$/, '')

// ── Huvudflöde ──────────────────────────────────────────────────────────────
mkdirSync(OG_DIR, { recursive: true })
mkdirSync(CACHE_DIR, { recursive: true })

const logoHash = createHash('sha1').update(readFileSync(LOGO)).digest('hex').slice(0, 8)
const fontHash = createHash('sha1').update(readFileSync(FONT_BOLD)).digest('hex').slice(0, 8)

type ManifestEntry = { hash: string }
const manifestPath = path.join(CACHE_DIR, 'manifest.json')
const manifest: Record<string, ManifestEntry> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {}

const titles: Record<SupportedLocale, Map<string, string>> = {
  sv: loadTitles('sv'),
  en: loadTitles('en'),
}

let rendered = 0
let cached = 0
const expected = new Set<string>()

function generate(id: string, title: string) {
  expected.add(`${id}.png`)
  const hash = createHash('sha1')
    .update([TEMPLATE_VERSION, title, logoHash, fontHash].join('\x1f'))
    .digest('hex')
  const cacheFile = path.join(CACHE_DIR, `${id}.png`)
  const outFile = path.join(OG_DIR, `${id}.png`)

  if (manifest[id]?.hash === hash && existsSync(cacheFile)) {
    copyFileSync(cacheFile, outFile)
    cached++
    return
  }
  const png = renderPng(ogSvg(stripSuffix(title)))
  writeFileSync(cacheFile, png)
  writeFileSync(outFile, png)
  manifest[id] = { hash }
  rendered++
}

const missing: string[] = []
for (const cfg of PAGE_CONFIGS) {
  for (const locale of Object.keys(cfg.locales) as SupportedLocale[]) {
    const title = titles[locale].get(cfg.key)
    if (!title) {
      missing.push(`${cfg.key} (${locale})`)
      continue
    }
    generate(`${cfg.key}-${locale}`, title)
  }
}

// Default/hem-bild — används av startsidan och som fallback
generate('default', 'Kalorikalkylator och matloggning — gratis och på svenska')

if (missing.length > 0) {
  console.error('FEL: saknar seo.title för:\n  ' + missing.join('\n  '))
  console.error('Lägg till titlarna i locale-filerna — OG-bilder kan inte genereras utan dem.')
  process.exit(1)
}

// Städa bort bilder för borttagna sidor
for (const f of readdirSync(OG_DIR).filter(f => f.endsWith('.png'))) {
  if (!expected.has(f)) {
    rmSync(path.join(OG_DIR, f))
    delete manifest[f.replace(/\.png$/, '')]
    console.log(`  rensade ${f}`)
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`OG-bilder: ${rendered} renderade, ${cached} från cache (${expected.size} totalt)`)
