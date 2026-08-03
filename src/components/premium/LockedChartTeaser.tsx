import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumBadge } from '@/components/premium/PremiumBadge'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import type { PremiumLimitKey } from '@/lib/constants/entitlements'

interface LockedChartTeaserProps {
  /** Grafens titel — visas i klartext, det är den som ska skapa suget. */
  title: string
  /** En rad om vad grafen faktiskt ger användaren. */
  description: string
  /** Vilken entitlement-nyckel som låser upp den. */
  limitKey: PremiumLimitKey
}

/**
 * Platshållare för en graf som är helt premiumlåst.
 *
 * Poängen: en gratisanvändare ska VETA att funktionen finns och vad den ger,
 * annars kan de inte sakna den (se docs/PREMIUM_SPEC.md). Vi visar därför
 * titel + beskrivning i klartext och en dekorativ, innehållslös kurva bakom
 * ett lås — aldrig användarens riktiga data, som ju är det man betalar för.
 */
export function LockedChartTeaser({ title, description, limitKey }: LockedChartTeaserProps) {
  const { t } = useTranslation('profile')
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  return (
    <button
      type="button"
      onClick={() => openUpgradeModal(limitKey)}
      className="w-full text-left rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-900/40 p-4 hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{title}</h4>
        <PremiumBadge className="ml-auto" />
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{description}</p>

      {/* Dekorativ kurva — ren illustration, ingen riktig mätdata */}
      <div className="relative h-24 overflow-hidden rounded-md bg-white/70 dark:bg-neutral-850">
        <svg
          viewBox="0 0 300 96"
          preserveAspectRatio="none"
          className="h-full w-full blur-[2px] opacity-60"
          aria-hidden="true"
        >
          <polyline
            points="0,70 40,62 80,66 120,48 160,52 200,34 240,38 300,22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary-500"
          />
          <polyline
            points="0,80 40,76 80,78 120,68 160,70 200,60 240,62 300,52"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 4"
            className="text-neutral-400"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-neutral-800/90 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 shadow-sm group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
            <Lock className="h-3 w-3" />
            {t('weightTracker.lockedChartCta')}
          </span>
        </div>
      </div>
    </button>
  )
}
