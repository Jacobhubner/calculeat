import { useQuery } from '@tanstack/react-query'
import type { ScanResult } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type LookupError = {
  type: 'off_not_found' | 'off_incomplete' | 'validation_failed' | 'rate_limited' | 'fetch_failed'
  message: string
}

const ERROR_MESSAGES: Record<string, string> = {
  off_not_found: 'Produkten hittades inte',
  off_incomplete: 'Produkten saknar näringsvärden',
  validation_failed: 'Orimliga näringsvärden — produkten avvisades',
  rate_limited: 'För många skanningar — försök igen om en stund',
  fetch_failed: 'Kunde inte hämta produktdata',
  invalid_barcode_format: 'Ogiltigt streckkods-format',
  unauthorized: 'Du måste vara inloggad',
}

const EDGE_FUNCTION_URL = 'https://mdtrmyvwkypnivbjtgkc.supabase.co/functions/v1/fetch-barcode'

function makeLookupError(type: string): LookupError {
  return {
    type: type as LookupError['type'],
    message: ERROR_MESSAGES[type] ?? ERROR_MESSAGES['fetch_failed'],
  }
}

function parseData(d: Record<string, unknown>): ScanResult {
  return {
    name: (d.name as string | null) ?? null,
    calories: d.calories as number,
    protein_g: (d.protein_g as number | null) ?? null,
    carb_g: (d.carb_g as number | null) ?? null,
    fat_g: (d.fat_g as number | null) ?? null,
    saturated_fat_g: (d.saturated_fat_g as number | null) ?? null,
    sugars_g: (d.sugars_g as number | null) ?? null,
    salt_g: (d.salt_g as number | null) ?? null,
    default_amount: 100,
    default_unit: (d.default_unit as 'g' | 'ml') ?? 'g',
    food_type: (d.food_type as 'Solid' | 'Liquid' | 'Soup') ?? 'Solid',
  }
}

async function fetchBarcode(barcode: string): Promise<ScanResult> {
  // 0. Hämta session först så att auth.uid() är redo för efterföljande RPC-anrop
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  // 1. Rate-limit-kontroll — ignorera RPC-fel (låt passera vid tekniskt fel)
  const { data: rateLimited } = await supabase.rpc('check_barcode_rate_limit')
  if (rateLimited === true) {
    throw makeLookupError('rate_limited')
  }

  // 2. Cache-kontroll
  const { data: cacheResult, error: cacheError } = await supabase.rpc('check_barcode_cache', {
    p_barcode: barcode,
  })
  if (cacheError) throw makeLookupError('fetch_failed')

  const cache = cacheResult as { hit: boolean; error?: string; data?: Record<string, unknown> }

  if (cache.hit) {
    if (cache.error) throw makeLookupError(cache.error)
    return parseData(cache.data!)
  }

  // 3. Cache-miss: anropa Edge Function direkt från klienten

  let response: Response
  try {
    response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ barcode }),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw makeLookupError('fetch_failed')
  }

  let result: { data?: Record<string, unknown>; error?: string }
  try {
    result = await response.json()
  } catch {
    throw makeLookupError('fetch_failed')
  }

  // 4. Spara i cache (brand-and-forget — väntar inte)
  if (result.data) {
    supabase
      .rpc('save_barcode_result', {
        p_barcode: barcode,
        p_status: 'found',
        p_data: result.data,
        p_error: null,
      })
      .then() // fire-and-forget
  } else if (result.error && ['off_not_found', 'off_incomplete'].includes(result.error)) {
    supabase
      .rpc('save_barcode_result', {
        p_barcode: barcode,
        p_status: 'not_found',
        p_data: null,
        p_error: result.error,
      })
      .then() // fire-and-forget
  }

  // 5. Hantera fel från Edge Function
  if (result.error) {
    throw makeLookupError(result.error)
  }

  if (!result.data) {
    throw makeLookupError('fetch_failed')
  }

  return parseData(result.data)
}

export function useBarcodeLookup(barcode: string | null) {
  return useQuery<ScanResult, LookupError>({
    queryKey: ['barcode', barcode],
    queryFn: () => fetchBarcode(barcode!),
    enabled: !!barcode,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  })
}
