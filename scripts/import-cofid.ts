/**
 * Import script for CoFID — McCance and Widdowson's Composition of Foods
 * Integrated Dataset (UK), published by Public Health England.
 *
 * Källa: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 * Licens: Open Government Licence v3.0 — kommersiell användning tillåten,
 * kräver attribution (se villkoren §9 Datakällor och licenser).
 *
 * Läser Excel-filen direkt utan externt bibliotek: .xlsx är en ZIP med XML,
 * och vi behöver bara tre av femton blad. Att dra in exceljs (~5 MB) för ett
 * skript som körs någon gång per år är inte värt beroendet.
 *
 * Idempotent via (source, external_id) — kan köras om utan dubbletter.
 *
 * Usage:
 *   npx tsx scripts/import-cofid.ts --file <sökväg till .xlsx> --dry-run
 *   npx tsx scripts/import-cofid.ts --file <sökväg till .xlsx>
 *
 * Kräver VITE_SUPABASE_URL och VITE_SUPABASE_SERVICE_KEY i .env
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { DATA_SOURCES } from '../src/lib/constants/dataSources'

dotenv.config({ path: resolve(import.meta.dirname, '..', '.env') })

// --- CLI ---

const args = process.argv.slice(2)
const getArg = (flag: string) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : null
}
const FILE_PATH = getArg('--file')
const DRY_RUN = args.includes('--dry-run')
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit')!, 10) : null

if (!FILE_PATH) {
  console.error('Usage: npx tsx scripts/import-cofid.ts --file <path.xlsx> [--dry-run] [--limit N]')
  process.exit(1)
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY

if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY in .env (or use --dry-run)')
  process.exit(1)
}

const supabase = DRY_RUN ? null : createClient(SUPABASE_URL!, SERVICE_KEY!)

const SOURCE = 'cofid'
/** CoFID-versionen som importeras — bump vid ny utgåva från GOV.UK. */
const IMPORT_VERSION = '2021'

/**
 * data_quality_score viktar rankingen i search_food_items
 * (`* COALESCE(data_quality_score, 100) / 100`). Läses ur registret så att
 * poängen inte kan glida isär från DATA_SOURCES.
 *
 * CoFID = 95: analytiska värden från Public Health England, men delvis äldre
 * mätningar än SLV:s löpande uppdaterade databas.
 */
const QUALITY_SCORE = DATA_SOURCES.find(ds => ds.id === SOURCE)?.defaultQualityScore ?? 90

// ---------------------------------------------------------------------------
// Minimal .xlsx-läsare
//
// Delade strängar ligger i sharedStrings.xml och refereras med index från
// cellerna (t="s"). Utan den uppslagningen blir textceller bara siffror.
// ---------------------------------------------------------------------------

type SheetRow = { r: number; cells: Record<string, string> }

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, '&') // sist, annars dubbelavkodas t.ex. &amp;lt;
}

class XlsxReader {
  private dir: string
  private shared: string[] = []
  private sheetFiles: Record<string, string> = {}

