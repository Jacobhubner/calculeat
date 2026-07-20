/**
 * Prerendering (Fas 6 i SEO-överhalningen). Körs i postbuild.
 *
 * Startar Vites preview-server mot dist/, besöker varje publik route från
 * PAGE_CONFIGS med Puppeteer och skriver den färdigrenderade HTML:en till
 * dist/<path>/index.html. Crawlers och sociala botar får då komplett HTML
 * (title, meta, OG, JSON-LD, innehåll) utan att köra JavaScript, medan
 * klienten tar över som vanligt när appen laddat (main.tsx använder
 * createRoot — snapshotten ersätts, ingen hydration-problematik).
 *
 * VIKTIGT: dist/index.html kopieras till dist/app-shell.html FÖRE hem-
 * snapshotten skrivs — vercel.json rewritar icke-prerendrade rutter
 * (/app/*, /login m.fl.) dit, annars skulle de serva hemsidans snapshot.
 *
 * Failar bygget hårt om någon route inte når ready-state — hellre stoppa
 * deployen än att skeppa tomma sidor till Google.
 */
import { preview } from 'vite'
import puppeteer, { Browser, Page } from 'puppeteer'
import { mkdirSync, writeFileSync, copyFileSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { PAGE_CONFIGS } from '../src/lib/config/pages'
import type { SupportedLocale } from '../src/lib/config/pages'

const PORT = 4173
const ORIGIN = `http://localhost:${PORT}`
const DIST = path.join(process.cwd(), 'dist')
// Snapshots skrivs hit under körningen och mergas in i dist/ EFTERÅT.
// Skrivs de direkt till dist/ servar SPA-fallbacken redan-snapshottade sidor
// (med inbakade helmet-taggar) till rutter som ännu inte renderats → Helmets
// reconciling mot främmande data-rh-taggar gör canonical-läget odeterministiskt.
const STAGING = path.join(process.cwd(), 'dist-prerender')

const IS_VERCEL = !!process.env.VERCEL
// Vercels byggmaskin har 2 kärnor — fler parallella flikar ger inget där
const CONCURRENCY = IS_VERCEL ? 4 : 6

const EXTRA_ARGS = [
  // Bakgrundsflikar får inte throttlas — rAF/timers måste ticka i alla workers
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
]

/**
 * Vercels byggcontainer (Amazon Linux 2023) saknar systembiblioteken som
 * Googles Chrome-binär är dynamiskt länkad mot (libnspr4 m.fl.) — därför
 * används @sparticuz/chromium där: en Chromium byggd för Amazon Linux med
 * allt inbakat. Deras Lambda-flaggor --single-process/--no-zygote filtreras
 * bort — de behövs bara i Lambdas processmodell och är instabila med flera
 * parallella browser-kontexter. Lokalt används puppeteers egna Chrome
 * (cache i node_modules/.cache via .puppeteerrc.cjs).
 */
async function launchBrowser(): Promise<Browser> {
  if (IS_VERCEL) {
    const { default: chromium } = await import('@sparticuz/chromium')
    const args = chromium.args.filter(a => a !== '--single-process' && a !== '--no-zygote')
    return puppeteer.launch({
      args: [...args, ...EXTRA_ARGS],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as 'shell',
    })
  }
  // Idempotent — snabb no-op när Chrome redan finns i cachen
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' })
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', ...EXTRA_ARGS],
  })
}

interface RouteJob {
  urlPath: string
  lng: SupportedLocale
  expectedCanonical: string | null
}

// Rutlistan drivs HELT från PAGE_CONFIGS → nya artiklar följer med automatiskt
const jobs: RouteJob[] = [{ urlPath: '/', lng: 'sv', expectedCanonical: null }]
for (const cfg of PAGE_CONFIGS) {
  if (cfg.noindex) continue // sidor under arbete prerenderas ej
  for (const [lng, entry] of Object.entries(cfg.locales) as [
    SupportedLocale,
    { path: string; canonical: string } | undefined,
  ][]) {
    if (entry) {
      jobs.push({ urlPath: '/' + entry.path, lng, expectedCanonical: entry.canonical })
    }
  }
}

