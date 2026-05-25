import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export type PreferredFoodSource = 'slv' | 'usda' | 'auto'
export type ResolvedFoodSource = 'slv' | 'usda'

const STORAGE_KEY = 'calculeat_food_source_preference'

function isValidPreference(value: unknown): value is PreferredFoodSource {
  return value === 'slv' || value === 'usda' || value === 'auto'
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

function resolveSource(preference: PreferredFoodSource, locale: string): ResolvedFoodSource {
  if (preference === 'slv') return 'slv'
  if (preference === 'usda') return 'usda'
  // 'auto': derive from locale
  return locale.startsWith('sv') ? 'slv' : 'usda'
}

export interface UseFoodSourceResult {
  preference: PreferredFoodSource
  resolved: ResolvedFoodSource
  setPreference: (value: PreferredFoodSource) => void
}

export function useFoodSource(): UseFoodSourceResult {
  const { i18n } = useTranslation()
  const [preference, setPreferenceState] = useState<PreferredFoodSource>(readFromStorage)

  const resolved = resolveSource(preference, i18n.language)

  // Re-resolve if language changes (only affects 'auto' preference)
  useEffect(() => {
    // No state to update — resolved is derived synchronously from preference + language.
    // This effect intentionally empty; resolved re-computes on every render when i18n.language changes.
  }, [i18n.language])

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
