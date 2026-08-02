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
  const { t } = useTranslation('premium')
  const { plan } = useEntitlements()
  const { data: subscription } = useMySubscription()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  const [loading, setLoading] = useState(false)

  if (plan === 'free') {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {t('badge.premium')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-700">{t('subscription.freeText')}</p>
          <Button onClick={() => openUpgradeModal()} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t('subscription.upgradeCta')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (subscription?.source !== 'stripe') return null

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
      <CardContent>
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
