import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { queryClient } from '@/lib/react-query'
import { trackConversion } from '@/lib/analytics'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { UpgradeModal } from './UpgradeModal'

/** Läser och städar bort ?checkout=... synkront — körs en gång vid första rendern */
function captureCheckoutResult(): string | null {
  const params = new URLSearchParams(window.location.search)
  const result = params.get('checkout')
  if (!result) return null
  params.delete('checkout')
  const query = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''))
  return result
}

/**
 * Monteras en gång i App. Öppnas via useUpgradeModalStore /
 * handlePremiumLimitError när en servertrigger avvisar med kvotfel.
 * Hanterar även återkomsten från Stripe Checkout (?checkout=success|cancelled).
 *
 * useSuspense: false — komponenten ligger utanför router-Suspense och får
 * inte suspendera på premium-namespacet; toasten väntar istället på `ready`.
 */
export function GlobalUpgradeModal() {
  const { isOpen, limitKey, close } = useUpgradeModalStore()
  const { t, ready } = useTranslation('premium', { useSuspense: false })

  // Fångas i state-initialiseraren: synkront, före eventuella route-redirects,
  // och exakt en gång (StrictMode-säkert — cleanupen gör andra läsningen null,
  // men initialiseraren behåller värdet).
  const [checkoutResult] = useState(captureCheckoutResult)
  const notified = useRef(false)

  useEffect(() => {
    if (!checkoutResult || !ready || notified.current) return
    notified.current = true

    if (checkoutResult === 'success') {
      toast.success(t('checkout.success'))
      trackConversion('checkout_success')
      // Webhooken har (eller hinner strax) skriva prenumerationsraden —
      // hämta om entitlements + prenumerationen så gates och
      // inställningskortet uppdateras utan omladdning
      queryClient.invalidateQueries({ queryKey: ['entitlements'] })
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
    } else if (checkoutResult === 'cancelled') {
      toast.info(t('checkout.cancelled'))
      trackConversion('checkout_cancelled')
    }
  }, [checkoutResult, ready, t])

  if (!ready) return null

  return <UpgradeModal open={isOpen} onOpenChange={open => !open && close()} limitKey={limitKey} />
}
