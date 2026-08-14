import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTimeZoneSync } from '@/hooks/useTimeZoneSync'

/**
 * Diskret banner när enhetens tidszon avviker från den sparade.
 *
 * Medvetet inte en modal: användaren står ofta mitt i något (nyss landat,
 * öppnar appen för att logga lunch) och ska kunna ignorera frågan. En modal
 * hade tvingat fram ett svar för något som inte är brådskande.
 *
 * Zonnamnet visas i läsbar form ('New York', inte 'America/New_York').
 */
export function TimeZoneChangePrompt() {
  const { t } = useTranslation('profile')
  const { pendingZone, savedZone, acceptZone, keepZone, isSaving } = useTimeZoneSync()

  if (!pendingZone) return null

  const cityName = (zone: string) => zone.split('/').pop()?.replace(/_/g, ' ') ?? zone

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-900/20"
    >
      <div className="flex gap-3">
        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {t('timezone.detectedTitle', { city: cityName(pendingZone) })}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            {t('timezone.detectedBody', {
              current: savedZone ? cityName(savedZone) : '',
              detected: cityName(pendingZone),
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void acceptZone()} disabled={isSaving}>
              {t('timezone.switchTo', { city: cityName(pendingZone) })}
            </Button>
            <Button size="sm" variant="outline" onClick={keepZone} disabled={isSaving}>
              {t('timezone.keep', { city: savedZone ? cityName(savedZone) : '' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
