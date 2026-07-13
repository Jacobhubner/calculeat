// Öppnar Stripe Customer Portal för inloggad användare med
// Stripe-prenumeration (uppsägning, kortbyte, kvitton — inget eget UI).
// Kräver secrets: STRIPE_SECRET_KEY. Se docs/PREMIUM_SPEC.md (Fas 4).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@18.5.0'

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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const { data: row } = await supabaseAdmin
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row?.stripe_customer_id) {
    return jsonResponse({ error: 'no_subscription', message: 'Ingen prenumeration hittades.' }, 404)
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const origin = req.headers.get('origin') ?? FALLBACK_ORIGIN

  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${origin}/app/settings`,
  })

  return jsonResponse({ url: session.url })
})
