-- BUGG: 'user_id' är både OUT-parameter i RETURNS TABLE och kolumn i
-- public.admins, så behörighetskontrollen blev tvetydig och funktionen
-- kastade 42702 vid varje anrop.
--
-- Kvalificera kolumnen med tabellalias. Samma fälla finns i alla
-- RETURNS TABLE-funktioner vars OUT-namn krockar med en kolumn de frågar mot.
CREATE OR REPLACE FUNCTION public.admin_search_users(
  p_query text DEFAULT '',
  p_limit integer DEFAULT 25
)
RETURNS TABLE (
  user_id            uuid,
  username           text,
  email              text,
  created_at         timestamptz,
  effective_plan     text,
  plan               text,
  status             text,
  source             text,
  current_period_end timestamptz,
  note               text,
  is_stripe          boolean,
  has_paid_before    boolean,
  had_trial          boolean,
  was_granted        boolean,
  is_admin           boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() AND a.is_super_admin
  ) THEN
    RAISE EXCEPTION 'admin_search_users: super admin required';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.username,
    up.email,
    up.created_at,
    public.get_user_plan(up.id),
    s.plan,
    s.status,
    s.source,
    s.current_period_end,
    s.note,
    coalesce(
      s.source = 'stripe'
        AND s.status IN ('active', 'trialing', 'past_due')
        AND (s.current_period_end IS NULL OR s.current_period_end > now()),
      false
    ),
    EXISTS (SELECT 1 FROM public.subscription_events e
            WHERE e.user_id = up.id
              AND e.event_type IN ('payment_started', 'payment_renewed')),
    EXISTS (SELECT 1 FROM public.subscription_events e
            WHERE e.user_id = up.id AND e.event_type = 'trial_started'),
    EXISTS (SELECT 1 FROM public.subscription_events e
            WHERE e.user_id = up.id AND e.event_type = 'granted'),
    EXISTS (SELECT 1 FROM public.admins a2 WHERE a2.user_id = up.id)
  FROM public.user_profiles up
  LEFT JOIN public.user_subscriptions s ON s.user_id = up.id
  WHERE
    p_query = ''
    OR up.username ILIKE '%' || p_query || '%'
    OR up.email    ILIKE '%' || p_query || '%'
  ORDER BY
    (s.user_id IS NOT NULL) DESC,
    up.created_at DESC
  LIMIT greatest(1, least(p_limit, 100));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_users(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO public;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO authenticated;

-- Samma fälla i historikfunktionen
CREATE OR REPLACE FUNCTION public.admin_get_subscription_events(p_user_id uuid)
RETURNS TABLE (
  event_type     text,
  plan           text,
  source         text,
  period_end     timestamptz,
  reason         text,
  actor_username text,
  created_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() AND a.is_super_admin
  ) THEN
    RAISE EXCEPTION 'admin_get_subscription_events: super admin required';
  END IF;

  RETURN QUERY
  SELECT e.event_type, e.plan, e.source, e.period_end, e.reason,
         actor.username, e.created_at
  FROM public.subscription_events e
  LEFT JOIN public.user_profiles actor ON actor.id = e.actor_id
  WHERE e.user_id = p_user_id
  ORDER BY e.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_subscription_events(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_subscription_events(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.admin_get_subscription_events(uuid) TO authenticated;
