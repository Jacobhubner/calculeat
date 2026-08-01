/**
 * Temaval — ljust, mörkt eller följ systemet.
 *
 * Klassen `.dark` stämplas på <html> av applyTheme. Samma funktion körs
 * dessutom inline i index.html innan React monterar, så sidan aldrig blinkar
 * ljus innan temat hinner appliceras.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

/** Vad systemet säger just nu. */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Vilket tema som faktiskt ska visas för ett givet val. */
export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'system' ? getSystemTheme() : preference
}

export function applyTheme(preference: ThemePreference) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(preference)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  // Låter webbläsaren färga rullningslister och formulärkontroller rätt
  document.documentElement.style.colorScheme = resolved
}

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      preference: 'system',
      setPreference: preference => {
        applyTheme(preference)
        set({ preference })
      },
    }),
    {
      name: 'calculeat-theme',
      onRehydrateStorage: () => state => {
        // Sparat val kan skilja sig från vad inline-skriptet gissade
        if (state) applyTheme(state.preference)
      },
    }
  )
)
