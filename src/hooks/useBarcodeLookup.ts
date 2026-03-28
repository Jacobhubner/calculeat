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

const SESSION_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h
const SESSION_CACHE_MAX = 50

function sessionCacheGet(barcode: string): ScanResult | null {
  try {
    const raw = sessionStorage.getItem(`barcode:${barcode}`)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > SESSION_CACHE_TTL) {
      sessionStorage.removeItem(`barcode:${barcode}`)
      return null
    }
    return data as ScanResult
  } catch {
    return null
  }
}

function sessionCacheSet(barcode: string, data: ScanResult) {
  try {
    // FIFO eviction if at max capacity
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith('barcode:'))
    if (keys.length >= SESSION_CACHE_MAX) {
      sessionStorage.removeItem(keys[0])
    }
    sessionStorage.setItem(`barcode:${barcode}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

async function fetchBarcode(barcode: string): Promise<ScanResult> {
  // 0. Client-side sessionStorage cache — avoids roundtrip for recently scanned barcodes
  const cached = sessionCacheGet(barcode)
  if (cached) return cached

  // 1. Hämta session först så att auth.uid() är redo för efterföljande RPC-anrop
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  // 2. Rate-limit-kontroll — ignorera RPC-fel (låt passera vid tekniskt fel)
  const { data: rateLimited } = await supabase.rpc('check_barcode_rate_limit')
  if (rateLimited === true) {
    throw makeLookupError('rate_limited')
  }

  // 3. Cache-kontroll
  const { data: cacheResult, error: cacheError } = await supabase.rpc('check_barcode_cache', {
    p_barcode: barcode,
  })
  if (cacheError) throw makeLookupError('fetch_failed')

  const cache = cacheResult as { hit: boolean; error?: string; data?: Record<string, unknown> }

  if (cache.hit) {
    if (cache.error) throw makeLookupError(cache.error)
    const result = parseData(cache.data!)
    sessionCacheSet(barcode, result)
    return result
  }

  // 4. Cache-miss: anropa Edge Function direkt från klienten
  console.debug('[barcode] sending to edge function:', barcode)

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

  // 5. Spara i cache (fire-and-forget — väntar inte)
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

  const parsed = parseData(result.data)
  sessionCacheSet(barcode, parsed)
  return parsed
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
