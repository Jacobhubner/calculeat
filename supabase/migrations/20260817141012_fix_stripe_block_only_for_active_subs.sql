-- Stripe-spärren blockerade även AVSLUTADE prenumerationer.
--
-- Kontrollen var `source = 'stripe'` rakt av, men raden ligger kvar efter
-- att en kund sagt upp sig: status blir 'canceled' och current_period_end
-- passerar. Superadmin kunde då inte ge premium till någon som slutat
-- betala — alltså precis den grupp man mest sannolikt vill ge en
-- gratisperiod.
--
-- Verkligt fall 2026-08-17: båda Stripe-raderna i produktion har
-- status='canceled' med utgångna datum, men panelen visade "Betalande kund"
-- och vägrade.
--
-- Spärren gäller nu bara prenumerationer som FAKTISKT är i kraft. Samma
-- villkor som get_user_plan använder för att avgöra om planen räknas.
CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  p_user_id    uuid,
  p_plan       text,
  p_note       text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_super_admin
  ) THEN
    RAISE EXCEPTION 'admin_set_user_plan: super admin required';
  END IF;

  IF p_plan NOT IN ('default', 'free', 'premium', 'founder') THEN
    RAISE EXCEPTION 'admin_set_user_plan: invalid plan %', p_plan;
  END IF;

  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'admin_set_user_plan: expiry must be in the future';
  END IF;

  IF p_plan = 'default' THEN
    DELETE FROM public.user_subscriptions
    WHERE user_id = p_user_id AND source = 'manual';
    RETURN;
  END IF;

  -- Blockera bara när Stripe-prenumerationen är i kraft. En uppsagd eller
  -- utgången rad ska inte hindra en gratisperiod.
  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND source = 'stripe'
      AND status IN ('active', 'trialing', 'past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  ) THEN
    RAISE EXCEPTION
      'admin_set_user_plan: user has an active Stripe subscription — manage it in Stripe';
  END IF;

  -- Uppsagd Stripe-rad får ersättas av en manuell. Raden byter ägare till
  -- 'manual', vilket är korrekt: prenumerationen är avslutad och en
  -- framtida webhook-händelse för den kommer inte.
  INSERT INTO public.user_subscriptions (
    user_id, plan, status, source, note, current_period_end,
    stripe_customer_id, stripe_subscription_id, cancel_at_period_end
  )
  VALUES (p_user_id, p_plan, 'active', 'manual', p_note, p_expires_at,
          NULL, NULL, false)
  ON CONFLICT (user_id) DO UPDATE
    SET plan                   = EXCLUDED.plan,
        status                 = 'active',
        source                 = 'manual',
        note                   = COALESCE(EXCLUDED.note, user_subscriptions.note),
        current_period_end     = EXCLUDED.current_period_end,
        -- Släpp kopplingen till den avslutade prenumerationen så raden inte
        -- ser ut att fortfarande ägas av Stripe.
        stripe_subscription_id = NULL,
        cancel_at_period_end   = false,
        updated_at             = now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) TO authenticated;
