import { useTranslation } from 'react-i18next'
import { isUnlimited } from '@/hooks/useEntitlements'
import { cn } from '@/lib/utils'

interface QuotaCounterProps {
  used: number
  limit: number
  className?: string
}

/**
 * Kvotpill ("2 av 3 använda") för numeriska plan-gränser. Renderar ingenting
 * vid obegränsad plan — alltså osynlig under hela soft launch. Amber när
 * kvoten är full, som mjuk friktion innan servern säger nej.
 */
export function QuotaCounter({ used, limit, className }: QuotaCounterProps) {
  const { t } = useTranslation('premium')
  if (isUnlimited(limit)) return null

  const atLimit = used >= limit
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        atLimit
          ? 'border-amber-400 bg-amber-100 text-amber-700'
          : 'border-neutral-300 bg-neutral-100 text-neutral-600',
        className
      )}
    >
      {t('gate.quotaCounter', { used, limit })}
    </span>
  )
}
