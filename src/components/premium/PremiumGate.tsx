import { ReactNode, useState } from 'react'
import { Info, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'
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
  /** Funktionens namn — visas i låsvyn så free ser VAD som är låst */
  title?: string
  /** Beskrivning av funktionen — görs läsbar för free via "Vad är detta?" i låsvyn */
  infoBody?: string
}

/**
 * Wrapper för premiumfunktioner. Fri åtkomst → renderar barnen rakt av.
 * Låst → barnen visas suddade och oklickbara bakom ett lås som öppnar
 * UpgradeModal ("visa suddad, inte gömd" — se PREMIUM_SPEC.md).
 * Med `title`/`infoBody` ser free-användare funktionens namn och kan
 * läsa vad den gör — informationen är aldrig premium, bara funktionen.
 *
 * Preview mode-beslut: öppna med "Ingår i Premium"-badge istället för lås.
 */
export function PremiumGate({ feature, children, className, title, infoBody }: PremiumGateProps) {
  const { isPreviewMode } = useAuth()
  const { limits } = useEntitlements()
  const { t } = useTranslation('premium')
  const [modalOpen, setModalOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/40">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex flex-col items-center gap-2 rounded-lg px-6 py-3 text-neutral-700 transition-colors hover:bg-white/60"
        >
          <Lock className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">{title ?? t('gate.lockedTitle')}</span>
          <PremiumBadge />
        </button>
        {infoBody && (
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex items-center gap-1 text-xs text-neutral-600 underline hover:text-neutral-900"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {t('gate.whatIsThis')}
          </button>
        )}
      </div>
      <UpgradeModal open={modalOpen} onOpenChange={setModalOpen} />
      {infoBody && (
        <InfoModal
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          title={title ?? t('gate.lockedTitle')}
          size="md"
        >
          <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{infoBody}</p>
        </InfoModal>
      )}
    </div>
  )
}