async function renderRoute(page: Page, job: RouteJob) {
  await page.goto(ORIGIN + job.urlPath, { waitUntil: 'networkidle0', timeout: 45_000 })

  // Ready = i18n laddad + Helmet flushad: rätt canonical, h1 med text, JSON-LD
  await page.waitForFunction(
    (canonical: string | null) => {
      const h1 = document.querySelector('h1')
      if (!h1 || !h1.textContent || h1.textContent.trim().length === 0) return false
      const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (canonical && link?.href !== canonical) return false
      if (canonical && !document.querySelector('script[type="application/ld+json"]')) return false
      return true
    },
    { timeout: 20_000 },
    job.expectedCanonical
  )

  const html = await page.evaluate(() => '<!doctype html>' + document.documentElement.outerHTML)

  const outDir = job.urlPath === '/' ? STAGING : path.join(STAGING, job.urlPath.slice(1))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'index.html'), html, 'utf8')
}

async function worker(browser: Browser, queue: RouteJob[], failures: string[]) {
  // Egen browser-kontext per worker: localStorage delas annars mellan flikar,
  // och språkseedningen (i18n_language) racear mellan sv- och en-jobb
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  // Snabba upp: blockera bilder/fonter/media — men ALDRIG /locales/*.json
  await page.setRequestInterception(true)
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) void req.abort()
    else void req.continue()
  })

  for (let job = queue.shift(); job; job = queue.shift()) {
    try {
      // Seeda språkdetektorn så detekterat språk matchar sidans locale.
      // Registrerade scripts ackumuleras och körs i ordning vid navigation —
      // senast registrerade (= aktuellt jobb) vinner.
      await page.evaluateOnNewDocument(l => localStorage.setItem('i18n_language', l), job.lng)
      await renderRoute(page, job)
      console.log('✓', job.urlPath)
    } catch (e) {
      // Diagnostik: vad såg sidan när väntan gav upp?
      const state = await page
        .evaluate(() => ({
          h1: document.querySelector('h1')?.textContent?.slice(0, 60) ?? null,
          canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null,
        }))
        .catch(() => null)
      failures.push(
        `${job.urlPath}: ${(e as Error).message.split('\n')[0]} | såg: ${JSON.stringify(state)} | väntade canonical: ${job.expectedCanonical}`
      )
    }
  }
  await context.close()
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/index.html saknas — kör vite build först')
    process.exit(1)
  }

  // Bevara ren SPA-shell för icke-prerendrade rutter INNAN "/" skrivs över.
  // Guard: vid omkörning utan ny vite build är index.html redan en snapshot —
  // skriv då inte över den bevarade shellen.
  if (!existsSync(path.join(DIST, 'app-shell.html'))) {
    copyFileSync(path.join(DIST, 'index.html'), path.join(DIST, 'app-shell.html'))
  }

  // Deterministiskt underlag: återställ ren shell på "/" och rensa ev. gamla
  // snapshots (lokala omkörningar) så ingen route servas som färdig snapshot
  copyFileSync(path.join(DIST, 'app-shell.html'), path.join(DIST, 'index.html'))
  for (const job of jobs) {
    if (job.urlPath === '/') continue
    const stale = path.join(DIST, job.urlPath.slice(1), 'index.html')
    if (existsSync(stale)) rmSync(stale)
  }
  rmSync(STAGING, { recursive: true, force: true })

  const started = Date.now()
  const server = await preview({ preview: { port: PORT, strictPort: true } })
  const browser = await launchBrowser()

  const failures: string[] = []
  const queue = [...jobs]
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(browser, queue, failures)))

  await browser.close()
  await server.close()

  if (failures.length > 0) {
    console.error(`\nPRERENDER MISSLYCKADES för ${failures.length} rutter:`)
    for (const f of failures) console.error('  ' + f)
    rmSync(STAGING, { recursive: true, force: true })
    process.exit(1)
  }

  // Allt grönt — merga staging in i dist
  function mergeDir(from: string, to: string) {
    mkdirSync(to, { recursive: true })
    for (const entry of readdirSync(from, { withFileTypes: true })) {
      const src = path.join(from, entry.name)
      const dst = path.join(to, entry.name)
      if (entry.isDirectory()) mergeDir(src, dst)
      else copyFileSync(src, dst)
    }
  }
  mergeDir(STAGING, DIST)
  rmSync(STAGING, { recursive: true, force: true })

  console.log(
    `\nPrerendrade ${jobs.length} rutter på ${((Date.now() - started) / 1000).toFixed(1)}s`
  )
}

void main()
