import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useEntitlements, useMySubscription } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useFreeViewMode } from '@/hooks/useFreeViewMode'
import { usePreviewMode } from '@/hooks/usePreviewMode'
import { cn } from '@/lib/utils'

interface PlanBadgeProps {
  className?: string
}

/**
 * Plan-chip vid användarkortet ("Premium" / "Gratis").
 *
 * - Admins: chipen är en testväxel mellan premium- och gratisvy. Klick togglar
 *   free-view-läget (client-side, ingen DB) så man snabbt kan se appen som en
 *   gratisanvändare och tillbaka — utan att gå till Inställningar.
 * - Gratisanvändare: chipen öppnar UpgradeModal.
 * - Premium (icke-admin): statiskt chip, visas vid Stripe-prenumeration eller
 *   efter hard launch. Under soft launch renderas inget för icke-admins.
 */
export function PlanBadge({ className }: PlanBadgeProps) {
  const { t } = useTranslation('premium')
  const { plan, isPremium, enforcement } = useEntitlements()
  const { data: subscription } = useMySubscription()
  const { data: isAdmin = false } = useIsAdmin()
  const { isFreeViewActive, enterFreeView, exitFreeView } = useFreeViewMode()
  const { isPreviewActive } = usePreviewMode()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  // Admin-testväxel: klick byter mellan gratis- och premiumvy. Inaktiverad under
  // preview-läget (de två admin-lägena är ömsesidigt uteslutande, som i Inställningar).
  if (isAdmin) {
    const showingFree = isFreeViewActive
    return (
      <button
        type="button"
        onClick={() => {
          if (isPreviewActive) return
          if (showingFree) exitFreeView()
          else enterFreeView()
        }}
        disabled={isPreviewActive}
        title={t('badge.adminToggleHint')}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors',
          isPreviewActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          showingFree
            ? 'border-neutral-300 bg-neutral-100 text-neutral-600 hover:border-neutral-400'
            : 'border-amber-400 bg-amber-100 text-amber-700 hover:border-amber-500',
          className
        )}
      >
        <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
        {showingFree ? t('badge.free') : t('badge.premium')}
      </button>
    )
  }

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
