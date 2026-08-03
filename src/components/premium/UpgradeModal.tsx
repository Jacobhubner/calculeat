import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { trackConversion } from '@/lib/analytics'
import { useMySubscription } from '@/hooks/useEntitlements'
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
  'recipe_bank_full',
  'advanced_trends',
] as const

type LimitMessageKey = (typeof LIMIT_MESSAGE_KEYS)[number]

function isLimitMessageKey(key: PremiumLimitKey): key is LimitMessageKey {
  return (LIMIT_MESSAGE_KEYS as readonly string[]).includes(key)
}

/**
 * Central uppgraderingsmodal. CTA-knapparna skapar en Stripe Checkout-session
 * via Edge Functionen create-checkout-session och skickar användaren dit.
 */
export function UpgradeModal({ open, onOpenChange, limitKey }: UpgradeModalProps) {
  const { t } = useTranslation('premium')
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null)
  // Trial ges bara första gången (se create-checkout-session) — lova den
  // inte i UI:t för den som redan förbrukat sin
  const { data: subscription } = useMySubscription()
  const hasUsedTrial = subscription?.source === 'stripe'

  // Funnel-steg 1: paywallen visades (med ev. kvot som utlöste den)
  useEffect(() => {
    if (open) trackConversion('paywall_shown', limitKey ? { limitKey } : undefined)
  }, [open, limitKey])

  const startCheckout = async (plan: 'monthly' | 'yearly') => {
    setLoadingPlan(plan)
    trackConversion('checkout_started', { plan })
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan },
      })
      if (error || !data?.url) throw error ?? new Error('missing checkout url')
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(t('upgradeModal.checkoutError'))
      setLoadingPlan(null)
    }
  }

  const limitMessage = limitKey
    ? isLimitMessageKey(limitKey)
      ? t(`upgradeModal.limitReached.${limitKey}`, {
          limit: FREE_LIMITS[limitKey],
        })
      : t('upgradeModal.limitReached.generic')
    : null

  const compareRows = [
    'barcode',
    'labelScan',
    'suggestions',
    'history',
    'recipes',
    'recipeBank',
    'meals',
    'tdee',
    'dietModes',
    'calibration',
    'bodyComp',
    'equations',
    'trends',
  ] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* z-[10000] så jämförelsen alltid ligger över InfoModal (z-[9999]) när
          man klickar på ett låst element inuti en info-modal. */}
      <DialogContent
        overlayClassName="z-[10000]"
        className="z-[10000] max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {t('upgradeModal.title')}
          </DialogTitle>
          <DialogDescription>{limitMessage ?? t('upgradeModal.description')}</DialogDescription>
        </DialogHeader>

        {/* Free vs Premium — jämförelsen är säljargumentet */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-[1.1fr_0.8fr_1.1fr] bg-neutral-50 text-xs font-semibold dark:bg-neutral-900">
            <div className="px-3 py-2" />
            <div className="px-2 py-2 text-center text-neutral-500 dark:text-neutral-400">
              {t('upgradeModal.compare.freeHeader')}
            </div>
            <div className="flex items-center justify-center gap-1 bg-amber-100 px-2 py-2 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t('upgradeModal.compare.premiumHeader')}
            </div>
          </div>
          {compareRows.map(row => (
            <div
              key={row}
              className="grid grid-cols-[1.1fr_0.8fr_1.1fr] border-t border-neutral-100 dark:border-neutral-700 text-xs"
            >
              <div className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-200">
                {t(`upgradeModal.compare.rows.${row}.label`)}
              </div>
              <div className="px-2 py-2 text-center text-neutral-500 dark:text-neutral-400">
                {t(`upgradeModal.compare.rows.${row}.free`)}
              </div>
              <div className="bg-amber-50 px-2 py-2 text-center font-medium text-amber-800 dark:bg-amber-900/25 dark:text-amber-300">
                {t(`upgradeModal.compare.rows.${row}.premium`)}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('upgradeModal.dataPromise')}
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => startCheckout('monthly')} disabled={loadingPlan !== null}>
            {loadingPlan === 'monthly' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('upgradeModal.ctaLoading')}
              </>
            ) : (
              t('upgradeModal.ctaMonthly')
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => startCheckout('yearly')}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === 'yearly' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('upgradeModal.ctaLoading')}
              </>
            ) : (
              t('upgradeModal.ctaYearly')
            )}
          </Button>
          {!hasUsedTrial && (
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              {t('upgradeModal.trialNote')}
            </p>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loadingPlan !== null}
          >
            {t('upgradeModal.later')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
