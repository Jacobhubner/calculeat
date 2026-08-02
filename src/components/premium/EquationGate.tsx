import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { PlanLimits } from '@/lib/constants/entitlements'

type BooleanFeatureKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never
}[keyof PlanLimits]

interface EquationGateProps {
  feature: BooleanFeatureKey
  children: ReactNode
}

/**
 * Gate för exakta ekvationer i info-modaler (BMR-formler, PAL-system,
 * kroppskompositionsmetoder). Till skillnad från PremiumGate (blur)
 * renderas innehållet INTE alls för free — ekvationerna är själva
 * värdet och får inte ligga läsbara i DOM:en. Istället visas en låst
 * ruta som öppnar UpgradeModal.
 */
export function EquationGate({ feature, children }: EquationGateProps) {
  const { limits } = useEntitlements()
  const { t } = useTranslation('premium')
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  if (limits[feature]) {
    return <>{children}</>
  }

  return (
    <button
      type="button"
      onClick={() => openUpgradeModal()}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-300 dark:hover:bg-amber-900/40"
    >
      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t('gate.equationLocked')}
    </button>
  )
}
