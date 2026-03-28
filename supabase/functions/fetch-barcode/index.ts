import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// OpenFoodFacts API
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_FIELDS =
  'product_name,product_name_sv,product_name_en,nutriments,nutrition_data_per,serving_quantity,serving_quantity_unit,categories_tags'

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

interface BarcodeResult {
  name: string | null
  calories: number
  fat_g: number | null
  carb_g: number | null
  protein_g: number | null
  saturated_fat_g: number | null
  sugars_g: number | null
  salt_g: number | null
  default_unit: 'g' | 'ml'
  food_type: 'Solid' | 'Liquid' | 'Soup'
  default_amount: 100
}

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

  // Hämta från OpenFoodFacts
  let offResponse: Response
  try {
    offResponse = await fetch(`${OFF_API_BASE}/${barcode}.json?fields=${OFF_FIELDS}`)
  } catch {
    return jsonResponse({ error: 'fetch_failed' }, 502)
  }

  if (!offResponse.ok) {
    return jsonResponse({ error: 'off_not_found' }, 404)
  }

  let data: OFFResponse
  try {
    data = await offResponse.json()
  } catch {
    return jsonResponse({ error: 'off_parse_error' }, 502)
  }

  if (data.status !== 1 || !data.product) {
    return jsonResponse({ error: 'off_not_found' }, 404)
  }

  const { product } = data
  const nutriments = product.nutriments

  if (!nutriments) {
    return jsonResponse({ error: 'off_incomplete' }, 422)
  }

  // Determine if nutrition is per-serving and compute multiplier to normalize to per-100g
  const dataPer = (product.nutrition_data_per || '').toLowerCase()
  const isPerServing = dataPer.includes('serving')
  const servingGrams =
    isPerServing && typeof product.serving_quantity === 'number' && product.serving_quantity > 0
      ? product.serving_quantity
      : 0
  // servingMultiplier: how many servings equal 100g (used to normalize serving → per-100g)
  const servingMultiplier = servingGrams > 0 ? 100 / servingGrams : 0

  const calories = resolveCalories(nutriments, servingMultiplier)
  if (calories === null) {
    return jsonResponse({ error: 'off_incomplete' }, 422)
  }

  // Helper: get a nutrient value, with optional per-serving → per-100g normalization
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

  // Validering — avvisa vid orimliga kärnvärden
  // Allow up to 105 to handle rounding in OFFs data (e.g. butter = ~99.9g fat)
  if (!validateRange(calories, 0, 1000)) {
    return jsonResponse({ error: 'validation_failed' }, 422)
  }
  if (
    !validateRange(protein_g, 0, 105) ||
    !validateRange(carb_g, 0, 105) ||
    !validateRange(fat_g, 0, 105)
  ) {
    return jsonResponse({ error: 'validation_failed' }, 422)
  }

  // Valfria näringsvärden — clamp och nullifiera om utanför rimliga gränser
  const validatedSaturatedFat =
    saturated_fat_g !== null && validateRange(saturated_fat_g, 0, 105) ? saturated_fat_g : null
  const validatedSugars = sugars_g !== null && validateRange(sugars_g, 0, 105) ? sugars_g : null
  const validatedSalt = salt_g !== null && validateRange(salt_g, 0, 50) ? salt_g : null

  // Enhetsdetektering: ml → ml (per 100ml data or liquid category)
  const isPerMl = dataPer.includes('100ml') || dataPer.includes('100 ml')
  const default_unit: 'g' | 'ml' = isPerMl ? 'ml' : 'g'

  // Livsmedelstyp från categories_tags
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
    saturated_fat_g: validatedSaturatedFat,
    sugars_g: validatedSugars,
    salt_g: validatedSalt,
    default_unit,
    food_type,
    default_amount: 100,
  }

  return jsonResponse({ data: result }, 200)
})
