// Fas 2 i SEO-överhalningen: fångar "golden snapshots" av den renderade
// artikeltexten för alla artikel-URL:er (sv + en). Facit används senare för
// att bevisa att artikelmigreringen (Fas 4) inte ändrar ett enda tecken.
//
// Körning:  1) npm run build:spa && npx vite preview --port 4173  (eller npm run dev)
//           2) node scripts/capture-golden-text.mjs [--port 4173] [--diff]
//
// --diff: jämför mot befintliga snapshots istället för att skriva om dem;
//         exit 1 vid avvikelse. Utan flaggan skrivs test/golden/{key}.{lng}.txt.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'test', 'golden')
const portArg = process.argv.indexOf('--port')
const PORT = portArg > -1 ? process.argv[portArg + 1] : '4173'
const DIFF_MODE = process.argv.includes('--diff')
const ORIGIN = `http://localhost:${PORT}`

// Artikel-paths läses från pages.ts via enkel regex-parsning (undviker
// TS-import i .mjs). Formatet är stabilt: category: 'article' + path-strängar.
const pagesTs = readFileSync(path.join(ROOT, 'src', 'lib', 'config', 'pages.ts'), 'utf8')
const articleBlocks = pagesTs.split(/\{\s*\n\s*key:/).filter(b => b.includes("category: 'article'"))
const routes = []
for (const block of articleBlocks) {
  const key = block.match(/^\s*'([^']+)'/)?.[1]
  const paths = [...block.matchAll(/path:\s*'([^']+)'/g)].map(m => m[1])
  for (const p of paths) {
    const lng = p.startsWith('en/') ? 'en' : 'sv'
    routes.push({ key, lng, urlPath: '/' + p })
  }
}
if (routes.length === 0) {
  console.error('Hittade inga artikel-routes i pages.ts — har formatet ändrats?')
  process.exit(1)
}

const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
let failures = 0

for (const { key, lng, urlPath } of routes) {
  await page.evaluateOnNewDocument(l => localStorage.setItem('i18n_language', l), lng)
  await page.goto(ORIGIN + urlPath, { waitUntil: 'networkidle0', timeout: 30_000 })
  await page.waitForFunction(() => {
    const h1 = document.querySelector('main h1')
    return !!h1 && h1.textContent.trim().length > 0
  })
  const text = await page.evaluate(() => document.querySelector('main').innerText)
  const normalized = text.replace(/\s+/g, ' ').trim()
  const file = path.join(OUT_DIR, `${key}.${lng}.txt`)

  if (DIFF_MODE) {
    if (!existsSync(file)) {
      console.error(`SAKNAS: ${file} — kör utan --diff först`)
      failures++
    } else if (readFileSync(file, 'utf8') !== normalized) {
      console.error(`DIFF: ${key} (${lng}) — renderad text avviker från golden snapshot`)
      failures++
    } else {
      console.log(`OK   ${key} (${lng})`)
    }
  } else {
    mkdirSync(OUT_DIR, { recursive: true })
    writeFileSync(file, normalized, 'utf8')
    console.log(`✓ ${key} (${lng}) — ${normalized.length} tecken`)
  }
}

await browser.close()
if (DIFF_MODE && failures > 0) {
  console.error(`\n${failures} avvikelser — artikeltexten har ändrats!`)
  process.exit(1)
}
console.log(DIFF_MODE ? '\nAlla snapshots identiska.' : `\n${routes.length} snapshots skrivna till test/golden/`)
