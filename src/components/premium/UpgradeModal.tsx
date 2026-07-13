import { Sparkles, TrendingUp, UtensilsCrossed, Calculator, LineChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FREE_LIMITS, PremiumLimitKey } from '@/lib/constants/entitlements'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sätt när modalen öppnas p.g.a. en nådd kvot — ger specifik rubriktext */
  limitKey?: PremiumLimitKey | null
}

const LIMIT_MESSAGE_KEYS = [
  'saved_meals',
  'recipes',
  'owned_shared_lists',
  'label_scans_per_month',
] as const

type LimitMessageKey = (typeof LIMIT_MESSAGE_KEYS)[number]

function isLimitMessageKey(key: PremiumLimitKey): key is LimitMessageKey {
  return (LIMIT_MESSAGE_KEYS as readonly string[]).includes(key)
}

/**
 * Central uppgraderingsmodal. CTA:n är "Kommer snart" tills Stripe-flödet
 * finns (Fas 4) — modalen byggs nu så att alla gates redan pekar rätt.
 */
export function UpgradeModal({ open, onOpenChange, limitKey }: UpgradeModalProps) {
  const { t } = useTranslation('premium')

  const limitMessage = limitKey
    ? isLimitMessageKey(limitKey)
      ? t(`upgradeModal.limitReached.${limitKey}`, {
          limit: FREE_LIMITS[limitKey],
        })
      : t('upgradeModal.limitReached.generic')
    : null

  const benefits = [
    { icon: TrendingUp, text: t('upgradeModal.benefits.history') },
    { icon: UtensilsCrossed, text: t('upgradeModal.benefits.recipes') },
    { icon: Calculator, text: t('upgradeModal.benefits.tools') },
    { icon: LineChart, text: t('upgradeModal.benefits.analysis') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {t('upgradeModal.title')}
          </DialogTitle>
          <DialogDescription>{limitMessage ?? t('upgradeModal.description')}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 py-2">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-neutral-700">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>

        <p className="text-xs text-neutral-500">{t('upgradeModal.dataPromise')}</p>

        <div className="flex flex-col gap-2 pt-2">
          <Button disabled>{t('upgradeModal.cta')}</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('upgradeModal.later')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
