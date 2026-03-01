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

async function fetchBarcode(barcode: string): Promise<ScanResult> {
  const { data, error } = await supabase.rpc('get_or_fetch_barcode', {
    p_barcode: barcode,
  })

  if (error) {
    throw {
      type: 'fetch_failed',
      message: ERROR_MESSAGES['fetch_failed'],
    } as LookupError
  }

  const result = data as { error?: string; source?: string; data?: Record<string, unknown> }

  if (result?.error) {
    const errorType = result.error as LookupError['type']
    throw {
      type: errorType,
      message: ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES['fetch_failed'],
    } as LookupError
  }

  if (!result?.data) {
    throw {
      type: 'fetch_failed',
      message: ERROR_MESSAGES['fetch_failed'],
    } as LookupError
  }

  const d = result.data

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
