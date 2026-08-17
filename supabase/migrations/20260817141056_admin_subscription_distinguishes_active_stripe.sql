-- is_stripe var sant även för uppsagda prenumerationer, så panelen visade
-- "Betalande kund" för någon som slutat betala. Fältet betyder nu "ägs av
-- en Stripe-prenumeration som ÄR I KRAFT", och had_stripe skiljer ut fallet
-- där kunden funnits men slutat.
--
-- Ny kolumn i returtypen kräver DROP + CREATE; grants sätts om nedan
-- eftersom DROP tar dem med sig.
DROP FUNCTION IF EXISTS public.admin_get_user_subscription(uuid);

CREATE FUNCTION public.admin_get_user_subscription(p_user_id uuid)
RETURNS TABLE (
  plan               text,
  status             text,
  source             text,
  current_period_end timestamptz,
  note               text,
  /** Sant bara när en AKTIV Stripe-prenumeration finns — då hanteras den där. */
  is_stripe          boolean,
  /** Sant när en Stripe-rad finns men har löpt ut eller sagts upp. */
  had_stripe         boolean,
  /** Den effektiva planen just nu, inklusive admin- och enforcement-regler. */
  effective_plan     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_super_admin
  ) THEN
    RAISE EXCEPTION 'admin_get_user_subscription: super admin required';
  END IF;

  RETURN QUERY
  SELECT
    s.plan,
    s.status,
    s.source,
    s.current_period_end,
    s.note,
    -- Samma villkor som spärren i admin_set_user_plan
    s.source = 'stripe'
      AND s.status IN ('active', 'trialing', 'past_due')
      AND (s.current_period_end IS NULL OR s.current_period_end > now()),
    s.source = 'stripe'
      AND NOT (
        s.status IN ('active', 'trialing', 'past_due')
        AND (s.current_period_end IS NULL OR s.current_period_end > now())
      ),
    public.get_user_plan(p_user_id)
  FROM public.user_subscriptions s
  WHERE s.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      NULL::text, NULL::text, NULL::text, NULL::timestamptz, NULL::text,
      false, false, public.get_user_plan(p_user_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_subscription(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_subscription(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.admin_get_user_subscription(uuid) TO authenticated;
