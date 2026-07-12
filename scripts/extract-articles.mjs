// Fas 4-migrering: extraherar artikel-body som blockmodell DIREKT FRÅN DEN
// RENDERADE DOM:EN (legacy-sidorna = facit) och kombinerar med seo/layout/
// schema/faq/sources/related kopierade ordagrant från pages-articles.json.
// Output: public/locales/{lng}/articles/{key}.json
//
// Körning: bygg legacy-versionen, starta preview, kör detta script.
//   node scripts/extract-articles.mjs [--port 4173]
//
// Scriptet är STRIKT: okända DOM-mönster ger hårt fel istället för tyst
// felkonvertering — hellre faila än tappa innehåll.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'

const ROOT = process.cwd()
const portArg = process.argv.indexOf('--port')
const PORT = portArg > -1 ? process.argv[portArg + 1] : '4173'
const ORIGIN = `http://localhost:${PORT}`

// Artiklar som bäddar in delade info-komponenter — ordnad lista per artikel.
// Extraktorn möter komponent-rötter i DOM-ordning och plockar namn härifrån.
const COMPONENT_EMBEDS = {
  'bmr-vs-rmr': ['BMRvsRMRContent'],
  'what-is-ffmi': ['FFMIContent', 'NormalizedFFMIContent'],
  'what-is-pal-and-met': ['PALvsMETContent'],
}

// Rutter från registry.ts (regex-parsning — formatet är vårt eget och stabilt)
const registryTs = readFileSync(path.join(ROOT, 'src/content/articles/registry.ts'), 'utf8')
const articles = [...registryTs.matchAll(
  /key:\s*'([^']+)',\s*paths:\s*\{\s*sv:\s*'([^']+)',\s*en:\s*'([^']+)'/gs
)].map(m => ({ key: m[1], sv: m[2], en: m[3] }))
if (articles.length !== 13) {
  console.error(`Väntade 13 artiklar i registry.ts, hittade ${articles.length}`)
  process.exit(1)
}

