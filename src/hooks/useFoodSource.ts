import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DATA_SOURCES, getDataSourceForLocale } from '@/lib/constants/dataSources'
import type { FoodTab } from '@/hooks/useFoodItems'

/**
 * 'auto' låter språket avgöra; övriga värden är tabKey från DATA_SOURCES.
 * Typen härleds ur registret i stället för att räknas upp, så en ny källa
 * blir giltig automatiskt.
 */
export type PreferredFoodSource = FoodTab | 'auto'
export type ResolvedFoodSource = FoodTab

const STORAGE_KEY = 'calculeat_food_source_preference'

/**
 * Sista utväg när varken preferens eller språk matchar en känd källa
 * (t.ex. 'de-DE'). USDA är bredast i innehåll och engelskspråkig, så den
 * fungerar bäst för användare utan egen nationell databas — samma val som
 * den tidigare `locale.startsWith('sv') ? 'slv' : 'usda'` gjorde.
 */
const FALLBACK_SOURCE: ResolvedFoodSource = 'usda'

function isValidPreference(value: unknown): value is PreferredFoodSource {
  if (value === 'auto') return true
  return DATA_SOURCES.some(ds => ds.tabKey === value)
}

function readFromStorage(): PreferredFoodSource {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isValidPreference(stored)) return stored
  } catch {
    // ignore localStorage errors (e.g. private browsing restrictions)
  }
  return 'auto'
}

/**
 * Slår upp källan i registret i stället för en hårdkodad if-sats.
 *
 * Tidigare gällde `locale.startsWith('sv') ? 'slv' : 'usda'`, vilket inte
 * kunde skilja en-GB från en-US — brittiska användare fick USDA som
 * förstahandskälla. Nu bestämmer primaryLocales i DATA_SOURCES, så en ny
 * källa (t.ex. brittisk CoFID på 'en-GB') fungerar utan ändring här.
 */
function resolveSource(preference: PreferredFoodSource, locale: string): ResolvedFoodSource {
  if (preference !== 'auto') return preference
  return getDataSourceForLocale(locale)?.tabKey ?? FALLBACK_SOURCE
}

export interface UseFoodSourceResult {
  preference: PreferredFoodSource
  resolved: ResolvedFoodSource
  setPreference: (value: PreferredFoodSource) => void
}

export function useFoodSource(): UseFoodSourceResult {
  const { i18n } = useTranslation()
  const [preference, setPreferenceState] = useState<PreferredFoodSource>(readFromStorage)

  // Härleds synkront ur preferens + språk. useTranslation triggar omrendering
  // vid språkbyte, så värdet räknas om automatiskt — ingen effekt behövs.
  const resolved = resolveSource(preference, i18n.language)

  const setPreference = useCallback((value: PreferredFoodSource) => {
    setPreferenceState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore write errors
    }
  }, [])

  return { preference, resolved, setPreference }
}
