// Stripe-webhook: enda skrivvägen för Stripe-prenumerationer in i
// user_subscriptions (source='stripe'). Verifierar signaturen med
// STRIPE_WEBHOOK_SECRET — deployas med verify_jwt: false (Stripe
// skickar ingen JWT; signaturen ÄR autentiseringen).
// Se docs/PREMIUM_SPEC.md (Fas 4).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@18.5.0'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Mappar Stripes prenumerationsstatus till user_subscriptions.status
// (CHECK-constraint: active/trialing/past_due/canceled)
function mapStatus(stripeStatus: string): string {
  if (stripeStatus === 'active') return 'active'
  if (stripeStatus === 'trialing') return 'trialing'
  if (stripeStatus === 'past_due') return 'past_due'
  return 'canceled'
}

// current_period_end flyttades till item-nivå i nyare Stripe-API-versioner —
// läs båda platserna.
function periodEnd(sub: Stripe.Subscription): string | null {
  const itemEnd = sub.items?.data?.[0]?.current_period_end
  const subEnd = (sub as unknown as { current_period_end?: number }).current_period_end
  const ts = itemEnd ?? subEnd
  return ts ? new Date(ts * 1000).toISOString() : null
}

Deno.serve(async (req: Request) => {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response('Server configuration error', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', String(err))
    return new Response('Invalid signature', { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.client_reference_id
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id

        if (!userId || !subscriptionId) {
          console.error('checkout.session.completed saknar user/subscription:', session.id)
          break
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        const { error } = await supabaseAdmin.from('user_subscriptions').upsert(
          {
            user_id: userId,
            plan: 'premium',
            status: mapStatus(sub.status),
            current_period_end: periodEnd(sub),
            source: 'stripe',
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId,
          },
          { onConflict: 'user_id' }
        )
        if (error) throw error

        // Historiken: user_subscriptions har en rad per användare som skrivs
        // över, så utan loggen går det inte att se om någon haft provperiod
        // eller betalat tidigare. Ett misslyckat logg-skriv får inte fälla
        // själva prenumerationen — den är redan sparad ovan.
        const { error: logError } = await supabaseAdmin.from('subscription_events').insert({
          user_id: userId,
          event_type: sub.status === 'trialing' ? 'trial_started' : 'payment_started',
          plan: 'premium',
          source: 'stripe',
          period_end: periodEnd(sub),
        })
        if (logError) console.error('Kunde inte logga prenumerationshändelse:', logError)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const status =
          event.type === 'customer.subscription.deleted' ? 'canceled' : mapStatus(sub.status)

        // Hitta raden via subscription-id; fall tillbaka på metadata.user_id
        const { data: row } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()

        const userId = row?.user_id ?? sub.metadata?.user_id
        if (!userId) {
          console.error('Ingen användare för subscription:', sub.id)
          break
        }

        const { error } = await supabaseAdmin.from('user_subscriptions').upsert(
          {
            user_id: userId,
            plan: 'premium',
            status,
            current_period_end: periodEnd(sub),
            source: 'stripe',
            // Vid 'deleted' är uppsägningen genomförd, inte längre "pågående"
            cancel_at_period_end:
              event.type === 'customer.subscription.deleted'
                ? false
                : (sub.cancel_at_period_end ?? false),
            stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
            stripe_subscription_id: sub.id,
          },
          { onConflict: 'user_id' }
        )
        if (error) throw error

        // Logga bara verkliga övergångar. 'updated' skickas även för små
        // ändringar (t.ex. metadata) och skulle annars fylla historiken med
        // brus utan informationsvärde.
        const loggedType =
          status === 'canceled'
            ? 'canceled'
            : status === 'trialing'
              ? 'trial_started'
              : status === 'active'
                ? 'payment_renewed'
                : null

        if (loggedType) {
          const { error: logError } = await supabaseAdmin.from('subscription_events').insert({
            user_id: userId,
            event_type: loggedType,
            plan: 'premium',
            source: 'stripe',
            period_end: periodEnd(sub),
          })
          if (logError) console.error('Kunde inte logga prenumerationshändelse:', logError)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!subscriptionId) break

        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)
        if (error) throw error
        break
      }

      default:
        // Ohanterade eventtyper kvitteras utan åtgärd
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', event.type, String(err))
    return new Response('Handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
