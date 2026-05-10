import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_TIMEOUT_MS = 15_000
const MAX_IMAGE_SIZE = 2_000_000
const USER_DAILY_LIMIT = 20
const GLOBAL_DAILY_LIMIT = 1200

const PROMPT = `You are a nutrition label parser. Analyze this image of a food product nutrition label.

Return ONLY a JSON object with these exact fields. No comments, no explanation, no markdown.

{
  "name": "product name in Swedish if visible, otherwise original language",
  "unit": "g" or "ml" depending on what the label uses,
  "food_type": "Solid" or "Liquid" or "Soup",
  "calories": numeric value per 100g or per 100ml (kcal, not kJ),
  "protein_g": numeric value per 100g or per 100ml,
  "carb_g": numeric value per 100g or per 100ml,
  "fat_g": numeric value per 100g or per 100ml,
  "saturated_fat_g": numeric value per 100g or per 100ml (the "of which saturates" row), or null if not shown,
  "sugars_g": numeric value per 100g or per 100ml (the "of which sugars" row), or null if not shown,
  "fiber_g": numeric value per 100g or per 100ml (the "fibre" or "dietary fiber" row), or null if not shown,
  "salt_g": numeric value per 100g or per 100ml (the "salt" row on EU labels), or null if not shown
}

Rules:
- Check if the label says "per 100g" or "per 100ml" and set unit accordingly
- If the label shows both per 100g and per 100ml, prefer the per 100g values and set unit to "g"
- If only per 100ml values are shown (common for drinks, sauces, oils), set unit to "ml"
- Set food_type based on the product:
  - "Liquid" for drinks, juices, milk, oils, sauces, dressings
  - "Soup" for soups, broths, stews
  - "Solid" for everything else (bread, meat, snacks, etc.)
- Use decimal point, not comma (e.g. 12.5 not 12,5)
- No units in numeric values, only numbers
- If a value cannot be determined, use null
- If the image does not contain a nutrition label, return {"error": "no_nutrition_label"}
- If values are in kJ, convert to kcal by dividing by 4.184`

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function errorResponse(error: string, message: string, status = 400) {
  return jsonResponse({ error, message }, status)
}

async function logScan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  success: boolean,
  errorType: string | null = null
) {
  await supabase.from('scan_usage').insert({
    user_id: userId,
    scan_type: 'nutrition_label',
    success,
    error_type: errorType,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    return errorResponse('server_error', 'Server configuration error.', 500)
  }

  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return errorResponse('unauthorized', 'Du är inte inloggad.', 401)
  }
  const userId = user.id

  let image: string
  try {
    const body = await req.json()
    image = body.image
  } catch {
    await logScan(supabase, userId, false, 'invalid_body')
    return errorResponse('server_error', 'Ogiltigt anrop.', 400)
  }

  if (!image || typeof image !== 'string') {
    await logScan(supabase, userId, false, 'missing_image')
    return errorResponse('server_error', 'Ingen bild bifogad.', 400)
  }

  if (image.length > MAX_IMAGE_SIZE) {
    await logScan(supabase, userId, false, 'image_too_large')
    return errorResponse('image_too_large', 'Bilden är för stor. Försök med en mindre bild.')
  }

  const { count: userCount } = await supabase
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('scan_type', 'nutrition_label')
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())

  if ((userCount ?? 0) >= USER_DAILY_LIMIT) {
    await logScan(supabase, userId, false, 'quota_user')
    return errorResponse(
      'quota_exceeded',
      'Du har nått din dagliga gräns för skanningar. Försök igen imorgon.'
    )
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { count: globalCount } = await supabaseAdmin
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('scan_type', 'nutrition_label')
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())

  if ((globalCount ?? 0) >= GLOBAL_DAILY_LIMIT) {
    await logScan(supabase, userId, false, 'quota_global')
    return errorResponse('quota_exceeded', 'Skanning tillfälligt otillgänglig. Försök igen senare.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  let geminiText: string
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: image } }],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    })

    clearTimeout(timeout)

    if (geminiRes.status === 429) {
      await logScan(supabase, userId, false, 'gemini_429')
      return errorResponse(
        'quota_exceeded',
        'Skanning tillfälligt otillgänglig. Vänta en minut och försök igen.'
      )
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => 'unknown')
      console.error('Gemini API error:', geminiRes.status, errText.slice(0, 2000))
      await logScan(supabase, userId, false, `gemini_${geminiRes.status}`)
      return errorResponse('server_error', 'Ett serverfel uppstod.', 500)
    }

    const geminiData: GeminiResponse = await geminiRes.json()
    geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      await logScan(supabase, userId, false, 'gemini_timeout')
      return errorResponse('timeout', 'Skanning tog för lång tid. Försök igen.')
    }
    console.error('Gemini fetch error:', String(err))
    await logScan(supabase, userId, false, 'gemini_network_error')
    return errorResponse('server_error', 'Ett serverfel uppstod.', 500)
  }

  let parsed: Record<string, unknown>
  try {
    const cleaned = geminiText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('JSON parse error. Raw:', geminiText.slice(0, 1000))
    await logScan(supabase, userId, false, 'json_parse_error')
    return errorResponse(
      'validation_failed',
      'Kunde inte läsa etiketten. Försök med en tydligare bild.'
    )
  }

  if (parsed.error === 'no_nutrition_label') {
    await logScan(supabase, userId, false, 'no_nutrition_label')
    return errorResponse('no_nutrition_label', 'Bilden verkar inte innehålla en näringsetikett.')
  }

  const calories = Number(parsed.calories)
  if (isNaN(calories) || calories < 0 || calories > 1000) {
    await logScan(supabase, userId, false, 'validation_calories')
    return errorResponse(
      'validation_failed',
      'Kunde inte läsa etiketten. Försök med en tydligare bild.'
    )
  }

  function validateMacro(val: unknown): number | null {
    if (val === null || val === undefined) return null
    const n = Number(val)
    if (isNaN(n) || n < 0 || n > 100) return null
    return Math.round(n * 10) / 10
  }

  function validateSalt(val: unknown): number | null {
    if (val === null || val === undefined) return null
    const n = Number(val)
    if (isNaN(n) || n < 0 || n > 50) return null
    return Math.round(n * 100) / 100
  }

  const proteinG = validateMacro(parsed.protein_g)
  const carbG = validateMacro(parsed.carb_g)
  const fatG = validateMacro(parsed.fat_g)
  const saturatedFatG = validateMacro(parsed.saturated_fat_g)
  const sugarsG = validateMacro(parsed.sugars_g)
  const fiberG = validateMacro(parsed.fiber_g)
  const saltG = validateSalt(parsed.salt_g)

  const unit = parsed.unit === 'ml' ? 'ml' : 'g'

  const validFoodTypes = ['Solid', 'Liquid', 'Soup']
  const foodType = validFoodTypes.includes(parsed.food_type as string)
    ? (parsed.food_type as string)
    : unit === 'ml'
      ? 'Liquid'
      : 'Solid'

  let name: string | null = null
  if (typeof parsed.name === 'string') {
    const trimmed = parsed.name.trim()
    if (trimmed.length > 0) name = trimmed
  }

  await logScan(supabase, userId, true)

  return jsonResponse({
    name,
    calories: Math.round(calories * 10) / 10,
    protein_g: proteinG,
    carb_g: carbG,
    fat_g: fatG,
    saturated_fat_g: saturatedFatG,
    sugars_g: sugarsG,
    fiber_g: fiberG,
    salt_g: saltG,
    default_amount: 100,
    default_unit: unit,
    food_type: foodType,
  })
})
