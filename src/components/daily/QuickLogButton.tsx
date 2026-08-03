import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AddFoodToMealModal } from './AddFoodToMealModal'
import { useEnsureTodayLog } from '@/hooks/useDailyLogs'
import { cn } from '@/lib/utils'

/**
 * Global snabbloggning — den upphöjda "+"-knappen mitt i mobilnavigeringen.
 *
 * Loggning är den handling som avgör om appen används dagligen, så den ska
 * vara nåbar från varje sida utan omväg via Dagens logg. Knappen säkerställer
 * dagens logg och öppnar det ordinarie AddFoodToMealModal med måltidsväljaren
 * påslagen — samma flöde användaren redan känner igen, inte en parallell väg.
 */
export default function QuickLogButton() {
  const { t } = useTranslation('common')
  const ensureLog = useEnsureTodayLog()
  const [dailyLogId, setDailyLogId] = useState<string | null>(null)

  const openQuickLog = async () => {
    if (ensureLog.isPending) return
    try {
      const log = await ensureLog.mutateAsync()
      setDailyLogId(log.id)
    } catch (error) {
      console.error('Quick log failed:', error)
      toast.error(t('quickLog.error'))
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openQuickLog}
        disabled={ensureLog.isPending}
        aria-label={t('quickLog.label')}
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-0.5',
          'text-[10px] font-medium text-neutral-400 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'disabled:opacity-70'
        )}
      >
        <span
          className={cn(
            'relative flex items-center justify-center h-12 w-12 -mt-6 rounded-full',
            'text-white ring-4 ring-white dark:ring-neutral-850',
            'transition-transform duration-150 active:scale-95',
            // Loggans gradient: blad-grönt → gult → orange, samma vinkel som märket
            'bg-[linear-gradient(135deg,#7bbe2a_0%,#edbe0c_53%,#fc8518_100%)]',
            'shadow-[0_4px_14px_-2px_rgba(252,133,24,0.45)]'
          )}
        >
          {/* Mjuk högdager uppe till vänster ger knappen samma rundade
              volym som bladet i märket, istället för en platt cirkel. */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.42),transparent_58%)]"
          />
          {ensureLog.isPending ? (
            <Loader2 className="relative h-5 w-5 animate-spin" />
          ) : (
            <Plus className="relative h-6 w-6 drop-shadow-sm" strokeWidth={2.75} />
          )}
        </span>
        <span className="truncate">{t('quickLog.label')}</span>
      </button>

      {dailyLogId && (
        <AddFoodToMealModal
          open={!!dailyLogId}
          onOpenChange={open => {
            if (!open) setDailyLogId(null)
          }}
          mealName=""
          dailyLogId={dailyLogId}
          showMealSelector
          allowSavedMeals
        />
      )}
    </>
  )
}
