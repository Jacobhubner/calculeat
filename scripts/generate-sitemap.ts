/**
 * Genererar public/sitemap.xml från PAGE_CONFIGS (Fas 5 i SEO-överhalningen).
 * Ersätter den tidigare handskrivna filen — körs i prebuild så sitemapen
 * aldrig kan glida isär från sidkonfigurationen.
 *
 * lastmod skrivs bara när PageConfig har fältet satt (artiklar får det
 * automatiskt från registryts dateModified). Google ignorerar numera
 * changefreq/priority i praktiken men de skadar inte.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { PAGE_CONFIGS, getHreflangAlternates } from '../src/lib/config/pages'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const entries: string[] = []

for (const cfg of PAGE_CONFIGS) {
  if (cfg.noindex) continue // sidor under arbete hör inte hemma i sitemap
  const alts = getHreflangAlternates(cfg)
  const altLines = alts
    .map(a => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`)
    .join('\n')
  for (const entry of Object.values(cfg.locales)) {
    if (!entry) continue
    entries.push(`  <url>
    <loc>${esc(entry.canonical)}</loc>${cfg.lastmod ? `\n    <lastmod>${cfg.lastmod}</lastmod>` : ''}
    <changefreq>${cfg.changefreq ?? 'monthly'}</changefreq>
    <priority>${cfg.priority.toFixed(1)}</priority>
${altLines}
  </url>`)
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`

writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), xml, 'utf8')
console.log(`sitemap.xml: ${entries.length} URL:er`)
