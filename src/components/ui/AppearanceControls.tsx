import { useTranslation } from 'react-i18next'
import { Monitor, MoonStar, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore, type ThemePreference } from '@/stores/themeStore'
import { LanguageSwitcher } from './LanguageSwitcher'

const OPTIONS = [
  { value: 'system', Icon: Monitor, labelKey: 'settings.themeSystem' },
  { value: 'light', Icon: Sun, labelKey: 'settings.themeLight' },
  { value: 'dark', Icon: MoonStar, labelKey: 'settings.themeDark' },
] as const

/**
 * Tema + språk för avatarmenyn.
 *
 * Båda är val man gör en gång och sedan inte rör. De låg tidigare som
 * permanenta ikoner i mobilheadern, som redan bär PlanBadge, Social och
 * avatar — dyr yta för inställningar som används sällan, och det motverkade
 * bantningen av mobilnavigeringen.
 *
 * Trevalskontroll i stället för en cyklande knapp: i en meny finns utrymme
 * att visa alla lägen, och då slipper man gissa vad nästa klick ger.
 * Skriver till samma themeStore som inställningssidan, så de speglar varandra.
 */
interface AppearanceControlsProps {
  /**
   * Anropas när språket byts. Språkvalet navigerar till motsvarande URL, så
   * menyn måste stängas — annars ligger den kvar över en nyladdad sida.
   * Temavalet stänger den avsiktligt inte: man vill kunna jämföra lägena.
   */
  onNavigate?: () => void
}

export function AppearanceControls({ onNavigate }: AppearanceControlsProps) {
  const { t } = useTranslation('profile')
  const preference = useThemeStore(state => state.preference)
  const setPreference = useThemeStore(state => state.setPreference)

  return (
    <div className="px-4 py-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 dark:text-neutral-400">
          {t('settings.theme')}
        </p>
        <div role="radiogroup" aria-label={t('settings.theme')} className="grid grid-cols-3 gap-1">
          {OPTIONS.map(({ value, Icon, labelKey }) => {
            const active = preference === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPreference(value as ThemePreference)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] font-medium transition-colors',
                  active
                    ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t(labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-neutral-400">
          {t('settings.language')}
        </p>
        {/* LanguageSwitcher tar ingen callback. Att lägga till en prop bara
            för det här skulle påverka alla fyra andra användningar, så menyn
            stängs i stället via bubblande klick från flaggknapparna. */}
        <div onClick={onNavigate}>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
