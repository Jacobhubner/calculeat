const { join } = require('path')

/**
 * Puppeteers Chrome-nedladdning hamnar som default i ~/.cache/puppeteer —
 * en katalog Vercel INTE bevarar mellan builds (bara node_modules cachas).
 * Med cachen inuti node_modules/.cache överlever Chrome build-cachen, och
 * "puppeteer browsers install chrome" i prerender-steget blir en snabb no-op
 * när binären redan finns.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
}
