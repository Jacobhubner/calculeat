// Engångs: rastrerar public/Calculeat-logo.svg till public/logo-512.png
// (Organization-schemats publisher.logo kräver rasterbild ≥112×112).
// Loggan är i praktiken en base64-PNG i SVG-skal med filter — puppeteer
// renderar hela kedjan korrekt, till skillnad från rena SVG-rastrerare.
import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const svg = readFileSync(path.join(ROOT, 'public', 'Calculeat-logo.svg'), 'utf8')

const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 })
await page.setContent(`<!doctype html><html><head><style>
  html,body{margin:0;padding:0;background:transparent}
  #box{width:512px;height:512px;display:flex;align-items:center;justify-content:center}
  #box svg{max-width:512px;max-height:512px;width:100%;height:auto}
</style></head><body><div id="box">${svg}</div></body></html>`)
await new Promise(r => setTimeout(r, 500)) // låt filter/bild rendera klart

const el = await page.$('#box')
const png = await el.screenshot({ omitBackground: true })
writeFileSync(path.join(ROOT, 'public', 'logo-512.png'), png)
await browser.close()
console.log('public/logo-512.png skriven')
