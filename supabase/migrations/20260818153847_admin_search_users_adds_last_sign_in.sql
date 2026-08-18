-- Lägger till senaste inloggning i användarsökningen.
--
-- VARFÖR: när listan växer behöver man kunna se vem som faktiskt använder
-- appen. Registreringsdatum säger inget om det — ett konto från i somras kan
-- vara aktivt dagligen eller övergivet efter första dagen.
--
-- SORTERING: tidigare låg de med prenumerationsrad först, sedan nyast
-- registrerade. Nu sorteras allt på senaste inloggning, senast först. Den som
-- nyss varit inne är den man rimligen letar efter; ett konto som inte loggat
-- in på månader hamnar längst ned. Aldrig inloggade sist (NULLS LAST).
--
-- last_sign_in_at ligger i auth.users. Funktionen är SECURITY DEFINER och
-- superadmin-spärrad, så uppslaget är säkert — men kolumnen får aldrig
-- exponeras via någon RPC som vanliga användare når.
--
-- DROP krävs eftersom returtypen får en kolumn till. DROP tar bort GRANTs,
-- så de sätts om nedan — PostgREST ansluter som 'authenticator' och behöver
-- PUBLIC-granten.
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
  /** Senaste inloggning — NULL om användaren aldrig loggat in */
  last_sign_in_at    timestamptz,
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
    au.last_sign_in_at,
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
  -- Senast aktiv först — den man letar efter har oftast nyss varit inne.
  ORDER BY au.last_sign_in_at DESC NULLS LAST
  LIMIT greatest(1, least(p_limit, 100));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_users(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO public;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO authenticated;
