import { supabase } from '@/lib/supabase'

/**
 * Konverteringsmätning för premium-funneln (Fas 5, se docs/PREMIUM_SPEC.md):
 * paywall_shown → checkout_started → checkout_success/cancelled.
 * Trial/betald-status läses ur user_subscriptions (skrivs av Stripe-webhooken).
 *
 * Fire-and-forget: mätning får aldrig störa användarflödet — alla fel sväljs.
 */

export type ConversionEvent =
  | 'paywall_shown'
  | 'checkout_started'
  | 'checkout_success'
  | 'checkout_cancelled'

export function trackConversion(event: ConversionEvent, metadata?: Record<string, unknown>): void {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user.id
      if (!userId) return
      await supabase
        .from('conversion_events')
        .insert({ user_id: userId, event, metadata: metadata ?? null })
    } catch {
      // Medvetet tyst — se docblock
    }
  })()
}
