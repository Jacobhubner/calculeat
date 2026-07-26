// Engångs: rastrerar loggan TIGHT (naturlig aspekt, ingen padding) för OG-mallen.
// Output: scripts/og/assets/logo-og.png (bäddas in som data-URI i SVG-mallen)
import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const svg = readFileSync(path.join(ROOT, 'public', 'Calculeat-logo.svg'), 'utf8')

const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1000, height: 600, deviceScaleFactor: 1 })
await page.setContent(`<!doctype html><html><head><style>
  html,body{margin:0;padding:0;background:transparent}
  svg{display:block;width:720px;height:auto}
</style></head><body>${svg}</body></html>`)
await new Promise(r => setTimeout(r, 500))

const el = await page.$('svg')
const png = await el.screenshot({ omitBackground: true })
mkdirSync(path.join(ROOT, 'scripts', 'og', 'assets'), { recursive: true })
writeFileSync(path.join(ROOT, 'scripts', 'og', 'assets', 'logo-og.png'), png)
await browser.close()

const b = png
console.log('logo-og.png', b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), Math.round(b.length / 1024) + ' KB')
