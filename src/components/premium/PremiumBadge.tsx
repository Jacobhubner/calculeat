import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PremiumBadgeProps {
  /** 'premium' = kort etikett, 'included' = "Ingår i Premium" (preview mode) */
  variant?: 'premium' | 'included'
  className?: string
}

/**
 * Guldfärgad premium-markör. Används på låsta funktioner och i preview mode
 * (beslut: premiumfunktioner visas öppna med badge i preview, se PREMIUM_SPEC.md).
 */
export function PremiumBadge({ variant = 'premium', className }: PremiumBadgeProps) {
  const { t } = useTranslation('premium')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700',
        className
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {variant === 'included' ? t('badge.includedInPremium') : t('badge.premium')}
    </span>
  )
}
