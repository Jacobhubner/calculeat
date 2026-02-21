/**
 * Import script for Livsmedelsverket (Swedish Food Agency) food database.
 *
 * Fetches ~2575 foods + nutrients from SLV's public API and upserts into
 * CalculEat's Supabase database. Idempotent via (source, external_id) UNIQUE index.
 *
 * Usage:
 *   npx tsx scripts/import-livsmedelsverket.ts
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(import.meta.dirname, '..', '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// --- SLV API types ---

const SLV_BASE = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1'
const PAGE_SIZE = 100

interface SLVMeta {
  totalRecords: number
  offset: number
  limit: number
  count: number
}

interface SLVFood {
  nummer: number
  namn: string
  vetenskapligtNamn?: string
  livsmedelsTyp?: string
}

interface SLVFoodPage {
  _meta: SLVMeta
  livsmedel: SLVFood[]
}

interface SLVNutrient {
  namn: string
  euroFIRkod: string
  varde: number
  enhet: string
  viktGram: number
  matrisenhetkod?: string // "W" = per 100g edible, "F" = per 100g fatty acids
}

// --- EuroFIR code mapping ---
// Maps SLV euroFIRkod to our nutrient_code.
// Only codes in this map will be imported.

const EUROFIR_TO_NUTRIENT_CODE: Record<string, string> = {
  // ENERC is handled specially (kcal vs kJ) — see below
  FAT: 'fat',
  FASAT: 'saturated_fat',
  FAMS: 'monounsaturated_fat',
  FAPU: 'polyunsaturated_fat',
  CHO: 'carbohydrates', // SLV uses CHO, our code is CHOAVL but nutrient_code is 'carbohydrates'
  FIBT: 'fiber',
  SUGAR: 'sugars',
  PROT: 'protein',
  ALC: 'alcohol',
  WATER: 'water',
  VITA: 'vitamin_a',
  VITD: 'vitamin_d',
  VITE: 'vitamin_e',
  // VITK not provided by SLV
  VITC: 'vitamin_c',
  THIA: 'thiamin',
  RIBF: 'riboflavin',
  NIA: 'niacin',
  VITB6: 'vitamin_b6',
  FOL: 'folate',
  VITB12: 'vitamin_b12',
  CA: 'calcium',
  FE: 'iron',
  MG: 'magnesium',
  P: 'phosphorus',
  K: 'potassium',
  NA: 'sodium',
  ZN: 'zinc',
  SE: 'selenium',
  ID: 'iodine',
}

// --- Fetch helpers ---

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  return res.json() as Promise<T>
}

async function fetchAllFoods(): Promise<SLVFood[]> {
  const all: SLVFood[] = []
  let offset = 0

  // First request to get total
  const first = await fetchJSON<SLVFoodPage>(
    `${SLV_BASE}/livsmedel?offset=0&limit=${PAGE_SIZE}&sprak=1`
  )
  all.push(...first.livsmedel)
  const total = first._meta.totalRecords
  console.log(`Total foods in SLV: ${total}`)
  offset += PAGE_SIZE

  while (offset < total) {
    const page = await fetchJSON<SLVFoodPage>(
      `${SLV_BASE}/livsmedel?offset=${offset}&limit=${PAGE_SIZE}&sprak=1`
    )
    all.push(...page.livsmedel)
    offset += PAGE_SIZE
    process.stdout.write(`\r  Fetched ${all.length} / ${total} foods`)
  }
  console.log()
  return all
}

async function fetchNutrients(nummer: number): Promise<SLVNutrient[]> {
  return fetchJSON<SLVNutrient[]>(`${SLV_BASE}/livsmedel/${nummer}/naringsvarden?sprak=1`)
}

// --- Nutrient extraction ---

interface ExtractedNutrients {
  calories: number
  fat_g: number
  carb_g: number
  protein_g: number
  detailed: Array<{
    nutrient_code: string
    amount: number
    unit: string
  }>
}

function extractNutrients(raw: SLVNutrient[]): ExtractedNutrients {
  // Only use nutrients with matrisenhetkod "W" (per 100g edible portion)
  // Fatty acid composition (matrisenhetkod "F") is per 100g fatty acids, not edible portion
  const wNutrients = raw.filter(n => !n.matrisenhetkod || n.matrisenhetkod === 'W')

  // Energy: find ENERC with kcal unit
  const energyKcal = wNutrients.find(n => n.euroFIRkod === 'ENERC' && n.enhet === 'kcal')
  const calories = energyKcal?.varde ?? 0

  // Macro nutrients for food_items columns (only columns that exist in DB)
  const findW = (code: string) => wNutrients.find(n => n.euroFIRkod === code)?.varde ?? 0

  const fat_g = findW('FAT')
  const carb_g = findW('CHO')
  const protein_g = findW('PROT')

  // Detailed nutrients for food_nutrients table
  // FASAT/FAMS/FAPU may have matrisenhetkod "F" (per 100g fatty acids)
  // For these we need to convert: amount_per_100g_edible = (value / 100) * total_fat_g
  const detailed: ExtractedNutrients['detailed'] = []

  // Add energy_kcal
  if (energyKcal) {
    detailed.push({
      nutrient_code: 'energy_kcal',
      amount: calories,
      unit: 'kcal',
    })
  }

  // Process all mapped nutrients
  for (const slvNutrient of raw) {
    const nutrientCode = EUROFIR_TO_NUTRIENT_CODE[slvNutrient.euroFIRkod]
    if (!nutrientCode) continue

    let amount = slvNutrient.varde

    // Fatty acid sub-types (FASAT, FAMS, FAPU) may be per 100g fatty acids
    // Convert to per 100g edible portion: (value / 100) * total_fat
    if (
      slvNutrient.matrisenhetkod === 'F' &&
      ['FASAT', 'FAMS', 'FAPU'].includes(slvNutrient.euroFIRkod)
    ) {
      amount = (slvNutrient.varde / 100) * fat_g
    }

    // Map SLV unit to our unit
    let unit = slvNutrient.enhet
    if (unit === 'µg') unit = 'ug'
    if (unit === 'RE/µg') unit = 'ug'
    if (unit === 'NE/mg') unit = 'mg'

    detailed.push({ nutrient_code: nutrientCode, amount, unit })
  }

  return {
    calories,
    fat_g,
    carb_g,
    protein_g,
    detailed,
  }
}

// --- Main import ---

async function main() {
  console.log('=== Livsmedelsverket Import ===\n')

  // 1. Fetch all food items
  console.log('1. Fetching food list...')
  const foods = await fetchAllFoods()

  // 2. Process each food: fetch nutrients, upsert food_item + food_nutrients
  console.log('\n2. Processing foods...')

  let inserted = 0
  let updated = 0
  let errors = 0
  const BATCH_SIZE = 10

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async food => {
        try {
          // Fetch nutrients for this food
          const rawNutrients = await fetchNutrients(food.nummer)
          const nutrients = extractNutrients(rawNutrients)

          // Upsert food item (idempotent via source + external_id)
          const externalId = String(food.nummer)

          // Check if exists
          const { data: existing } = await supabase
            .from('food_items')
            .select('id')
            .eq('source', 'livsmedelsverket')
            .eq('external_id', externalId)
            .maybeSingle()

          let foodItemId: string

          if (existing) {
            // Update
            const { data, error } = await supabase
              .from('food_items')
              .update({
                name: food.namn,
                calories: nutrients.calories,
                fat_g: nutrients.fat_g,
                carb_g: nutrients.carb_g,
                protein_g: nutrients.protein_g,
                default_amount: 100,
                default_unit: 'g',
                weight_grams: 100,
                reference_amount: 100,
                reference_unit: 'g',
                food_type: 'Solid',
              })
              .eq('id', existing.id)
              .select('id')
              .single()

            if (error) throw error
            foodItemId = data.id
            updated++
          } else {
            // Insert
            const { data, error } = await supabase
              .from('food_items')
              .insert({
                user_id: null, // Global item
                source: 'livsmedelsverket',
                external_id: externalId,
                name: food.namn,
                calories: nutrients.calories,
                fat_g: nutrients.fat_g,
                carb_g: nutrients.carb_g,
                protein_g: nutrients.protein_g,
                default_amount: 100,
                default_unit: 'g',
                weight_grams: 100,
                reference_amount: 100,
                reference_unit: 'g',
                food_type: 'Solid', // Trigger calculates kcal_per_gram + energy_density_color
                is_recipe: false,
              })
              .select('id')
              .single()

            if (error) throw error
            foodItemId = data.id
            inserted++
          }

          // Upsert nutrients: delete + insert (atomic per food item)
          if (nutrients.detailed.length > 0) {
            await supabase.from('food_nutrients').delete().eq('food_item_id', foodItemId)

            const nutrientRows = nutrients.detailed.map(n => ({
              food_item_id: foodItemId,
              nutrient_code: n.nutrient_code,
              amount: n.amount,
              unit: n.unit,
              reference_amount: 100,
              reference_unit: 'g' as const,
            }))

            const { error: nError } = await supabase.from('food_nutrients').insert(nutrientRows)

            if (nError) {
              console.error(
                `\n  Nutrient insert error for ${food.namn} (${food.nummer}): ${nError.message}`
              )
            }
          }
        } catch (err) {
          errors++
          console.error(
            `\n  Error processing ${food.namn} (${food.nummer}):`,
            err instanceof Error ? err.message : err
          )
        }
      })
    )

    process.stdout.write(
      `\r  Processed ${Math.min(i + BATCH_SIZE, foods.length)} / ${foods.length} (${inserted} new, ${updated} updated, ${errors} errors)`
    )
  }

  console.log('\n')
  console.log('=== Import Complete ===')
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Updated:  ${updated}`)
  console.log(`  Errors:   ${errors}`)
  console.log(`  Total:    ${foods.length}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
