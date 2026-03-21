/**
 * validate-i18n.ts
 *
 * CI script that verifies every sv locale key has a matching en key (and vice
 * versa). Run with: npx tsx scripts/validate-i18n.ts
 *
 * Exit code 0 → all good.
 * Exit code 1 → mismatches found (CI will fail).
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const LOCALES_DIR = join(process.cwd(), 'public', 'locales')
const MASTER_LOCALE = 'sv'
const OTHER_LOCALES = ['en']

type JsonObject = { [key: string]: unknown }

function loadJson(filePath: string): JsonObject {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as JsonObject
  } catch {
    console.error(`  ✗ Could not read ${filePath}`)
    process.exit(1)
  }
}

/**
 * Recursively collect all dot-separated key paths from an object.
 * E.g. { a: { b: 'x' } } → ['a.b']
 */
function collectKeys(obj: JsonObject, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as JsonObject, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

let errors = 0

const namespaces = readdirSync(join(LOCALES_DIR, MASTER_LOCALE)).filter((f) =>
  f.endsWith('.json')
)

for (const ns of namespaces) {
  const masterPath = join(LOCALES_DIR, MASTER_LOCALE, ns)
  const masterData = loadJson(masterPath)
  const masterKeys = collectKeys(masterData)

  for (const locale of OTHER_LOCALES) {
    const localePath = join(LOCALES_DIR, locale, ns)
    const localeData = loadJson(localePath)
    const localeKeys = collectKeys(localeData)

    const masterSet = new Set(masterKeys)
    const localeSet = new Set(localeKeys)

    const missingInLocale = masterKeys.filter((k) => !localeSet.has(k))
    const extraInLocale = localeKeys.filter((k) => !masterSet.has(k))

    if (missingInLocale.length > 0 || extraInLocale.length > 0) {
      console.error(`\n[${ns}] ${MASTER_LOCALE} ↔ ${locale} mismatch:`)
      for (const k of missingInLocale) {
        console.error(`  Missing in ${locale}: ${k}`)
        errors++
      }
      for (const k of extraInLocale) {
        console.error(`  Extra in ${locale} (not in ${MASTER_LOCALE}): ${k}`)
        errors++
      }
    } else {
      console.log(`  ✓ ${ns} — ${MASTER_LOCALE} ↔ ${locale} OK (${masterKeys.length} keys)`)
    }
  }
}

if (errors > 0) {
  console.error(`\n✗ ${errors} i18n key mismatch(es) found. Fix before merging.\n`)
  process.exit(1)
} else {
  console.log('\n✓ All locale files are in sync.\n')
}
