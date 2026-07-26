import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useEntitlements, useMySubscription } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useFreeViewMode } from '@/hooks/useFreeViewMode'
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
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  // Admin-testväxel: en toggle-switch mellan premium- och gratisvy. Fungerar
  // även i preview-sandlådan (preview styr data, freeView styr entitlements —
  // oberoende, går att kombinera för att testa som ny gratisanvändare).
  if (isAdmin) {
    const showingFree = isFreeViewActive
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          {t('badge.adminViewLabel')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showingFree}
          onClick={() => {
            if (showingFree) exitFreeView()
            else enterFreeView()
          }}
          title={t('badge.adminToggleHint')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-1 py-0.5 transition-colors cursor-pointer',
            showingFree ? 'border-neutral-300 bg-neutral-100' : 'border-amber-400 bg-amber-100'
          )}
        >
          {/* Track + knopp */}
          <span
            className={cn(
              'relative h-3.5 w-6 rounded-full transition-colors',
              showingFree ? 'bg-neutral-300' : 'bg-amber-400'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-all',
                showingFree ? 'left-0.5' : 'left-3'
              )}
            />
          </span>
          <span
            className={cn(
              'pr-1 text-[10px] font-semibold',
              showingFree ? 'text-neutral-600' : 'text-amber-700'
            )}
          >
            {showingFree ? t('badge.free') : t('badge.premium')}
          </span>
        </button>
      </div>
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
