import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// OpenFoodFacts API
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_FIELDS =
  'product_name,product_name_sv,product_name_en,nutriments,nutrition_data_per,categories_tags'

interface OFFProduct {
  product_name?: string
  product_name_sv?: string
  product_name_en?: string
  nutriments?: Record<string, number | undefined>
  nutrition_data_per?: string
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

function resolveCalories(nutriments: Record<string, number | undefined>): number | null {
  const kcal = nutriments['energy-kcal_100g']
  if (typeof kcal === 'number') return kcal

  const kj = nutriments['energy_100g']
  if (typeof kj === 'number') return Math.round((kj / 4.184) * 10) / 10

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

  const calories = resolveCalories(nutriments)
  if (calories === null) {
    return jsonResponse({ error: 'off_incomplete' }, 422)
  }

  const protein_g =
    typeof nutriments['proteins_100g'] === 'number' ? nutriments['proteins_100g'] : null
  const carb_g =
    typeof nutriments['carbohydrates_100g'] === 'number' ? nutriments['carbohydrates_100g'] : null
  const fat_g = typeof nutriments['fat_100g'] === 'number' ? nutriments['fat_100g'] : null
  const saturated_fat_g =
    typeof nutriments['saturated-fat_100g'] === 'number' ? nutriments['saturated-fat_100g'] : null
  const sugars_g = typeof nutriments['sugars_100g'] === 'number' ? nutriments['sugars_100g'] : null
  const salt_g = typeof nutriments['salt_100g'] === 'number' ? nutriments['salt_100g'] : null

  // Validering — avvisa vid orimliga kärnvärden
  if (!validateRange(calories, 0, 1000)) {
    return jsonResponse({ error: 'validation_failed' }, 422)
  }
  if (
    !validateRange(protein_g, 0, 100) ||
    !validateRange(carb_g, 0, 100) ||
    !validateRange(fat_g, 0, 100)
  ) {
    return jsonResponse({ error: 'validation_failed' }, 422)
  }

  // Valfria näringsvärden — nullifiera om utanför rimliga gränser
  const validatedSaturatedFat =
    saturated_fat_g !== null && validateRange(saturated_fat_g, 0, 100) ? saturated_fat_g : null
  const validatedSugars = sugars_g !== null && validateRange(sugars_g, 0, 100) ? sugars_g : null
  const validatedSalt = salt_g !== null && validateRange(salt_g, 0, 50) ? salt_g : null

  // Enhetsdetektering: 100ml → ml
  const dataPer = (product.nutrition_data_per || '').toLowerCase()
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
