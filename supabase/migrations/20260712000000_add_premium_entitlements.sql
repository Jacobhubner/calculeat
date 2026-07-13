-- =========================================================
-- Premium-entitlements — Fas 1 av premiumstrukturen
-- Se docs/PREMIUM_SPEC.md för beslutad matris och regler.
--
-- Viktigt: app_config.premium_enforcement = 'off' vid deploy
-- → ALLA användare behandlas som 'founder' och inga kvoter
-- biter förrän flaggan flippas till 'on' vid hard launch.
-- =========================================================

-- =========================================================
-- STEG 1: app_config — global konfiguration (key/value)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.app_config (
  key        text        PRIMARY KEY,
  value      text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Läsbar för inloggade (klienten behöver enforcement-läget);
-- skrivs endast via service role / super admin-RPC.
CREATE POLICY "Authenticated can read app config"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.app_config (key, value)
VALUES ('premium_enforcement', 'off')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.app_config IS
  'Global app-konfiguration. premium_enforcement: off = alla behandlas som founder (soft launch), on = free-gränser gäller (hard launch).';

-- =========================================================
-- STEG 2: user_subscriptions — en rad per användare
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   text        NOT NULL CHECK (plan IN ('free', 'premium', 'founder')),
  status                 text        NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  current_period_end     timestamptz,          -- null = tills vidare (founder/manual)
  source                 text        NOT NULL DEFAULT 'manual'
                                     CHECK (source IN ('manual', 'stripe')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  note                   text,                 -- t.ex. "soft launch-testare"
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Användaren får läsa sin egen rad. Inga INSERT/UPDATE/DELETE-policies:
-- skrivning sker endast via service role (Stripe-webhook, Fas 4) och
-- admin_set_user_plan (SECURITY DEFINER, nedan).
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.user_subscriptions IS
  'Prenumerationsstatus per användare. Ingen rad = plan följer premium_enforcement-läget. Skrivs ALDRIG av klienten.';

-- =========================================================
-- STEG 3: get_user_plan — plan-upplösning
-- Prioritet: admin → giltig prenumerationsrad → enforcement-läge.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_sub    record;
BEGIN
  -- Får anropas för sig själv, av service role (auth.uid() null, t.ex.
  -- triggers under SECURITY DEFINER-RPCs eller seeds), eller av admin.
  IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'get_user_plan: not allowed for other users';
  END IF;

  IF p_user_id IS NULL THEN
    RETURN 'free';
  END IF;

  -- Admins och super admins är alltid founder
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = p_user_id) THEN
    RETURN 'founder';
  END IF;

  SELECT plan, status, current_period_end INTO v_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  IF FOUND
     AND v_sub.status IN ('active', 'trialing')
     AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now())
  THEN
    RETURN v_sub.plan;
  END IF;

  -- Ingen giltig prenumeration: soft launch = founder, hard launch = free
  IF (SELECT value FROM public.app_config WHERE key = 'premium_enforcement') = 'on' THEN
    RETURN 'free';
  END IF;

  RETURN 'founder';
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_plan(uuid) FROM anon;

