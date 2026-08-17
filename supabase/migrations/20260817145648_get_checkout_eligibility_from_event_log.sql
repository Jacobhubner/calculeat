-- Beslutsunderlaget för checkout, härlett ur BÅDA källorna.
--
-- Tidigare låg logiken i edge-funktionen och läste bara user_subscriptions.
-- Den raden skrivs över och kan raderas; loggen är append-only. Att OR:a dem
-- gör spärren robust: en förbrukad provperiod kan inte återuppstå genom att
-- en rad försvinner.
--
-- SECURITY DEFINER: anropas av edge-funktionen med service role, men
-- behörighetskontrollen ligger ändå i kroppen (bara egen användare) så
-- funktionen är säker även om den skulle exponeras.
CREATE OR REPLACE FUNCTION public.get_checkout_eligibility(p_user_id uuid)
RETURNS TABLE (
  /** Provperiod förbrukad — trial_period_days ska INTE sättas */
  has_used_trial     boolean,
  /** Prenumeration i kraft just nu — teckning ska blockeras */
  has_active_sub     boolean,
  /** Befintlig Stripe-kund att återanvända, om någon är känd */
  stripe_customer_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Antingen bär den nuvarande raden spår av Stripe, eller så gör loggen det.
    COALESCE(
      (SELECT true FROM public.user_subscriptions s
       WHERE s.user_id = p_user_id AND s.source = 'stripe' LIMIT 1),
      false
    )
    OR COALESCE(
      (SELECT true FROM public.subscription_events e
       WHERE e.user_id = p_user_id
         AND e.source = 'stripe'
         AND e.event_type IN ('trial_started', 'payment_started', 'payment_renewed')
       LIMIT 1),
      false
    ),

    -- Aktiv prenumeration läses bara ur nuläget: loggen säger vad som HÄNT,
    -- inte vad som gäller nu. En uppsagd rad ska inte blockera omteckning.
    COALESCE(
      (SELECT s.status IN ('active', 'trialing')
       FROM public.user_subscriptions s
       WHERE s.user_id = p_user_id AND s.source = 'stripe' LIMIT 1),
      false
    ),

    -- Kunden: nuvarande rad först, annars senast kända ur loggen.
    COALESCE(
      (SELECT s.stripe_customer_id FROM public.user_subscriptions s
       WHERE s.user_id = p_user_id AND s.stripe_customer_id IS NOT NULL LIMIT 1),
      (SELECT e.stripe_customer_id FROM public.subscription_events e
       WHERE e.user_id = p_user_id AND e.stripe_customer_id IS NOT NULL
       ORDER BY e.created_at DESC LIMIT 1)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_checkout_eligibility(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_checkout_eligibility(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_checkout_eligibility(uuid) FROM authenticated;
-- Endast service role (edge-funktionen). Inget klientanrop behövs.
GRANT EXECUTE ON FUNCTION public.get_checkout_eligibility(uuid) TO service_role;
