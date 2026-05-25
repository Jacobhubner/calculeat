#!/usr/bin/env node
/**
 * USDA FoodData Central import script
 *
 * Imports Foundation Foods + SR Legacy into food_items.
 * Idempotent: uses UPSERT on (source, external_id).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import_usda.cjs [options]
 *
 * Options:
 *   --file <path>      Path to USDA FDC full JSON download (foundationDownload.json or srLegacyDownload.json)
 *   --type foundation  Import Foundation Foods (default)
 *   --type sr-legacy   Import SR Legacy foods
 *   --dry-run          Parse and filter without writing to DB
 *   --limit <n>        Only process first N records (for testing)
 */

'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(flag) {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : null
}
const FILE_PATH = getArg('--file')
const IMPORT_TYPE = getArg('--type') || 'foundation'
const DRY_RUN = args.includes('--dry-run')
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null

if (!FILE_PATH) {
  console.error('Usage: node import_usda.cjs --file <path> [--type foundation|sr-legacy] [--dry-run] [--limit N]')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (or use --dry-run)')
  process.exit(1)
}

const supabase = DRY_RUN ? null : createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const IMPORT_VERSION = IMPORT_TYPE === 'foundation' ? 'foundation-2026-04' : 'sr-legacy-2018'
const BATCH_SIZE = 200

// Categories to exclude (pruning rules)
const EXCLUDED_CATEGORIES = new Set([
  'Baby Foods',
  'Infant Formula',
  'Dietary Supplements',
  'Dietary Supplements and Fortification Agents',
  'Restaurant Foods',
  'Fast Foods',
  'Meals, Entrees, and Side Dishes',
  'Snacks',       // remove if you want snacks later
])

// Quality scoring
function computeQualityScore(record, dataType) {
  if (dataType === 'SR Legacy') return 88
  // Foundation Foods: use dataPoints from protein nutrient as proxy.
  // Energy nutrient in 2026 release is Calculated (NC) and has no dataPoints.
  const proteinNutrient = findNutrient(record.foodNutrients, 1003, '203')
  const dataPoints = proteinNutrient?.dataPoints ?? 0
  if (dataPoints >= 10) return 95
  if (dataPoints >= 3)  return 90
  return 90 // Calculated nutrients without dataPoints are still analytically verified
}

// ---------------------------------------------------------------------------
// Nutrient lookup helpers
// ---------------------------------------------------------------------------

/**
 * Defensively find a nutrient by primary nutrient.id or fallback nutrient.number.
 * Foundation Foods sometimes uses nutrient.number instead of stable nutrient.id.
 */
function findNutrient(nutrients, primaryId, fallbackNumber) {
  if (!Array.isArray(nutrients)) return null
  return nutrients.find(n =>
    n.nutrient?.id === primaryId ||
    (fallbackNumber && String(n.nutrient?.number) === String(fallbackNumber))
  ) ?? null
}

function getAmount(nutrients, primaryId, fallbackNumber) {
  const hit = findNutrient(nutrients, primaryId, fallbackNumber)
  if (!hit || hit.amount == null) return null
  return Number(hit.amount)
}

/**
 * Extract calories. Foundation Foods uses 2047, SR Legacy uses 1008.
 * Both use kcal. Try 2047 first, fall back to 1008.
 */
function getCalories(nutrients) {
  return (
    getAmount(nutrients, 2047, '208') ??
    getAmount(nutrients, 1008, '208')
  )
}

