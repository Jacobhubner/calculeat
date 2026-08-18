-- Senaste aktivitet i användarsökningen — och varför inloggning inte duger.
--
-- last_sign_in_at uppdateras bara vid en NY inloggning. En session som hålls
-- vid liv genom token-förnyelse rör den aldrig, och appen loggar inte ut
-- folk. Någon som använder appen dagligen kan därför ha ett värde som är
-- flera månader gammalt.
--
-- BEVIS: sarge hade last_sign_in_at = 2026-04-21 men loggade mat 2026-08-03.
-- Panelen visade "3 månader sedan" om någon som varit aktiv i förra veckan.
-- Fyra av 28 användare hade föråldrat värde, störst avvikelse 104 dagar.
--
-- Löser det genom att ta det SENASTE av inloggning och faktisk aktivitet i
-- appen (loggad mat, registrerad vikt). Det svarar på frågan man faktiskt
-- ställer: "när använde den här personen appen sist?"
--
-- Båda uppslagen går på user_id-index (idx_daily_logs_user_id,
-- idx_weight_history_user).
--
-- SORTERING: senast aktiv först. Den man letar efter har oftast nyss varit
-- inne; konton utan aktivitet hamnar sist (NULLS LAST).
--
-- DROP krävs eftersom returtypen ändras. DROP tar bort GRANTs, så de sätts om
-- nedan — PostgREST ansluter som 'authenticator' och behöver PUBLIC-granten.
DROP FUNCTION IF EXISTS public.admin_search_users(text, integer);

CREATE FUNCTION public.admin_search_users(
  p_query text DEFAULT '',
  p_limit integer DEFAULT 25
)
RETURNS TABLE (
  user_id            uuid,
  username           text,
  email              text,
  created_at         timestamptz,
  /**
   * Senaste kända aktivitet: inloggning ELLER faktisk användning av appen,
   * vilket som är senast. Se kommentaren ovan om varför inloggning ensam
   * inte duger. NULL = ingen aktivitet alls registrerad.
   */
  last_active_at     timestamptz,
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
    GREATEST(
      au.last_sign_in_at,
      (SELECT max(dl.log_date)::timestamptz
         FROM public.daily_logs dl WHERE dl.user_id = up.id),
      (SELECT max(wh.recorded_at)
         FROM public.weight_history wh WHERE wh.user_id = up.id)
    ),
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
  LEFT JOIN auth.users au ON au.id = up.id
  WHERE
    p_query = ''
    OR up.username ILIKE '%' || p_query || '%'
    OR up.email    ILIKE '%' || p_query || '%'
  ORDER BY GREATEST(
      au.last_sign_in_at,
      (SELECT max(dl.log_date)::timestamptz
         FROM public.daily_logs dl WHERE dl.user_id = up.id),
      (SELECT max(wh.recorded_at)
         FROM public.weight_history wh WHERE wh.user_id = up.id)
    ) DESC NULLS LAST
  LIMIT greatest(1, least(p_limit, 100));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_users(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO public;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO authenticated;
