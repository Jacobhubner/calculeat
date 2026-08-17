// Skapar en Stripe Checkout-session för Calculeat Premium.
// Kräver secrets: STRIPE_SECRET_KEY. Priser slås upp via lookup_keys
// (premium_monthly / premium_yearly) — inga hårdkodade pris-ID:n.
// Se docs/PREMIUM_SPEC.md (Fas 4).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@18.5.0'

const TRIAL_DAYS = 7
const FALLBACK_ORIGIN = 'https://calculeat.com'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
  if (!STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'server_error', message: 'Server configuration error.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'unauthorized', message: 'Du är inte inloggad.' }, 401)
  }

  let plan: string
  try {
    const body = await req.json()
    plan = body.plan
  } catch {
    return jsonResponse({ error: 'invalid_body', message: 'Ogiltigt anrop.' }, 400)
  }

  if (plan !== 'monthly' && plan !== 'yearly') {
    return jsonResponse({ error: 'invalid_plan', message: 'Ogiltig plan.' }, 400)
  }

  // Beslutsunderlaget kommer från get_checkout_eligibility, som väger samman
  // user_subscriptions (nuläget) och subscription_events (historiken).
  //
  // VARFÖR INTE BARA RADEN: user_subscriptions har en rad per användare som
  // skrivs över — och kan raderas. Låg missbruksskyddet bara där skulle en
  // förlorad rad dela ut en ny gratisperiod och skapa en dubbel Stripe-kund.
  // Det inträffade 2026-08-17. Loggen är append-only och kan inte tappas
  // på samma sätt.
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const { data: eligibility, error: eligibilityError } = await supabaseAdmin
    .rpc('get_checkout_eligibility', { p_user_id: user.id })
    .maybeSingle<{
      has_used_trial: boolean
      has_active_sub: boolean
      stripe_customer_id: string | null
    }>()

  // Utan underlag vet vi inte om provperioden är förbrukad. Att gissa "nej"
  // delar ut gratismånader; att gissa "ja" nekar en ny kund sin provperiod.
  // Ingetdera är acceptabelt tyst, så vi avbryter i stället.
  if (eligibilityError || !eligibility) {
    console.error('Kunde inte läsa checkout-underlag:', eligibilityError)
    return jsonResponse(
      { error: 'server_error', message: 'Kunde inte starta betalningen. Försök igen.' },
      500
    )
  }

  // Blockera dubbelprenumeration — en aktiv Stripe-prenumeration per användare
  if (eligibility.has_active_sub) {
    return jsonResponse(
      { error: 'already_subscribed', message: 'Du har redan en aktiv prenumeration.' },
      400
    )
  }

  // Missbruksskydd: trial ges bara FÖRSTA gången. Har användaren någon gång
  // haft provperiod eller betalning hos Stripe debiteras omtecknande direkt.
  const hasUsedTrial = eligibility.has_used_trial

  const stripe = new Stripe(STRIPE_SECRET_KEY)

  const lookupKey = plan === 'monthly' ? 'premium_monthly' : 'premium_yearly'
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
  const price = prices.data[0]
  if (!price) {
    console.error('Price not found for lookup key:', lookupKey)
    return jsonResponse({ error: 'server_error', message: 'Priset kunde inte hittas.' }, 500)
  }

  const origin = req.headers.get('origin') ?? FALLBACK_ORIGIN

  // Återanvänd Stripe-kunden vid omtecknande — samma användare ska vara
  // samma kund (historik, sparade betalmetoder i portalen). Kunden hämtas
  // ur underlaget ovan, som faller tillbaka på loggen om raden saknas.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: user.id,
    ...(eligibility.stripe_customer_id
      ? { customer: eligibility.stripe_customer_id }
      : { customer_email: user.email ?? undefined }),
    subscription_data: {
      ...(hasUsedTrial ? {} : { trial_period_days: TRIAL_DAYS }),
      metadata: { user_id: user.id },
    },
    allow_promotion_codes: true,
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/app?checkout=cancelled`,
  })

  return jsonResponse({ url: session.url })
})
