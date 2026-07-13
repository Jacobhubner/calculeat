import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useEntitlements, useMySubscription } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { cn } from '@/lib/utils'

interface PlanBadgeProps {
  className?: string
}

/**
 * Plan-chip vid användarkortet ("Premium" / "Gratis").
 * Gratis-chipen är klickbar och öppnar UpgradeModal.
 * Visas bara när planen är "verklig": Stripe-prenumeration, forcerad
 * free-rad, eller efter hard launch (enforcement on). Under soft launch,
 * där alla behandlas som founder, renderas ingenting.
 */
export function PlanBadge({ className }: PlanBadgeProps) {
  const { t } = useTranslation('premium')
  const { plan, isPremium, enforcement } = useEntitlements()
  const { data: subscription } = useMySubscription()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  if (plan === 'free') {
    return (
      <button
        type="button"
        onClick={() => openUpgradeModal()}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 transition-colors hover:border-amber-400 hover:bg-amber-100 hover:text-amber-700 cursor-pointer',
          className
        )}
      >
        {t('badge.free')}
        <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    )
  }

  if (isPremium && (subscription?.source === 'stripe' || enforcement === 'on')) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700',
          className
        )}
      >
        <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
        {t('badge.premium')}
      </span>
    )
  }

  return null
}
