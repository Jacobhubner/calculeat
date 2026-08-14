import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DATA_SOURCES,
  getDataSourceForLocale,
  getDataSourceForTimeZone,
} from '@/lib/constants/dataSources'
import { useProfileStore } from '@/stores/profileStore'
import { deviceTimeZone } from '@/lib/utils/localDate'
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
export function resolveSource(
  preference: PreferredFoodSource,
  locale: string,
  timeZone?: string
): ResolvedFoodSource {
  if (preference !== 'auto') return preference

  // 1. Språk med region ('sv', 'en-GB') är starkast: användaren har uttryckt
  //    det aktivt, och en region i taggen är otvetydig.
  const normalized = locale.toLowerCase()
  const hasRegion = normalized.includes('-')
  const byLocale = getDataSourceForLocale(locale)
  if (byLocale && hasRegion) return byLocale.tabKey

  // 2. Utan region räcker inte språket: i18next normaliserar 'en-GB' → 'en', så
  //    britt och amerikan ser likadana ut. Tidszonen skiljer dem åt.
  //
  //    Gäller bara engelska. 'sv' pekar entydigt på Livsmedelsverket, och en
  //    svensk på semester i New York ska inte plötsligt få USDA — språket är
  //    då det stabilare svaret.
  if (timeZone && normalized.startsWith('en')) {
    const byZone = getDataSourceForTimeZone(timeZone)
    if (byZone) return byZone.tabKey
  }

  // 3. Brett språkval ('en' → USDA) när zonen inte gav svar.
  return byLocale?.tabKey ?? FALLBACK_SOURCE
}

export interface UseFoodSourceResult {
  preference: PreferredFoodSource
  resolved: ResolvedFoodSource
  setPreference: (value: PreferredFoodSource) => void
}

export function useFoodSource(): UseFoodSourceResult {
  const { i18n } = useTranslation()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const [preference, setPreferenceState] = useState<PreferredFoodSource>(readFromStorage)

  // Profilens sparade zon går före enhetens: den följer kontot mellan enheter
  // och är den användaren bekräftat vid en eventuell resa.
  const timeZone = activeProfile?.timezone ?? deviceTimeZone()

  // Härleds synkront ur preferens + språk + zon. useTranslation triggar
  // omrendering vid språkbyte, så värdet räknas om automatiskt.
  const resolved = resolveSource(preference, i18n.language, timeZone)

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
