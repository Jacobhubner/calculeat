-- admin_set_user_plan skriver nu till händelseloggen.
--
-- Motiveringen (p_note) sparas både på raden och i loggen: raden visar
-- varför den NUVARANDE planen finns, loggen bevarar varje tidigare skäl
-- även efter att planen ändrats.
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
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = v_actor AND is_super_admin
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

    INSERT INTO public.subscription_events (
      user_id, event_type, plan, source, reason, actor_id
    )
    VALUES (p_user_id, 'revoked', NULL, 'manual', p_note, v_actor);
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
        stripe_subscription_id = NULL,
        cancel_at_period_end   = false,
        updated_at             = now();

  INSERT INTO public.subscription_events (
    user_id, event_type, plan, source, period_end, reason, actor_id
  )
  VALUES (p_user_id, 'granted', p_plan, 'manual', p_expires_at, p_note, v_actor);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) TO authenticated;
