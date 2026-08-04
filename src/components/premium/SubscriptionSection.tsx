import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useEntitlements, useMySubscription } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'

/**
 * Prenumerationskort i inställningarna:
 * - Stripe-prenumeration → "Hantera prenumeration" (Customer Portal)
 * - Free-plan → uppgraderingskort som öppnar UpgradeModal
 * - Founder/soft launch → ingenting (osynligt tills hard launch)
 */
export function SubscriptionSection() {
  const { t, i18n } = useTranslation('premium')
  const { plan } = useEntitlements()
  const { data: subscription } = useMySubscription()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  const [loading, setLoading] = useState(false)

  if (plan === 'free') {
    // amber-900/orange-900 är mörkbruna — mot den mörkgröna sidbottnen blev
    // kortet grumligt snarare än guldigt. Mättad ton på låg opacitet behåller
    // premiumkänslan.
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-700/60 dark:from-amber-500/15 dark:to-orange-500/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {t('badge.premium')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('subscription.freeText')}
          </p>
          <Button onClick={() => openUpgradeModal()} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t('subscription.upgradeCta')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (subscription?.source !== 'stripe') return null

  // current_period_end = trialens slut under 'trialing', annars nästa dragning.
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(
        i18n.language === 'sv' ? 'sv-SE' : 'en-GB',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null

  // Uppsagd men ännu inte utlöpt: Stripe rapporterar fortfarande
  // trialing/active, bara flaggan skiljer. Då får uppmaningen att säga upp
  // INTE visas — användaren har redan gjort det.
  const pendingCancel = subscription.cancel_at_period_end
  const { status } = subscription

  let statusText: string | null = null
  if (status === 'past_due') {
    statusText = t('subscription.pastDue')
  } else if (periodEnd) {
    if (status === 'trialing') {
      statusText = pendingCancel
        ? t('subscription.trialCancelled', { date: periodEnd })
        : `${t('subscription.trialUntil', { date: periodEnd })} ${t('subscription.trialCancelHint')}`
    } else if (status === 'active') {
      statusText = pendingCancel
        ? t('subscription.activeCancelled', { date: periodEnd })
        : t('subscription.renewsOn', { date: periodEnd })
    } else if (status === 'canceled') {
      statusText = t('subscription.cancelsOn', { date: periodEnd })
    }
  }

  // past_due är det enda som kräver en åtgärd av användaren
  const isWarning = status === 'past_due'

  const openPortal = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      })
      if (error || !data?.url) throw error ?? new Error('missing portal url')
      window.location.href = data.url
    } catch (err) {
      console.error('Portal error:', err)
      toast.error(t('subscription.portalError'))
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
          {t('badge.premium')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusText && (
          <p
            className={
              isWarning
                ? 'text-sm text-amber-700 dark:text-amber-400'
                : 'text-sm text-neutral-700 dark:text-neutral-300'
            }
          >
            {statusText}
          </p>
        )}
        {pendingCancel && status !== 'canceled' && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('subscription.resumeHint')}
          </p>
        )}
        <Button variant="outline" onClick={openPortal} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          )}
          {t('subscription.manage')}
        </Button>
      </CardContent>
    </Card>
  )
}
