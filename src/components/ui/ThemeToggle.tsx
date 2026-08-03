import { useTranslation } from 'react-i18next'
import { Monitor, MoonStar, Sun } from 'lucide-react'
import { useThemeStore, type ThemePreference } from '@/stores/themeStore'

const ORDER: ThemePreference[] = ['system', 'light', 'dark']

const ICONS: Record<ThemePreference, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: MoonStar,
}

/**
 * Temaväxlare för sidhuvudet.
 *
 * Utloggade besökare nådde tidigare bara temat via inställningarna, som ligger
 * bakom inloggning — en besökare med mörkt OS fick mörkt läge påtvingat utan
 * väg ur. Här cyklar knappen system → ljust → mörkt i stället för att visa tre
 * separata knappar, eftersom sidhuvudet redan delar utrymme med språkväljaren.
 *
 * Inställningssidan behåller sin trevalskontroll; båda skriver till samma
 * themeStore, så valet följer med in i appen.
 */
export function ThemeToggle() {
  const { t } = useTranslation('profile')
  const preference = useThemeStore(state => state.preference)
  const setPreference = useThemeStore(state => state.setPreference)

  const Icon = ICONS[preference]
  const label = {
    system: t('settings.themeSystem'),
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
  }[preference]

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length]!
    setPreference(next)
  }

  return (
    <button
      onClick={cycle}
      className="flex items-center justify-center h-8 w-8 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      // Knappen visar nuvarande läge men byter till nästa — utan detta läser
      // skärmläsaren bara upp ikonen och valet blir gissningsarbete.
      aria-label={`${t('settings.theme')}: ${label}`}
      title={`${t('settings.theme')}: ${label}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
