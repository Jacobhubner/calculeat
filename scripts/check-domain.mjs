// Regressionsvakt: failar bygget om den gamla domänen calculeat.se refereras.
// Sajten serveras på calculeat.com — calculeat.se löser inte ens DNS, så varje
// referens (canonical, hreflang, sitemap, JSON-LD, mailto) är ett SEO-fel.
// Körs i prebuild (se package.json). Ren Node utan beroenden så den fungerar
// identiskt på Windows-dev och Vercel-Linux.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
// Negativ lookahead: matcha inte i18n-nycklar som "yazio-vs-calculeat.seo.title"
const FORBIDDEN = /calculeat\.se(?![a-z])/gi
const SCAN_DIRS = ['src']
const SCAN_FILES = ['index.html', 'public/robots.txt', 'public/sitemap.xml', 'vercel.json']
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.json', '.css', '.txt', '.xml'])

const violations = []

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, i) => {
    if (FORBIDDEN.test(line)) {
      violations.push(`${path.relative(ROOT, filePath)}:${i + 1}: ${line.trim()}`)
    }
    FORBIDDEN.lastIndex = 0
  })
}

function scanDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      scanDir(full)
    } else if (EXTENSIONS.has(path.extname(entry))) {
      scanFile(full)
    }
  }
}

for (const dir of SCAN_DIRS) scanDir(path.join(ROOT, dir))
for (const file of SCAN_FILES) {
  try {
    scanFile(path.join(ROOT, file))
  } catch {
    // filen finns inte (t.ex. sitemap.xml efter att generatorn tagit över) — ok
  }
}

if (violations.length > 0) {
  console.error('FEL: referenser till den gamla domänen calculeat.se hittades:\n')
  for (const v of violations) console.error('  ' + v)
  console.error('\nAnvänd SITE_ORIGIN från src/lib/config/pages.ts istället.')
  process.exit(1)
}
console.log('check-domain: OK — inga calculeat.se-referenser.')
