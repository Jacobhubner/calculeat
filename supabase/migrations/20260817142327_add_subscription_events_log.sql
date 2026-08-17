-- Händelselogg för prenumerationer.
--
-- VARFÖR: user_subscriptions har EN rad per användare (unique user_id) som
-- skrivs över vid varje ändring. Historiken — provperiod, betald period,
-- tilldelad premium, uppsägning — fanns därför inte att hämta. Superadmin
-- kunde se nuläget men inte hur någon hamnat där.
--
-- Loggen är append-only: rader skrivs men uppdateras aldrig. Den är en
-- redogörelse för vad som hänt, inte ett tillstånd.

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  /**
   * Vad som hände:
   *  trial_started    — provperiod inledd (Stripe)
   *  payment_started  — betald prenumeration inledd
   *  payment_renewed  — betalning förnyad
   *  canceled         — uppsagd eller upphörd
   *  granted          — superadmin gav premium gratis
   *  revoked          — superadmin tog bort tilldelad premium
   */
  event_type  text NOT NULL CHECK (event_type IN (
    'trial_started', 'payment_started', 'payment_renewed',
    'canceled', 'granted', 'revoked'
  )),

  plan        text,
  /** 'stripe' eller 'manual' */
  source      text NOT NULL,
  /** Slutdatum som gällde vid händelsen */
  period_end  timestamptz,
  /** Superadmins motivering vid granted/revoked */
  reason      text,
  /** Vem som utförde händelsen. NULL för automatiska Stripe-händelser. */
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_events_user_idx
  ON public.subscription_events(user_id, created_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Anonyma sessioner ska aldrig nå tabellen. RESTRICTIVE så den ANDas med
-- övriga policyer — en permissiv FOR ALL hade öppnat hela tabellen.
DROP POLICY IF EXISTS "block_anonymous_users" ON public.subscription_events;
CREATE POLICY "block_anonymous_users"
  ON public.subscription_events
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- Endast superadmin läser. Loggen innehåller motiveringar som inte är
-- avsedda för användaren själv.
DROP POLICY IF EXISTS "super_admin_reads_events" ON public.subscription_events;
CREATE POLICY "super_admin_reads_events"
  ON public.subscription_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = (SELECT auth.uid()) AND is_super_admin
  ));

-- Ingen INSERT/UPDATE/DELETE-policy: skrivning sker bara via
-- SECURITY DEFINER-funktioner och webhooken (service role).

COMMENT ON TABLE public.subscription_events IS
  'Append-only historik för prenumerationer. user_subscriptions bär nuläget; '
  'den här tabellen bär vägen dit.';
