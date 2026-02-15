import { useQuery } from '@tanstack/react-query'
import type { ScanResult } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_FIELDS = 'product_name,product_name_sv,product_name_en,nutriments'

interface OFFResponse {
  status: number
  product?: {
    product_name?: string
    product_name_sv?: string
    product_name_en?: string
    nutriments?: Record<string, number | undefined>
  }
}

type LookupError = {
  type: 'off_not_found' | 'off_incomplete' | 'validation_failed'
  message: string
}

function resolveName(product: OFFResponse['product']): string | null {
  if (!product) return null
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

async function logScan(success: boolean, errorType: string | null = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('scan_usage').insert({
    user_id: user.id,
    scan_type: 'barcode',
    success,
    error_type: errorType,
  })
}

async function fetchBarcode(barcode: string): Promise<ScanResult> {
  const response = await fetch(`${OFF_API_BASE}/${barcode}.json?fields=${OFF_FIELDS}`)

  if (!response.ok) {
    await logScan(false, 'off_not_found')
    throw { type: 'off_not_found', message: 'Produkten hittades inte' } as LookupError
  }

  const data: OFFResponse = await response.json()

  if (data.status !== 1 || !data.product) {
    await logScan(false, 'off_not_found')
    throw { type: 'off_not_found', message: 'Produkten hittades inte' } as LookupError
  }

  const nutriments = data.product.nutriments
  if (!nutriments) {
    await logScan(false, 'off_incomplete')
    throw {
      type: 'off_incomplete',
      message: 'Produkten saknar näringsvärden',
    } as LookupError
  }

  const calories = resolveCalories(nutriments)
  if (calories === null) {
    await logScan(false, 'off_incomplete')
    throw {
      type: 'off_incomplete',
      message: 'Produkten saknar energivärde per 100g',
    } as LookupError
  }

  const protein_g =
    typeof nutriments['proteins_100g'] === 'number' ? nutriments['proteins_100g'] : null
  const carb_g =
    typeof nutriments['carbohydrates_100g'] === 'number' ? nutriments['carbohydrates_100g'] : null
  const fat_g = typeof nutriments['fat_100g'] === 'number' ? nutriments['fat_100g'] : null

  // Numerisk validering — samma som Gemini-sidan
  if (!validateRange(calories, 0, 1000)) {
    await logScan(false, 'validation_failed')
    throw {
      type: 'validation_failed',
      message: 'Orimligt energivärde — produkten avvisades',
    } as LookupError
  }
  if (
    !validateRange(protein_g, 0, 100) ||
    !validateRange(carb_g, 0, 100) ||
    !validateRange(fat_g, 0, 100)
  ) {
    await logScan(false, 'validation_failed')
    throw {
      type: 'validation_failed',
      message: 'Orimliga näringsvärden — produkten avvisades',
    } as LookupError
  }

  const name = resolveName(data.product)

  await logScan(true)

  return {
    name,
    calories,
    protein_g,
    carb_g,
    fat_g,
    default_amount: 100,
    default_unit: 'g',
  }
}

export function useBarcodeLookup(barcode: string | null) {
  return useQuery<ScanResult, LookupError>({
    queryKey: ['barcode', barcode],
    queryFn: () => fetchBarcode(barcode!),
    enabled: !!barcode,
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 60 * 60 * 1000, // 1h
    retry: false,
  })
}