// ---------------------------------------------------------------------------
// Name normalization
// Stores USDA original name as-is in Phase 1.
// The only normalization is trimming and collapsing whitespace.
// ---------------------------------------------------------------------------
function normalizeName(raw) {
  return (raw || '').replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// Food type classification from USDA foodCategory
//
// Maps USDA FDC foodCategory.description → { foodType, mlPerGram }
//
// foodType drives energy_density_color thresholds in the DB trigger:
//   Solid:  Green < 1.0, Yellow 1.0–2.4, Orange > 2.4 kcal/g
//   Liquid: Green < 0.4, Yellow 0.4–0.5, Orange > 0.5 kcal/g
//   Soup:   Green < 0.5, Yellow 0.5–1.0, Orange > 1.0 kcal/g
//
// mlPerGram enables volume units (ml/dl/msk/tsk) in the unit selector.
// reference_unit stays 'g' — nutrition values remain canonical per 100g.
//
// mlPerGram = 1.0 is a Phase 1 approximation for beverages/soups.
// Real densities vary (juice ~1.04, syrup ~1.3, broth ~1.0) but 1.0
// is close enough for volume-unit UX without per-item density data.
// Oils use 0.92 (standard vegetable oil density).
// ---------------------------------------------------------------------------
const FOOD_TYPE_MAP = {
  // Liquids — ml_per_gram ≈ 1.0 (water-density approximation)
  'Beverages':                     { foodType: 'Liquid', mlPerGram: 1.0 },
  'Fruit and Vegetable Juices':    { foodType: 'Liquid', mlPerGram: 1.0 },

  // Soups & sauces — liquid-adjacent, own thresholds
  'Soups, Sauces, and Gravies':    { foodType: 'Soup',   mlPerGram: 1.0 },

  // Fats & oils — solid food_type but with known approximate density
  'Fats and Oils':                 { foodType: 'Solid',  mlPerGram: 0.92 },
}

/**
 * Resolve food_type and ml_per_gram from a USDA foodCategory string.
 * Defaults to Solid with no ml_per_gram for unrecognized categories.
 */
function resolveFoodTypeFromUsdaCategory(category) {
  return FOOD_TYPE_MAP[category] ?? { foodType: 'Solid', mlPerGram: null }
}

// ---------------------------------------------------------------------------
// Extended nutrient mapping: USDA FDC nutrient ID → { code, unit }
//
// Macros (calories, protein, fat, carbohydrates) are canonical in food_items
// and intentionally excluded here — no duplication in food_nutrients.
//
// Units stored as-is from USDA (mg, ug, g) — not normalized away.
// ---------------------------------------------------------------------------
const EXTENDED_NUTRIENT_MAP = [
  // Lipids
  { id: 1258, number: '606', code: 'saturated_fat',        unit: 'g'  },
  { id: 1292, number: '645', code: 'monounsaturated_fat',  unit: 'g'  },
  { id: 1293, number: '646', code: 'polyunsaturated_fat',  unit: 'g'  },
  { id: 1257, number: '605', code: 'trans_fat',            unit: 'g'  },
  { id: 1253, number: '601', code: 'cholesterol',          unit: 'mg' },
  { id: 1404, number: null,  code: 'omega_3',              unit: 'g'  }, // ALA proxy
  { id: 1316, number: null,  code: 'omega_6',              unit: 'g'  }, // LA proxy

  // Carbohydrates
  { id: 2000, number: '269', code: 'sugars',               unit: 'g'  },
  { id: 1079, number: '291', code: 'fiber',                unit: 'g'  },

  // Minerals
  { id: 1093, number: '307', code: 'sodium',               unit: 'mg' },
  { id: 1092, number: '306', code: 'potassium',            unit: 'mg' },
  { id: 1087, number: '301', code: 'calcium',              unit: 'mg' },
  { id: 1089, number: '303', code: 'iron',                 unit: 'mg' },
  { id: 1090, number: '304', code: 'magnesium',            unit: 'mg' },
  { id: 1091, number: '305', code: 'phosphorus',           unit: 'mg' },
  { id: 1095, number: '309', code: 'zinc',                 unit: 'mg' },
  { id: 1103, number: '317', code: 'selenium',             unit: 'ug' },

  // Vitamins
  { id: 1162, number: '401', code: 'vitamin_c',            unit: 'mg' },
  { id: 1165, number: '404', code: 'thiamin',              unit: 'mg' },
  { id: 1166, number: '405', code: 'riboflavin',           unit: 'mg' },
  { id: 1167, number: '406', code: 'niacin',               unit: 'mg' },
  { id: 1175, number: '415', code: 'vitamin_b6',           unit: 'mg' },
  { id: 1177, number: '417', code: 'folate',               unit: 'ug' },
  { id: 1178, number: '418', code: 'vitamin_b12',          unit: 'ug' },
  { id: 1106, number: '320', code: 'vitamin_a',            unit: 'ug' },
  { id: 1114, number: '328', code: 'vitamin_d',            unit: 'ug' },
  { id: 1109, number: '323', code: 'vitamin_e',            unit: 'mg' },

  // Other
  { id: 1051, number: '255', code: 'water',                unit: 'g'  },
  { id: 1018, number: '221', code: 'alcohol',              unit: 'g'  },
  { id: 1057, number: '262', code: 'caffeine',             unit: 'mg' },
]

/**
 * Parse extended nutrients for a USDA record.
 * Returns array of food_nutrients rows (without food_item_id — added later).
 */
function parseExtendedNutrients(nutrients) {
  const rows = []
  for (const mapping of EXTENDED_NUTRIENT_MAP) {
    const hit = nutrients.find(n =>
      n.nutrient?.id === mapping.id ||
      (mapping.number && String(n.nutrient?.number) === String(mapping.number))
    )
    if (!hit || hit.amount == null) continue
    const amount = Number(hit.amount)
    if (isNaN(amount)) continue
    rows.push({
      nutrient_code: mapping.code,
      amount: Math.round(Math.max(0, amount) * 100000) / 100000,
      unit: mapping.unit,
      reference_amount: 100,
      reference_unit: 'g',
    })
  }
  return rows
}

// ---------------------------------------------------------------------------
// data_hash (SHA-256 of nutrition fields, excluding name — same as existing pattern)
// ---------------------------------------------------------------------------
function computeDataHash(calories, fat, carb, protein) {
  const payload = JSON.stringify({ calories, fat_g: fat, carb_g: carb, protein_g: protein })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// ---------------------------------------------------------------------------
// Parse and filter a single USDA record
// Returns a food_items row object or null if excluded.
// ---------------------------------------------------------------------------
function parseRecord(record, dataType) {
  if (!record) return null
  const name = normalizeName(record.description)
  if (!name) return null

  // Category pruning + food type classification
  const category = (record.foodCategory?.description || record.foodCategory || '').trim()
  if (EXCLUDED_CATEGORIES.has(category)) return null
  const { foodType, mlPerGram } = resolveFoodTypeFromUsdaCategory(category)

  const nutrients = record.foodNutrients || []

  // Must have energy
  const calories = getCalories(nutrients)
  if (calories == null) return null
  // Accept zero-calorie foods (water, plain coffee) — they are valid

  // Must have at least 3 of the 4 core macros
  const fat = getAmount(nutrients, 1004, '204')
  const carb = getAmount(nutrients, 1005, '205')
  const protein = getAmount(nutrients, 1003, '203')
  const macroCount = [fat, carb, protein].filter(v => v != null).length
  if (macroCount < 3) return null

  // Extended nutrients (nullable)
  const fiber = getAmount(nutrients, 1079, '291')
  const sugars = getAmount(nutrients, 2000, '269')
  const saturatedFat = getAmount(nutrients, 1258, '606')
  const sodiumMg = getAmount(nutrients, 1093, '307')
  const saltG = sodiumMg != null ? Math.round((sodiumMg * 2.5 / 1000) * 10000) / 10000 : null

  const qualityScore = computeQualityScore(record, dataType)
  const externalId = String(record.fdcId)
  const importVersion = IMPORT_VERSION

  // kcal_per_gram for energy density color (based on per-100g values)
  const kcalPerGram = calories / 100

  return {
    foodItem: {
      user_id: null,
      shared_list_id: null,
      source: 'usda',
      name,
      brand: record.brandOwner || null,
      barcode: null,
      is_recipe: false,
      is_hidden: false,
      calories: Math.round(Math.max(0, calories) * 100) / 100,
      fat_g: fat != null ? Math.round(Math.max(0, fat) * 100) / 100 : 0,
      carb_g: carb != null ? Math.round(Math.max(0, carb) * 100) / 100 : 0,
      protein_g: protein != null ? Math.round(Math.max(0, protein) * 100) / 100 : 0,
      food_type: foodType,
      ml_per_gram: mlPerGram,
      default_amount: 100,
      default_unit: 'g',
      reference_amount: 100,
      reference_unit: 'g',
      kcal_per_gram: Math.round(kcalPerGram * 10000) / 10000,
      data_quality_score: qualityScore,
      external_id: externalId,
      imported_at: new Date().toISOString(),
      import_version: importVersion,
      data_hash: computeDataHash(calories, fat ?? 0, carb ?? 0, protein ?? 0),
    },
    nutrients: parseExtendedNutrients(nutrients),
  }
}

// ---------------------------------------------------------------------------
// Deduplication: when same ndbNumber appears in both Foundation + SR Legacy,
// keep the one with the latest publicationDate.
// We do this in-memory before inserting.
// ---------------------------------------------------------------------------
function deduplicateByNdbNumber(pairs, rawByIndex) {
  const best = new Map() // ndbNumber → { pair, publicationDate }
  for (let i = 0; i < pairs.length; i++) {
    const raw = rawByIndex[i]
    const ndbNumber = raw.ndbNumber || raw.fdcId
    const pubDate = raw.publicationDate || '1900-01-01'
    const existing = best.get(ndbNumber)
    if (!existing || pubDate > existing.publicationDate) {
      best.set(ndbNumber, { pair: pairs[i], publicationDate: pubDate })
    }
  }
  return Array.from(best.values()).map(v => v.pair)
}

// ---------------------------------------------------------------------------
// DB UPSERT — food_items batch
// Returns array of { id, external_id } for nutrient linking.
// ---------------------------------------------------------------------------
async function upsertFoodItemsBatch(rows) {
  const { data, error } = await supabase
    .from('food_items')
    .upsert(rows, {
      onConflict: 'source,external_id',
      ignoreDuplicates: false,
    })
    .select('id, external_id')

  if (error) throw error
  return data ?? []
}

// ---------------------------------------------------------------------------
// DB INSERT — food_nutrients batch
// Strategy: delete existing nutrients for these food_item_ids, then insert fresh.
// Simpler than upsert merge — nutrients are small and re-import is idempotent.
// ---------------------------------------------------------------------------
async function replaceNutrientsBatch(foodItemIds, nutrientRows) {
  if (nutrientRows.length === 0) return

  // Delete existing nutrients for this batch of food items
  const { error: delError } = await supabase
    .from('food_nutrients')
    .delete()
    .in('food_item_id', foodItemIds)

  if (delError) throw delError

  // Insert fresh
  const { error: insError } = await supabase
    .from('food_nutrients')
    .insert(nutrientRows)

  if (insError) throw insError
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nUSDA FDC Import — ${IMPORT_TYPE}`)
  console.log(`File: ${FILE_PATH}`)
  console.log(`Dry run: ${DRY_RUN}`)
  if (LIMIT) console.log(`Limit: ${LIMIT}`)
  console.log()

  // Load JSON
  const raw = JSON.parse(fs.readFileSync(path.resolve(FILE_PATH), 'utf8'))

  // FDC full download wraps records in a key based on type
  let rawRecords
  if (Array.isArray(raw)) {
    rawRecords = raw
  } else if (raw.FoundationFoods) {
    rawRecords = raw.FoundationFoods
  } else if (raw.SRLegacyFoods) {
    rawRecords = raw.SRLegacyFoods
  } else {
    // Some exports use a generic wrapper
    const key = Object.keys(raw).find(k => Array.isArray(raw[k]))
    if (!key) throw new Error('Cannot find food records array in JSON. Check the file structure.')
    rawRecords = raw[key]
  }

  const dataType = IMPORT_TYPE === 'foundation' ? 'Foundation' : 'SR Legacy'
  console.log(`Total records in file: ${rawRecords.length}`)

  if (LIMIT) rawRecords = rawRecords.slice(0, LIMIT)

  // Parse + filter
  const stats = { inserted: 0, pruned: 0, nutrientRows: 0 }
  const parsedPairs = [] // { foodItem, nutrients, raw }

  for (const rawRecord of rawRecords) {
    const parsed = parseRecord(rawRecord, dataType)
    if (!parsed) {
      stats.pruned++
      continue
    }
    parsedPairs.push({ ...parsed, raw: rawRecord })
  }

  console.log(`After filtering: ${parsedPairs.length} records (pruned: ${stats.pruned})`)

  // Deduplication by ndbNumber
  const rawRefs = parsedPairs.map(p => p.raw)
  const deduped = deduplicateByNdbNumber(parsedPairs, rawRefs)
  const dedupedCount = parsedPairs.length - deduped.length
  if (dedupedCount > 0) {
    console.log(`Deduplicated ${dedupedCount} duplicate ndbNumber records`)
  }

  console.log(`Final import count: ${deduped.length}`)

  if (DRY_RUN) {
    const sample = deduped.slice(0, 3)
    console.log('\nDry run — first 3 food_items rows:')
    sample.forEach(p => console.log(JSON.stringify(p.foodItem, null, 2)))
    console.log('\nDry run — nutrients for first item:')
    console.log(JSON.stringify(sample[0]?.nutrients ?? [], null, 2))
    const totalNutrientRows = deduped.reduce((sum, p) => sum + p.nutrients.length, 0)
    console.log(`\nTotal nutrient rows (all items): ${totalNutrientRows}`)
    console.log(`Avg nutrients per item: ${(totalNutrientRows / deduped.length).toFixed(1)}`)
    console.log('\nDry run complete. No data written.')
    return
  }

  // Step 1: Upsert food_items in batches, collect returned ids
  console.log(`\nStep 1/2 — Upserting food_items in batches of ${BATCH_SIZE}...`)
  const allInserted = [] // { id, external_id }
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE)
    try {
      const returned = await upsertFoodItemsBatch(batch.map(p => p.foodItem))
      allInserted.push(...returned)
      stats.inserted += batch.length
      process.stdout.write(`\r  ${i + batch.length}/${deduped.length}`)
    } catch (err) {
      console.error(`\nBatch error at offset ${i}:`, err.message)
      throw err
    }
  }

  // Build external_id → food_item_id map
  const idMap = new Map(allInserted.map(r => [r.external_id, r.id]))

  // Step 2: Replace nutrients in batches
  console.log(`\n\nStep 2/2 — Replacing food_nutrients in batches of ${BATCH_SIZE}...`)
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE)
    const foodItemIds = []
    const nutrientRows = []

    for (const pair of batch) {
      const foodItemId = idMap.get(pair.foodItem.external_id)
      if (!foodItemId) continue
      foodItemIds.push(foodItemId)
      for (const n of pair.nutrients) {
        nutrientRows.push({ ...n, food_item_id: foodItemId })
        stats.nutrientRows++
      }
    }

    try {
      await replaceNutrientsBatch(foodItemIds, nutrientRows)
      process.stdout.write(`\r  ${i + batch.length}/${deduped.length}`)
    } catch (err) {
      console.error(`\nNutrient batch error at offset ${i}:`, err.message)
      throw err
    }
  }

  console.log(`\n\nImport complete:`)
  console.log(`  Food items inserted/updated: ${stats.inserted}`)
  console.log(`  Nutrient rows written: ${stats.nutrientRows}`)
  console.log(`  Avg nutrients per item: ${(stats.nutrientRows / stats.inserted).toFixed(1)}`)
  console.log(`  Pruned (filtered): ${stats.pruned}`)
  console.log(`  Deduped: ${dedupedCount}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