  constructor(xlsxPath: string) {
    this.dir = mkdtempSync(join(tmpdir(), 'cofid-'))
    // .NET:s ZipFile i stället för Expand-Archive: den senare vägrar allt som
    // inte heter .zip, och en .xlsx är en zip med annan ändelse.
    const escaped = xlsxPath.replace(/'/g, "''")
    const dirEscaped = this.dir.replace(/'/g, "''")
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Add-Type -AssemblyName System.IO.Compression.FileSystem; ` +
          `[System.IO.Compression.ZipFile]::ExtractToDirectory('${escaped}', '${dirEscaped}')`,
      ],
      { stdio: 'pipe' }
    )
    this.loadSharedStrings()
    this.loadSheetIndex()
  }

  private loadSharedStrings() {
    let raw: string
    try {
      raw = readFileSync(join(this.dir, 'xl', 'sharedStrings.xml'), 'utf8')
    } catch {
      return // arbetsbok utan delade strängar
    }
    for (const m of raw.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      const text = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')
      this.shared.push(decodeEntities(text))
    }
  }

  private loadSheetIndex() {
    const rels: Record<string, string> = {}
    const relsRaw = readFileSync(join(this.dir, 'xl', '_rels', 'workbook.xml.rels'), 'utf8')
    for (const m of relsRaw.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      rels[m[1]] = m[2].replace(/^\/?xl\//, '')
    }
    const wb = readFileSync(join(this.dir, 'xl', 'workbook.xml'), 'utf8')
    for (const m of wb.matchAll(/<sheet name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
      this.sheetFiles[decodeEntities(m[1])] = rels[m[2]]
    }
  }

  sheetNames(): string[] {
    return Object.keys(this.sheetFiles)
  }

  readSheet(name: string): SheetRow[] {
    const file = this.sheetFiles[name]
    if (!file) throw new Error(`Sheet not found: ${name}`)
    const xml = readFileSync(join(this.dir, 'xl', file), 'utf8')
    const rows: SheetRow[] = []
    for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: Record<string, string> = {}
      for (const cm of rm[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
        const [, col, attrs, inner] = cm
        const inlineStr = inner.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/)
        const value = inner.match(/<v>([\s\S]*?)<\/v>/)
        if (inlineStr) cells[col] = decodeEntities(inlineStr[1])
        else if (value) {
          cells[col] = /t="s"/.test(attrs) ? (this.shared[+value[1]] ?? '') : value[1]
        }
      }
      rows.push({ r: +rm[1], cells })
    }
    return rows
  }

  cleanup() {
    rmSync(this.dir, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// Värdetolkning
//
// CoFID:s egen Notes-flik definierar symbolerna:
//   Tr = spårmängd  → 0 är en rimlig tolkning
//   N  = ämnet finns i betydande mängd, men ingen tillförlitlig uppgift om hur
//        mycket → MÅSTE bli null. Att tolka N som 0 vore att påstå frånvaro,
//        vilket är direkt felaktigt. N förekommer 1 838 gånger i Proximates.
// ---------------------------------------------------------------------------

function parseValue(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const s = String(raw).trim()
  if (s === '' || s === 'N') return null
  if (s === 'Tr') return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Avrundar bort flyttalsbrus (0.07000000000000001 → 0.07). */
const round = (n: number, decimals = 4) => Number(n.toFixed(decimals))

/**
 * Totalt socker. TOTSUG-kolumnen är ifylld för bara 445 av 2 887 livsmedel,
 * medan de enskilda sockerarterna finns för 2 200–2 600. Summering är
 * verifierat tillförlitlig: av 279 poster där båda fanns stämde 274 inom
 * 0,15 g, och de fem avvikande låg på 0,2 g — avrundningsbrus, inte fel.
 */
function resolveSugars(cells: Record<string, string>): number | null {
  const total = parseValue(cells['Q']) // TOTSUG
  if (total !== null) return total

  // GLUC, GALACT, FRUCT, SUCR, MALT, LACT
  const parts = ['R', 'S', 'T', 'U', 'V', 'W'].map(col => parseValue(cells[col]))
  if (parts.some(p => p === null)) return null // ofullständig — hellre inget än fel
  return parts.reduce((sum, p) => sum! + p!, 0)
}

// ---------------------------------------------------------------------------
// Näringsämnesmappning: CoFID-kolumn → vår nutrient_code
//
// Kolumnbokstäverna kommer ur rad 1–2 i respektive blad (rad 2 innehåller
// CoFID:s egna koder, t.ex. PROT/FAT/CHO). Makronäringsämnena ligger direkt
// på food_items och tas därför inte med här — ingen dubbellagring.
// ---------------------------------------------------------------------------

type NutrientSpec = { col: string; code: string; unit: string }

// Fettsyrorna finns i två varianter: per 100 g fettsyror (…FAC) och per 100 g
// livsmedel (…FOD). Bara FOD-varianten är jämförbar med övriga näringsvärden —
// FAC skulle ge kraftigt uppblåsta tal.
const PROXIMATE_NUTRIENTS: NutrientSpec[] = [
  { col: 'H', code: 'water', unit: 'g' },
  { col: 'X', code: 'alcohol', unit: 'g' }, // ALCO
  { col: 'Z', code: 'fiber', unit: 'g' }, // AOACFIB — modern standardmetod
  { col: 'AB', code: 'saturated_fat', unit: 'g' }, // SATFOD
  { col: 'AJ', code: 'monounsaturated_fat', unit: 'g' }, // MONOFOD
  { col: 'AN', code: 'polyunsaturated_fat', unit: 'g' }, // POLYFOD
  { col: 'AT', code: 'trans_fat', unit: 'g' }, // FODTRANS
  { col: 'AU', code: 'cholesterol', unit: 'mg' }, // CHOL
]

const INORGANIC_NUTRIENTS: NutrientSpec[] = [
  { col: 'H', code: 'sodium', unit: 'mg' },
  { col: 'I', code: 'potassium', unit: 'mg' },
  { col: 'J', code: 'calcium', unit: 'mg' },
  { col: 'K', code: 'magnesium', unit: 'mg' },
  { col: 'L', code: 'phosphorus', unit: 'mg' },
  { col: 'M', code: 'iron', unit: 'mg' },
  { col: 'N', code: 'copper', unit: 'mg' },
  { col: 'O', code: 'zinc', unit: 'mg' },
  { col: 'Q', code: 'manganese', unit: 'mg' },
  { col: 'R', code: 'selenium', unit: 'ug' },
  { col: 'S', code: 'iodine', unit: 'ug' },
]

const VITAMIN_NUTRIENTS: NutrientSpec[] = [
  { col: 'J', code: 'vitamin_a', unit: 'ug' }, // RETEQU = retinolekvivalent
  { col: 'K', code: 'vitamin_d', unit: 'ug' },
  { col: 'L', code: 'vitamin_e', unit: 'mg' },
  { col: 'M', code: 'vitamin_k', unit: 'ug' },
  { col: 'N', code: 'thiamin', unit: 'mg' },
  { col: 'O', code: 'riboflavin', unit: 'mg' },
  { col: 'P', code: 'niacin', unit: 'mg' },
  { col: 'S', code: 'vitamin_b6', unit: 'mg' },
  { col: 'T', code: 'vitamin_b12', unit: 'ug' },
  { col: 'U', code: 'folate', unit: 'ug' },
  { col: 'V', code: 'pantothenic_acid', unit: 'mg' },
  { col: 'W', code: 'biotin', unit: 'ug' },
  { col: 'X', code: 'vitamin_c', unit: 'mg' },
]

// Makrokolumner i Proximates (rad 2-koder inom parentes)
const COL = {
  foodCode: 'A',
  name: 'B',
  group: 'D',
  protein: 'J', // PROT
  fat: 'K', // FAT
  carb: 'L', // CHO
  kcal: 'M', // KCALS
} as const

// ---------------------------------------------------------------------------
// Livsmedelstyp
//
// CoFID anger alkoholhaltiga drycker per 100 ml, övrigt per 100 g (Notes-
// fliken). Gruppkoder som börjar på Q är alkoholhaltiga drycker och PA/PC/PE
// är kaffe, te, läsk och juice. Alkoholkolumnen duger INTE som signal — den
// fångar även mat lagad med vin, t.ex. Beef Stroganoff.
// ---------------------------------------------------------------------------

function resolveFoodType(group: string): { foodType: 'Solid' | 'Liquid'; unit: 'g' | 'ml' } {
  const g = group.trim().toUpperCase()
  const isAlcoholicDrink = g === 'Q' || /^Q[A-Z]/.test(g)
  const isSoftDrink = /^(PA|PC|PE)/.test(g)
  return isAlcoholicDrink || isSoftDrink
    ? { foodType: 'Liquid', unit: 'ml' }
    : { foodType: 'Solid', unit: 'g' }
}

// ---------------------------------------------------------------------------

interface CofidFood {
  externalId: string
  name: string
  group: string
  calories: number
  protein: number
  fat: number
  carb: number
  foodType: 'Solid' | 'Liquid'
  unit: 'g' | 'ml'
  nutrients: Array<{ nutrient_code: string; amount: number; unit: string }>
}

function collectNutrients(
  cells: Record<string, string>,
  specs: NutrientSpec[]
): Array<{ nutrient_code: string; amount: number; unit: string }> {
  const out: Array<{ nutrient_code: string; amount: number; unit: string }> = []
  for (const spec of specs) {
    const value = parseValue(cells[spec.col])
    if (value === null) continue // N eller tomt — utelämnas hellre än nollas
    out.push({ nutrient_code: spec.code, amount: round(value), unit: spec.unit })
  }
  return out
}

function main() {
  console.log(`CoFID-import (${IMPORT_VERSION})${DRY_RUN ? ' — DRY RUN' : ''}`)
  console.log(`Fil: ${FILE_PATH}\n`)

  const reader = new XlsxReader(FILE_PATH!)

  try {
    const proximates = reader.readSheet('1.3 Proximates')
    const inorganics = reader.readSheet('1.4 Inorganics')
    const vitamins = reader.readSheet('1.5 Vitamins')

    // Rad 1–3 är rubriker (namn, CoFID-kod, kortnamn). Data börjar på rad 4.
    const dataRows = (rows: SheetRow[]) => rows.filter(r => r.r >= 4)

    const byCode = <T extends SheetRow>(rows: T[]) => {
      const map = new Map<string, Record<string, string>>()
      for (const row of rows) {
        const code = String(row.cells[COL.foodCode] ?? '').trim()
        if (code) map.set(code, row.cells)
      }
      return map
    }

    const inorganicsByCode = byCode(dataRows(inorganics))
    const vitaminsByCode = byCode(dataRows(vitamins))

    const foods: CofidFood[] = []
    const seenCodes = new Map<string, string>()
    let skippedNoEnergy = 0
    let skippedDuplicate = 0
    let rowsExamined = 0
    let stoppedEarly = false

    for (const row of dataRows(proximates)) {
      rowsExamined++
      const cells = row.cells
      const externalId = String(cells[COL.foodCode] ?? '').trim()
      const name = String(cells[COL.name] ?? '').trim()
      if (!externalId || !name) continue

      // CoFID 2021 innehåller en äkta dubblett: koden 13-669 används av både
      // "Aubergine, flesh and skin, roasted" och "Watercress, raw". Utan den
      // här kontrollen skulle den ena tyst skriva över den andra vid upsert.
      const previous = seenCodes.get(externalId)
      if (previous) {
        console.warn(
          `  ! Dubblettkod ${externalId}: "${previous}" / "${name}" — hoppar över den senare`
        )
        skippedDuplicate++
        continue
      }

      const calories = parseValue(cells[COL.kcal])
      const protein = parseValue(cells[COL.protein])
      const fat = parseValue(cells[COL.fat])
      const carb = parseValue(cells[COL.carb])

      // Utan energi och makron är posten oanvändbar för loggning
      if (calories === null || protein === null || fat === null || carb === null) {
        skippedNoEnergy++
        continue
      }

      seenCodes.set(externalId, name)

      const group = String(cells[COL.group] ?? '').trim()
      const { foodType, unit } = resolveFoodType(group)

      const nutrients = [
        ...collectNutrients(cells, PROXIMATE_NUTRIENTS),
        ...collectNutrients(inorganicsByCode.get(externalId) ?? {}, INORGANIC_NUTRIENTS),
        ...collectNutrients(vitaminsByCode.get(externalId) ?? {}, VITAMIN_NUTRIENTS),
      ]

      // Socker hanteras separat — se resolveSugars
      const sugars = resolveSugars(cells)
      if (sugars !== null) {
        nutrients.push({ nutrient_code: 'sugars', amount: round(sugars), unit: 'g' })
      }

      foods.push({
        externalId,
        name,
        group,
        calories: round(calories, 1),
        protein: round(protein),
        fat: round(fat),
        carb: round(carb),
        foodType,
        unit,
        nutrients,
      })

      if (LIMIT && foods.length >= LIMIT) {
        stoppedEarly = true
        break
      }
    }

    // Med --limit bryts loopen efter N lyckade poster, så siffrorna nedan
    // gäller bara de rader som hann granskas. Utan det förbehållet ser
    // "Överhoppade: 2" ut som ett omdöme om hela filen, när det egentligen
    // är 2 av ~22 rader.
    const totalRows = dataRows(proximates).length
    console.log(
      `\nInläst: ${foods.length} livsmedel` +
        (stoppedEarly
          ? ` (--limit ${LIMIT}, stannade efter ${rowsExamined}/${totalRows} rader)`
          : '')
    )
    const scope = stoppedEarly ? ' av de granskade' : ''
    console.log(`  Överhoppade${scope} (saknar energi/makron): ${skippedNoEnergy}`)
    console.log(`  Överhoppade${scope} (dubblettkod): ${skippedDuplicate}`)
    const liquids = foods.filter(f => f.foodType === 'Liquid').length
    console.log(`  Vätskor (per 100 ml): ${liquids} | Fasta (per 100 g): ${foods.length - liquids}`)
    const totalNutrients = foods.reduce((sum, f) => sum + f.nutrients.length, 0)
    console.log(`  Detaljerade näringsvärden: ${totalNutrients}`)

    if (DRY_RUN) {
      console.log('\nStickprov:')
      for (const f of foods.slice(0, 5)) {
        console.log(
          `  ${f.externalId}  ${f.name.slice(0, 42).padEnd(42)} ${String(f.calories).padStart(5)} kcal  ` +
            `P${f.protein} F${f.fat} K${f.carb}  [${f.foodType}/${f.unit}]  ${f.nutrients.length} näringsämnen`
        )
      }
      console.log('\nDRY RUN — inget skrevs till databasen.')
      return
    }

    void writeToDatabase(foods)
  } finally {
    reader.cleanup()
  }
}

async function writeToDatabase(foods: CofidFood[]) {
  let inserted = 0
  let updated = 0
  let errors = 0
  let nutrientsWritten = 0

  // food_nutrients.nutrient_code har en främmande nyckel mot
  // nutrient_definitions. CoFID innehåller ämnen som inte nödvändigtvis är
  // definierade där (biotin, koppar, mangan m.fl.), och en enda okänd kod
  // fäller hela insert-satsen för livsmedlet — alltså även de giltiga
  // ämnena. Filtrera mot verkligheten i stället för att anta.
  const { data: definitions, error: defError } = await supabase!
    .from('nutrient_definitions')
    .select('nutrient_code')

  if (defError) {
    console.error('Kunde inte läsa nutrient_definitions:', defError.message)
    process.exit(1)
  }

  const validCodes = new Set((definitions ?? []).map(d => d.nutrient_code as string))
  const usedCodes = new Set(foods.flatMap(f => f.nutrients.map(n => n.nutrient_code)))
  const unknown = [...usedCodes].filter(c => !validCodes.has(c)).sort()

  if (unknown.length > 0) {
    console.log(
      `\nHoppar över ${unknown.length} näringsämnen utan definition: ${unknown.join(', ')}`
    )
    console.log('(lägg till dem i nutrient_definitions för att få med dem)\n')
  }

  for (const [i, food] of foods.entries()) {
    try {
      const { data: existing } = await supabase!
        .from('food_items')
        .select('id')
        .eq('source', SOURCE)
        .eq('external_id', food.externalId)
        .maybeSingle()

      const payload = {
        name: food.name,
        calories: food.calories,
        protein_g: food.protein,
        fat_g: food.fat,
        carb_g: food.carb,
        default_amount: 100,
        default_unit: food.unit,
        weight_grams: 100,
        reference_amount: 100,
        reference_unit: food.unit,
        food_type: food.foodType,
        data_quality_score: QUALITY_SCORE,
      }

      let foodItemId: string

      if (existing) {
        const { data, error } = await supabase!
          .from('food_items')
          .update(payload)
          .eq('id', existing.id)
          .select('id')
          .single()
        if (error) throw error
        foodItemId = data.id
        updated++
      } else {
        const { data, error } = await supabase!
          .from('food_items')
          .insert({
            ...payload,
            user_id: null, // global post
            source: SOURCE,
            external_id: food.externalId,
            is_recipe: false,
          })
          .select('id')
          .single()
        if (error) throw error
        foodItemId = data.id
        inserted++
      }

      // Delete + insert håller näringsämnena i synk med källan även när ett
      // ämne försvinner mellan CoFID-utgåvor.
      const insertable = food.nutrients.filter(n => validCodes.has(n.nutrient_code))
      if (insertable.length > 0) {
        await supabase!.from('food_nutrients').delete().eq('food_item_id', foodItemId)
        const { error } = await supabase!.from('food_nutrients').insert(
          insertable.map(n => ({
            food_item_id: foodItemId,
            nutrient_code: n.nutrient_code,
            amount: n.amount,
            unit: n.unit,
            reference_amount: 100,
            reference_unit: food.unit,
          }))
        )
        if (error) console.error(`\n  Näringsämnesfel för ${food.name}: ${error.message}`)
        else nutrientsWritten += insertable.length
      }
    } catch (err) {
      errors++
      console.error(
        `\n  Fel vid ${food.name} (${food.externalId}):`,
        err instanceof Error ? err.message : err
      )
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`\r  ${i + 1} / ${foods.length}`)
    }
  }

  console.log(
    `\n\nKlart: ${inserted} nya, ${updated} uppdaterade, ${errors} fel, ` +
      `${nutrientsWritten} näringsvärden skrivna`
  )
}

main()