-- =========================================================
-- STEG 4: get_plan_limits — ENDA källan för gränserna i DB
-- Spegel: src/lib/constants/entitlements.ts. -1 = obegränsat.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_plan_limits(p_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_plan IN ('premium', 'founder') THEN jsonb_build_object(
      'saved_meals', -1,
      'recipes', -1,
      'recipe_images', true,
      'history_days', -1,
      'csv_export', true,
      'advanced_trends', true,
      'period_stats', true,
      'all_tdee_formulas', true,
      'calibrations_per_quarter', -1,
      'advanced_body_comp', true,
      'genetic_potential', true,
      'owned_shared_lists', -1,
      'label_scans_per_month', -1
    )
    ELSE jsonb_build_object(
      'saved_meals', 10,
      'recipes', 3,
      'recipe_images', false,
      'history_days', 30,
      'csv_export', false,
      'advanced_trends', false,
      'period_stats', false,
      'all_tdee_formulas', false,
      'calibrations_per_quarter', 1,
      'advanced_body_comp', false,
      'genetic_potential', false,
      'owned_shared_lists', 1,
      'label_scans_per_month', 5
    )
  END;
$$;

-- =========================================================
-- STEG 5: get_my_entitlements — klientens enda RPC
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'get_my_entitlements: not authenticated';
  END IF;

  v_plan := public.get_user_plan(auth.uid());

  RETURN jsonb_build_object(
    'plan', v_plan,
    'limits', public.get_plan_limits(v_plan),
    'enforcement', COALESCE(
      (SELECT value FROM public.app_config WHERE key = 'premium_enforcement'), 'off')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_entitlements() FROM anon;

-- =========================================================
-- STEG 6: Kvot-triggers (BEFORE INSERT)
-- Kastar 'PREMIUM_LIMIT_REACHED:<nyckel>' (P0001) — klienten
-- mappar prefixet till UpgradeModal. No-op för premium/founder.
-- =========================================================

-- 6a: Sparade måltider
CREATE OR REPLACE FUNCTION public.enforce_saved_meals_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
BEGIN
  v_limit := (public.get_plan_limits(public.get_user_plan(NEW.user_id)) ->> 'saved_meals')::int;
  IF v_limit >= 0 AND (
    SELECT count(*) FROM public.saved_meals WHERE user_id = NEW.user_id
  ) >= v_limit THEN
    RAISE EXCEPTION 'PREMIUM_LIMIT_REACHED:saved_meals' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_saved_meals_quota ON public.saved_meals;
CREATE TRIGGER trg_enforce_saved_meals_quota
  BEFORE INSERT ON public.saved_meals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_saved_meals_quota();

-- 6b: Recept — endast personliga (list-recept är listans, inte användarens kvot)
CREATE OR REPLACE FUNCTION public.enforce_recipes_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
BEGIN
  IF NEW.shared_list_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  v_limit := (public.get_plan_limits(public.get_user_plan(NEW.user_id)) ->> 'recipes')::int;
  IF v_limit >= 0 AND (
    SELECT count(*) FROM public.recipes
    WHERE user_id = NEW.user_id AND shared_list_id IS NULL
  ) >= v_limit THEN
    RAISE EXCEPTION 'PREMIUM_LIMIT_REACHED:recipes' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_recipes_quota ON public.recipes;
CREATE TRIGGER trg_enforce_recipes_quota
  BEFORE INSERT ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_recipes_quota();

-- 6c: Gemensamma listor — kvot på att SKAPA (medlemskap är alltid fritt).
-- Räknar listor användaren skapat och fortfarande är medlem i, så att
-- lämnade/raderade listor frigör platsen. (Flat ownership — created_by
-- är historik, se 20260301000000.)
CREATE OR REPLACE FUNCTION public.enforce_shared_lists_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
BEGIN
  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;
  v_limit := (public.get_plan_limits(public.get_user_plan(NEW.created_by)) ->> 'owned_shared_lists')::int;
  IF v_limit >= 0 AND (
    SELECT count(*)
    FROM public.shared_lists sl
    JOIN public.shared_list_members slm
      ON slm.shared_list_id = sl.id AND slm.user_id = NEW.created_by
    WHERE sl.created_by = NEW.created_by
  ) >= v_limit THEN
    RAISE EXCEPTION 'PREMIUM_LIMIT_REACHED:owned_shared_lists' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_shared_lists_quota ON public.shared_lists;
CREATE TRIGGER trg_enforce_shared_lists_quota
  BEFORE INSERT ON public.shared_lists
  FOR EACH ROW EXECUTE FUNCTION public.enforce_shared_lists_quota();

-- =========================================================
-- STEG 7: admin_set_user_plan — manuell plan-tilldelning
-- Endast super admins. Används för founder-status och support.
-- =========================================================

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  p_user_id uuid,
  p_plan    text,
  p_note    text DEFAULT NULL
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

  IF p_plan NOT IN ('free', 'premium', 'founder') THEN
    RAISE EXCEPTION 'admin_set_user_plan: invalid plan %', p_plan;
  END IF;

  -- 'free' = ta bort manuell rad (användaren följer enforcement-läget igen).
  -- Rör aldrig Stripe-rader — de ägs av webhooken (Fas 4).
  IF p_plan = 'free' THEN
    DELETE FROM public.user_subscriptions
    WHERE user_id = p_user_id AND source = 'manual';
    RETURN;
  END IF;

  INSERT INTO public.user_subscriptions (user_id, plan, status, source, note)
  VALUES (p_user_id, p_plan, 'active', 'manual', p_note)
  ON CONFLICT (user_id) DO UPDATE
    SET plan = EXCLUDED.plan,
        status = 'active',
        note = COALESCE(EXCLUDED.note, user_subscriptions.note)
    WHERE user_subscriptions.source = 'manual';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, text, text) FROM anon;
