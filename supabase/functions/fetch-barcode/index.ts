import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// OpenFoodFacts API
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_FIELDS =
  'product_name,product_name_sv,product_name_en,nutriments,nutrition_data_per,serving_quantity,serving_quantity_unit,categories_tags'

// USDA FoodData Central API — only Branded Foods have GTIN/UPC barcodes
const FDC_API_BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search'
const FDC_API_KEY = Deno.env.get('FDC_API_KEY') ?? 'DEMO_KEY'

interface OFFProduct {
  product_name?: string
  product_name_sv?: string
  product_name_en?: string
  nutriments?: Record<string, number | undefined>
  nutrition_data_per?: string
  serving_quantity?: number
  serving_quantity_unit?: string
  categories_tags?: string[]
}

interface OFFResponse {
  status: number
  product?: OFFProduct
}

interface FDCFood {
  description?: string
  gtinUpc?: string
  brandedFoodCategory?: string
  foodNutrients?: Array<{
    nutrientNumber?: number | string
    amount?: number
  }>
}

interface FDCResponse {
  foods?: FDCFood[]
}

interface BarcodeResult {
  name: string | null
  calories: number
  fat_g: number | null
  carb_g: number | null
  protein_g: number | null
  saturated_fat_g: number | null
  sugars_g: number | null
  salt_g: number | null
  fiber_g: number | null
  default_unit: 'g' | 'ml'
  food_type: 'Solid' | 'Liquid' | 'Soup'
  default_amount: 100
}

// --- OpenFoodFacts helpers ---

