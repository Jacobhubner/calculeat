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
            'flex items-center justify-center h-11 w-11 -mt-5 rounded-full',
            'bg-primary-600 text-white shadow-lg shadow-primary-600/30',
            'ring-4 ring-white transition-transform active:scale-95'
          )}
        >
          {ensureLog.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-6 w-6" strokeWidth={2.5} />
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
        />
      )}
    </>
  )
}