// Extraheringslogik körs i browser-kontext
function extractBody(componentNames) {
  const article = document.querySelector('article')
  if (!article) throw new Error('inget <article>-element')

  function collectInline(el, runs) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent) runs.push({ text: node.textContent })
      } else if (node.nodeName === 'STRONG') runs.push({ text: node.textContent, strong: true })
      else if (node.nodeName === 'EM') runs.push({ text: node.textContent, em: true })
      else if (node.nodeName === 'BR') runs.push({ br: true })
      else if (node.nodeName === 'SPAN' && !(node.className || '').trim()) {
        // ostylat span (key-omslag i legacy-JSX) — platta ut
        collectInline(node, runs)
      } else throw new Error(`okänd inline-nod <${node.nodeName}> i: ${el.outerHTML.slice(0, 160)}`)
    }
  }

  function toRuns(el) {
    const runs = []
    collectInline(el, runs)
    // Slå ihop angränsande rena textnoder
    const merged = []
    for (const r of runs) {
      const prev = merged[merged.length - 1]
      if (prev && 'text' in prev && !prev.strong && !prev.em && 'text' in r && !r.strong && !r.em) {
        prev.text += r.text
      } else merged.push({ ...r })
    }
    if (merged.length === 1 && 'text' in merged[0] && !merged[0].strong && !merged[0].em) {
      return merged[0].text
    }
    return merged
  }

  const blocks = []
  let componentIdx = 0
  let seenH2 = false

  for (const el of article.children) {
    const cls = el.className || ''
    const tag = el.tagName

    if (tag === 'H2') {
      blocks.push({ type: 'h2', text: toRuns(el), ...(cls.includes('mt-6') && !seenH2 ? { tight: true } : {}) })
      seenH2 = true
    } else if (tag === 'H3') {
      blocks.push({ type: 'h3', text: toRuns(el) })
    } else if (tag === 'P') {
      if (cls.includes('text-sm') && cls.includes('text-neutral-600')) {
        blocks.push({ type: 'note', text: toRuns(el) })
      } else if (cls.includes('text-sm') && cls.includes('text-neutral-500')) {
        blocks.push({ type: 'note', text: toRuns(el), subtle: true })
      } else if (cls === '' || cls === 'mt-3') {
        blocks.push({ type: 'p', text: toRuns(el), ...(cls === '' ? { flush: true } : {}) })
      } else throw new Error(`okänd p-klass "${cls}"`)
    } else if (tag === 'IMG' || tag === 'PICTURE') {
      const img = tag === 'IMG' ? el : el.querySelector('img')
      const source = tag === 'PICTURE' ? el.querySelector('source[type="image/webp"]') : null
      blocks.push({
        type: 'img',
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') ?? '',
        width: Number(img.getAttribute('width')),
        height: Number(img.getAttribute('height')),
        ...(source ? { webpSrc: source.getAttribute('srcset') } : {}),
      })
    } else if (tag === 'UL' || tag === 'OL') {
      const gapMatch = cls.match(/space-y-(\d)/)
      const gap = gapMatch ? Number(gapMatch[1]) : 2
      blocks.push({
        type: tag.toLowerCase(),
        items: [...el.querySelectorAll(':scope > li')].map(toRuns),
        ...(gap !== 2 ? { gap } : {}),
      })
    } else if (tag === 'DIV') {
      const firstChild = el.firstElementChild
      const hasSectionRoot =
        firstChild &&
        (firstChild.tagName === 'SECTION' ||
          (firstChild.tagName === 'DIV' && firstChild.firstElementChild?.tagName === 'SECTION'))

      if (hasSectionRoot || el.querySelector(':scope > div > section')) {
        // Inbäddad info-komponent
        const name = componentNames[componentIdx++]
        if (!name) throw new Error('komponent i DOM utan post i COMPONENT_EMBEDS')
        blocks.push({ type: 'component', name, ...(cls.includes('mt-8') ? { className: 'mt-8' } : {}) })
      } else if (cls.includes('bg-blue-50')) {
        blocks.push({ type: 'callout', text: toRuns(el) })
      } else if (cls.includes('space-y-1') && cls.includes('bg-neutral-100')) {
        blocks.push({
          type: 'infoBox',
          items: [...el.querySelectorAll(':scope > p')].map(toRuns),
        })
      } else if (cls.includes('bg-neutral-100') && el.querySelector(':scope > p.font-mono')) {
        blocks.push({ type: 'formula', text: toRuns(el.querySelector(':scope > p')) })
      } else if (cls.includes('grid') && cls.includes('sm:grid-cols-2')) {
        blocks.push({
          type: 'tableGrid',
          tables: [...el.children].map(card => ({
            header: card.querySelector(':scope > div').textContent,
            rows: [...card.querySelectorAll('tbody tr')].map(tr =>
              [...tr.children].map(td => td.textContent)
            ),
          })),
        })
      } else if (cls.includes('overflow-x-auto')) {
        const table = el.querySelector('table')
        blocks.push({
          type: 'table',
          variant: table.className.includes('border-collapse') ? 'bordered' : 'plain',
          headers: [...table.querySelectorAll('thead th')].map(th => th.textContent),
          rows: [...table.querySelectorAll('tbody tr')].map(tr =>
            [...tr.children].map(td => td.textContent)
          ),
        })
      } else if (cls.trim() === 'space-y-4') {
        blocks.push({
          type: 'cards',
          items: [...el.children].map(card => {
            const title = card.querySelector(':scope > div.font-semibold')
            const label = card.querySelector(':scope > div.text-xs')
            const text = card.querySelector(':scope > div.text-sm')
            if (!title || !text) throw new Error(`oväntat kort: ${card.outerHTML.slice(0, 160)}`)
            return {
              title: title.textContent,
              ...(label ? { label: label.textContent } : {}),
              text: text.textContent,
              color: card.className.replace('rounded-xl border p-4', '').trim(),
            }
          }),
        })
      } else throw new Error(`okänd div-klass "${cls}"`)
    } else throw new Error(`okänt toppnivå-element <${tag} class="${cls}">`)
  }
  return blocks
}

// ── Huvudflöde ──────────────────────────────────────────────────────────────
const localeJson = {
  sv: JSON.parse(readFileSync(path.join(ROOT, 'public/locales/sv/pages-articles.json'), 'utf8')),
  en: JSON.parse(readFileSync(path.join(ROOT, 'public/locales/en/pages-articles.json'), 'utf8')),
}

const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
let written = 0

for (const { key, sv, en } of articles) {
  for (const [lng, urlPath] of [['sv', sv], ['en', en]]) {
    await page.evaluateOnNewDocument(l => localStorage.setItem('i18n_language', l), lng)
    await page.goto(`${ORIGIN}/${urlPath}`, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.waitForFunction(() => {
      const h1 = document.querySelector('main h1')
      return !!h1 && h1.textContent.trim().length > 0
    })
    const body = await page.evaluate(extractBody, COMPONENT_EMBEDS[key] ?? [])

    const legacy = localeJson[lng][key]
    if (!legacy) throw new Error(`${key} saknas i ${lng}/pages-articles.json`)

    const content = {
      seo: legacy.seo,
      layout: legacy.layout,
      schema: legacy.schema,
      body,
      ...(legacy.faq ? { faq: legacy.faq } : {}),
      ...(legacy.sources ? { sources: legacy.sources } : {}),
      ...(legacy.related ? { related: legacy.related } : {}),
    }

    const outDir = path.join(ROOT, 'public', 'locales', lng, 'articles')
    mkdirSync(outDir, { recursive: true })
    writeFileSync(path.join(outDir, `${key}.json`), JSON.stringify(content, null, 2) + '\n', 'utf8')
    written++
    console.log(`✓ ${lng}/articles/${key}.json (${body.length} block)`)
  }
}

await browser.close()
console.log(`\n${written} filer skrivna`)
