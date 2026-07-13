import { ReactNode, useState } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { PlanLimits } from '@/lib/constants/entitlements'
import { PremiumBadge } from './PremiumBadge'
import { UpgradeModal } from './UpgradeModal'
import { cn } from '@/lib/utils'

/** Nycklar i PlanLimits som är av/på-features (inte numeriska kvoter) */
type BooleanFeatureKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never
}[keyof PlanLimits]

interface PremiumGateProps {
  feature: BooleanFeatureKey
  children: ReactNode
  className?: string
}

/**
 * Wrapper för premiumfunktioner. Fri åtkomst → renderar barnen rakt av.
 * Låst → barnen visas suddade och oklickbara bakom ett lås som öppnar
 * UpgradeModal ("visa suddad, inte gömd" — se PREMIUM_SPEC.md).
 *
 * Preview mode-beslut: öppna med "Ingår i Premium"-badge istället för lås.
 */
export function PremiumGate({ feature, children, className }: PremiumGateProps) {
  const { isPreviewMode } = useAuth()
  const { limits } = useEntitlements()
  const { t } = useTranslation('premium')
  const [modalOpen, setModalOpen] = useState(false)

  if (limits[feature]) {
    return <>{children}</>
  }

  if (isPreviewMode) {
    return (
      <div className={cn('relative', className)}>
        <div className="mb-2 flex justify-end">
          <PremiumBadge variant="included" />
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div aria-hidden="true" className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/40 text-neutral-700 transition-colors hover:bg-white/55"
      >
        <Lock className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">{t('gate.lockedTitle')}</span>
        <PremiumBadge />
      </button>
      <UpgradeModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
