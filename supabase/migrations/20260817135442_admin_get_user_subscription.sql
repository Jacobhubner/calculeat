-- Låter superadmin se en användares prenumerationsstatus.
--
-- Behövs för att adminvyn ska kunna visa "har premium till 2026-11-17"
-- i stället för att bara erbjuda knappar utan att veta nuläget — och för
-- att kunna varna innan man rör en Stripe-kund.
CREATE OR REPLACE FUNCTION public.admin_get_user_subscription(p_user_id uuid)
RETURNS TABLE (
  plan               text,
  status             text,
  source             text,
  current_period_end timestamptz,
  note               text,
  /** Sant när planen ägs av Stripe — då ska den hanteras där, inte här. */
  is_stripe          boolean,
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
    s.source = 'stripe',
    public.get_user_plan(p_user_id)
  FROM public.user_subscriptions s
  WHERE s.user_id = p_user_id;

  -- Ingen rad: returnera ändå den effektiva planen, så vyn kan visa
  -- "följer standardläget" i stället för tomt.
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      NULL::text, NULL::text, NULL::text, NULL::timestamptz, NULL::text,
      false, public.get_user_plan(p_user_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_subscription(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_subscription(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.admin_get_user_subscription(uuid) TO authenticated;