function resolveName(product: OFFProduct): string | null {
  const raw = product.product_name_sv || product.product_name || product.product_name_en || null
  if (!raw) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

function resolveCalories(
  nutriments: Record<string, number | undefined>,
  servingMultiplier: number
): number | null {
  // Per-100g variants (preferred)
  const kcal100g = nutriments['energy-kcal_100g']
  if (typeof kcal100g === 'number') return kcal100g

  const kj100g = nutriments['energy_100g'] ?? nutriments['energy-kj_100g']
  if (typeof kj100g === 'number') return Math.round((kj100g / 4.184) * 10) / 10

  // Per-serving fallbacks — normalize to per-100g via servingMultiplier
  if (servingMultiplier > 0) {
    const kcalServing = nutriments['energy-kcal_serving']
    if (typeof kcalServing === 'number')
      return Math.round(kcalServing * servingMultiplier * 10) / 10

    const kjServing = nutriments['energy_serving'] ?? nutriments['energy-kj_serving']
    if (typeof kjServing === 'number')
      return Math.round((kjServing / 4.184) * servingMultiplier * 10) / 10
  }

  return null
}

function validateRange(value: number | null, min: number, max: number): boolean {
  if (value === null) return true
  return value >= min && value <= max
}

// --- USDA FDC helpers ---

// Normalize a barcode string for comparison: strip leading zeros
function normalizeBarcode(code: string): string {
  return code.replace(/^0+/, '') || '0'
}

// FDC nutrient number → field name mapping (per 100g, no normalization needed)
const FDC_NUTRIENT_MAP: Record<
  number,
  keyof Omit<BarcodeResult, 'name' | 'default_unit' | 'food_type' | 'default_amount'>
> = {
  208: 'calories',
  203: 'protein_g',
  204: 'fat_g',
  205: 'carb_g',
  291: 'fiber_g',
  269: 'sugars_g',
  606: 'saturated_fat_g',
  // 307 = sodium_mg — converted to salt_g separately
}

function fdcFoodType(category: string): {
  foodType: 'Solid' | 'Liquid' | 'Soup'
  default_unit: 'g' | 'ml'
} {
  const c = category.toLowerCase()
  if (
    c.includes('beverage') ||
    c.includes('juice') ||
    c.includes('water') ||
    c.includes('coffee') ||
    c.includes('tea') ||
    c.includes('drink') ||
    c.includes('soda') ||
    c.includes('smoothie') ||
    c.includes('milk')
  ) {
    return { foodType: 'Liquid', default_unit: 'ml' }
  }
  if (c.includes('soup') || c.includes('broth') || c.includes('sauce') || c.includes('gravy')) {
    return { foodType: 'Soup', default_unit: 'ml' }
  }
  return { foodType: 'Solid', default_unit: 'g' }
}

async function lookupFDC(barcode: string): Promise<BarcodeResult | null> {
  let fdcResponse: Response
  try {
    fdcResponse = await fetch(`${FDC_API_BASE}?api_key=${FDC_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: barcode, dataType: ['Branded'], pageSize: 10 }),
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return null
  }

  if (!fdcResponse.ok) return null

  let fdcData: FDCResponse
  try {
    fdcData = await fdcResponse.json()
  } catch {
    return null
  }

  const foods = fdcData.foods ?? []
  if (foods.length === 0) return null

  // Match by normalized GTIN/UPC — FDC may have leading-zero variants
  const normalizedBarcode = normalizeBarcode(barcode)
  const match = foods.find(f => f.gtinUpc && normalizeBarcode(f.gtinUpc) === normalizedBarcode)
  if (!match) return null

  // Extract nutrients from the array (all per 100g — no serving normalization needed)
  const nutrients: Partial<Record<string, number>> = {}
  let sodiumMg: number | null = null

  for (const fn of match.foodNutrients ?? []) {
    const id =
      typeof fn.nutrientNumber === 'string' ? parseInt(fn.nutrientNumber, 10) : fn.nutrientNumber
    if (id == null || fn.amount == null) continue
    if (id === 307) {
      sodiumMg = fn.amount
      continue
    }
    const field = FDC_NUTRIENT_MAP[id]
    if (field) nutrients[field] = fn.amount
  }

  const calories = typeof nutrients['calories'] === 'number' ? nutrients['calories'] : null
  if (calories === null) return null

  // Validate core macros
  const protein_g = typeof nutrients['protein_g'] === 'number' ? nutrients['protein_g'] : null
  const fat_g = typeof nutrients['fat_g'] === 'number' ? nutrients['fat_g'] : null
  const carb_g = typeof nutrients['carb_g'] === 'number' ? nutrients['carb_g'] : null

  if (!validateRange(calories, 0, 1000)) return null
  if (
    !validateRange(protein_g, 0, 105) ||
    !validateRange(fat_g, 0, 105) ||
    !validateRange(carb_g, 0, 105)
  )
    return null

  // Optional nutrients
  const saturated_fat_g_raw =
    typeof nutrients['saturated_fat_g'] === 'number' ? nutrients['saturated_fat_g'] : null
  const sugars_g_raw = typeof nutrients['sugars_g'] === 'number' ? nutrients['sugars_g'] : null
  const fiber_g_raw = typeof nutrients['fiber_g'] === 'number' ? nutrients['fiber_g'] : null

  // Sodium → salt: salt_g = sodium_mg * 2.5 / 1000
  const salt_g_raw = sodiumMg !== null ? Math.round(sodiumMg * 2.5) / 1000 : null

  const { foodType, default_unit } = fdcFoodType(match.brandedFoodCategory ?? '')

  return {
    name: (match.description ?? '').trim() || null,
    calories,
    protein_g,
    fat_g,
    carb_g,
    saturated_fat_g:
      saturated_fat_g_raw !== null && validateRange(saturated_fat_g_raw, 0, 105)
        ? saturated_fat_g_raw
        : null,
    sugars_g: sugars_g_raw !== null && validateRange(sugars_g_raw, 0, 105) ? sugars_g_raw : null,
    salt_g: salt_g_raw !== null && validateRange(salt_g_raw, 0, 50) ? salt_g_raw : null,
    fiber_g: fiber_g_raw !== null && validateRange(fiber_g_raw, 0, 105) ? fiber_g_raw : null,
    default_unit,
    food_type: foodType,
    default_amount: 100,
  }
}

// --- HTTP helpers ---

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// --- Main handler ---

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Validera metod
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  let barcode: string | undefined
  try {
    const body = await req.json()
    barcode = body?.barcode
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  if (
    !barcode ||
    typeof barcode !== 'string' ||
    barcode.length < 8 ||
    barcode.length > 14 ||
    !/^\d+$/.test(barcode)
  ) {
    return jsonResponse({ error: 'invalid_barcode_format' }, 400)
  }

  // --- Steg 1: OpenFoodFacts ---
  let offResponse: Response
  try {
    offResponse = await fetch(`${OFF_API_BASE}/${barcode}.json?fields=${OFF_FIELDS}`)
  } catch {
    return jsonResponse({ error: 'fetch_failed' }, 502)
  }

  let offFound = false
  if (offResponse.ok) {
    let data: OFFResponse
    try {
      data = await offResponse.json()
    } catch {
      return jsonResponse({ error: 'off_parse_error' }, 502)
    }

    if (data.status === 1 && data.product) {
      offFound = true
      const { product } = data
      const nutriments = product.nutriments

      if (!nutriments) {
        // OFF has the product but no nutrition data — fall through to FDC
      } else {
        const dataPer = (product.nutrition_data_per || '').toLowerCase()
        const isPerServing = dataPer.includes('serving')
        const servingGrams =
          isPerServing &&
          typeof product.serving_quantity === 'number' &&
          product.serving_quantity > 0
            ? product.serving_quantity
            : 0
        const servingMultiplier = servingGrams > 0 ? 100 / servingGrams : 0

        const calories = resolveCalories(nutriments, servingMultiplier)
        if (calories !== null) {
          function getNutrient(key100g: string, keyServing?: string): number | null {
            const val100g = nutriments![key100g]
            if (typeof val100g === 'number') return val100g
            if (keyServing && servingMultiplier > 0) {
              const valServing = nutriments![keyServing]
              if (typeof valServing === 'number')
                return Math.round(valServing * servingMultiplier * 100) / 100
            }
            return null
          }

          const protein_g = getNutrient('proteins_100g', 'proteins_serving')
          const carb_g = getNutrient('carbohydrates_100g', 'carbohydrates_serving')
          const fat_g = getNutrient('fat_100g', 'fat_serving')
          const saturated_fat_g = getNutrient('saturated-fat_100g', 'saturated-fat_serving')
          const sugars_g = getNutrient('sugars_100g', 'sugars_serving')
          const salt_g = getNutrient('salt_100g', 'salt_serving')
          const fiber_g = getNutrient('fiber_100g', 'fiber_serving')

          if (
            validateRange(calories, 0, 1000) &&
            validateRange(protein_g, 0, 105) &&
            validateRange(carb_g, 0, 105) &&
            validateRange(fat_g, 0, 105)
          ) {
            const isPerMl = dataPer.includes('100ml') || dataPer.includes('100 ml')
            const default_unit: 'g' | 'ml' = isPerMl ? 'ml' : 'g'

            const categories = (product.categories_tags || []).map(c => c.toLowerCase())
            const isBeverage = categories.some(
              c =>
                c.includes('beverage') ||
                c.includes('drink') ||
                c.includes('juice') ||
                c.includes('milk') ||
                c.includes('dryck')
            )
            const isSoup = categories.some(
              c => c.includes('soup') || c.includes('soppa') || c.includes('broth')
            )
            const food_type: 'Solid' | 'Liquid' | 'Soup' = isSoup
              ? 'Soup'
              : isBeverage || isPerMl
                ? 'Liquid'
                : 'Solid'

            const result: BarcodeResult = {
              name: resolveName(product),
              calories,
              protein_g,
              carb_g,
              fat_g,
              saturated_fat_g:
                saturated_fat_g !== null && validateRange(saturated_fat_g, 0, 105)
                  ? saturated_fat_g
                  : null,
              sugars_g: sugars_g !== null && validateRange(sugars_g, 0, 105) ? sugars_g : null,
              salt_g: salt_g !== null && validateRange(salt_g, 0, 50) ? salt_g : null,
              fiber_g: fiber_g !== null && validateRange(fiber_g, 0, 105) ? fiber_g : null,
              default_unit,
              food_type,
              default_amount: 100,
            }

            return jsonResponse({ data: result, source: 'openfoodfacts' }, 200)
          }
        }
      }
    }
  }

  // --- Steg 2: USDA FDC-fallback (körs om OFF missade eller hade ofullständig data) ---
  const fdcResult = await lookupFDC(barcode)
  if (fdcResult) {
    return jsonResponse({ data: fdcResult, source: 'usda' }, 200)
  }

  // Båda misslyckades
  const error = offFound ? 'off_incomplete' : 'off_not_found'
  return jsonResponse({ error }, 404)
})
