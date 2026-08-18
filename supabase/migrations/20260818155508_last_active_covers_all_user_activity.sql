-- Utökar "senast aktiv" till att täcka all användaraktivitet.
--
-- Föregående version läste bara inloggning + loggad mat + vägning. Någon som
-- bygger sitt livsmedelsbibliotek eller skapar recept innan de börjar logga
-- syntes då som inaktiv. Ingen har det mönstret idag, men det är fullt
-- rimligt — och poängen med fältet är att det ska gå att lita på.
--
-- Definitionen ligger nu i EN funktion i stället för att upprepas i SELECT
-- och ORDER BY. Ska fler signaler läggas till (t.ex. sparade måltider)
-- ändras bara den här.
--
-- Alla uppslag går på user_id-index: idx_daily_logs_user_id,
-- idx_weight_history_user, idx_recipes_user_id, idx_food_items_user_id.
--
-- STABLE + SECURITY DEFINER: läser bara, och behöver nå auth.users. Anropas
-- enbart från admin_search_users, som är superadmin-spärrad.
CREATE OR REPLACE FUNCTION public.user_last_active_at(p_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    (SELECT au.last_sign_in_at FROM auth.users au WHERE au.id = p_user_id),
    (SELECT max(dl.log_date)::timestamptz
       FROM public.daily_logs dl WHERE dl.user_id = p_user_id),
    (SELECT max(wh.recorded_at)
       FROM public.weight_history wh WHERE wh.user_id = p_user_id),
    (SELECT max(r.created_at)
       FROM public.recipes r WHERE r.user_id = p_user_id),
    (SELECT max(f.created_at)
       FROM public.food_items f WHERE f.user_id = p_user_id)
  );
$$;

COMMENT ON FUNCTION public.user_last_active_at IS
  'Senast kända aktivitet: inloggning eller faktisk användning av appen. '
  'last_sign_in_at ensam duger inte — den uppdateras bara vid NY inloggning, '
  'och sessioner hålls vid liv genom token-förnyelse.';

REVOKE ALL ON FUNCTION public.user_last_active_at(uuid) FROM public;
REVOKE ALL ON FUNCTION public.user_last_active_at(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.user_last_active_at(uuid) FROM authenticated;

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
  /** Senast kända aktivitet — se user_last_active_at */
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
    public.user_last_active_at(up.id),
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
  ORDER BY public.user_last_active_at(up.id) DESC NULLS LAST
  LIMIT greatest(1, least(p_limit, 100));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_users(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO public;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO authenticated;
