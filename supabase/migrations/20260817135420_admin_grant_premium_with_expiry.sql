-- Superadmin kan ge premium med ett slutdatum.
--
-- get_user_plan respekterade redan current_period_end (planen gäller tills
-- den passerats, null = tills vidare), men admin_set_user_plan kunde inte
-- sätta fältet — så manuell premium blev alltid obegränsad.
--
-- Rör aldrig Stripe-rader. De ägs av webhooken, som skriver source='stripe'
-- med onConflict på user_id. Att blanda vägarna skulle göra ägarskapet
-- oklart: nästa webhook-händelse skriver över det vi satt här.

DROP FUNCTION IF EXISTS public.admin_set_user_plan(uuid, text, text);

CREATE FUNCTION public.admin_set_user_plan(
  p_user_id    uuid,
  p_plan       text,
  p_note       text DEFAULT NULL,
  -- NULL = tills vidare (befintligt beteende). Ett datum = planen upphör då,
  -- och get_user_plan faller tillbaka till free utan att något städjobb behövs.
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

  -- Ett slutdatum i det förflutna vore en plan som aldrig gäller. Troligen
  -- ett misstag, så vi avvisar hellre än att tyst skapa något verkningslöst.
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'admin_set_user_plan: expiry must be in the future';
  END IF;

  -- 'default' = ta bort manuell rad (användaren följer enforcement-läget).
  IF p_plan = 'default' THEN
    DELETE FROM public.user_subscriptions
    WHERE user_id = p_user_id AND source = 'manual';
    RETURN;
  END IF;

  -- Skriv aldrig över en Stripe-rad. Utan den här kontrollen skulle en
  -- betalande kund kunna få sin prenumeration ersatt av en manuell rad.
  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id AND source = 'stripe'
  ) THEN
    RAISE EXCEPTION
      'admin_set_user_plan: user has a Stripe subscription — manage it in Stripe';
  END IF;

  INSERT INTO public.user_subscriptions (
    user_id, plan, status, source, note, current_period_end
  )
  VALUES (p_user_id, p_plan, 'active', 'manual', p_note, p_expires_at)
  ON CONFLICT (user_id) DO UPDATE
    SET plan               = EXCLUDED.plan,
        status             = 'active',
        note               = COALESCE(EXCLUDED.note, user_subscriptions.note),
        current_period_end = EXCLUDED.current_period_end,
        updated_at         = now()
    WHERE user_subscriptions.source = 'manual';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, text, text, timestamptz) TO authenticated;
