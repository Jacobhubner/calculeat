-- Consent audit trail (GDPR art. 7.1 — bevisbörda för samtycke)
--
-- Designprincip: loggningen sker i handle_new_user-triggern så att samtycket
-- blir atomärt med kontoskapandet. Klienten får ALDRIG skriva här — en logg
-- som subjektet själv kan manipulera har inget bevisvärde.

-- 1. Samtyckestidsstämplar på profilen -------------------------------------

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_data_consent_at TIMESTAMPTZ DEFAULT NULL;

-- Befintliga användare: markera villkor/policy som accepterade vid registrering.
-- health_data_consent_at lämnas medvetet NULL — det samtycket ska lämnas
-- aktivt i onboardingen, inte antas retroaktivt.
UPDATE public.user_profiles
SET terms_accepted_at   = COALESCE(terms_accepted_at, created_at),
    privacy_accepted_at = COALESCE(privacy_accepted_at, created_at)
WHERE terms_accepted_at IS NULL OR privacy_accepted_at IS NULL;

-- 2. Audit-tabell ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'health_data')),
  accepted BOOLEAN NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'signup',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_log_user_id
  ON public.consent_audit_log(user_id);

ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Användaren får LÄSA sin egen logg (art. 15) men aldrig skriva i den.
DROP POLICY IF EXISTS "Users can view own consent audit" ON public.consent_audit_log;
CREATE POLICY "Users can view own consent audit" ON public.consent_audit_log
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Ingen klientroll får skriva. Endast SECURITY DEFINER-funktioner skriver.
DROP POLICY IF EXISTS "Service role can insert consent audit" ON public.consent_audit_log;
DROP POLICY IF EXISTS "No client inserts to consent audit" ON public.consent_audit_log;
CREATE POLICY "No client inserts to consent audit" ON public.consent_audit_log
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

REVOKE INSERT, UPDATE, DELETE ON public.consent_audit_log FROM authenticated, anon;
GRANT SELECT ON public.consent_audit_log TO authenticated;

COMMENT ON TABLE public.consent_audit_log IS
  'GDPR art. 7.1 bevisbörda. Skrivs endast av SECURITY DEFINER-funktioner (handle_new_user, log_health_data_consent). Klienten har ingen INSERT-behörighet.';

-- 3. Loggning av villkor/policy i handle_new_user --------------------------
-- Utökar den befintliga triggern. Allt annat i funktionen är oförändrat.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_profile_id     uuid;
  v_profile_name   text;
  v_username_base  text;
  v_username       text;
  v_accept_terms   boolean;
  v_accept_privacy boolean;
  v_user_agent     text;
  v_now            timestamptz := now();
BEGIN
  -- Anonyma gästsessioner (supportchatt) får ingen app-profil.
  -- Deras identitet (namn/e-post) lagras på support_threads istället.
  IF NEW.is_anonymous THEN
    RETURN NEW;
  END IF;

  v_profile_name  := COALESCE(NEW.raw_user_meta_data->>'profile_name', 'Användare');
  v_username_base := public.normalize_username(v_profile_name);

  IF length(v_username_base) < 2 THEN
    v_username_base := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  IF v_username_base = ANY(ARRAY['admin','support','calculeat','help','api',
                                  'system','null','undefined','root','mod','moderator']) THEN
    v_username_base := v_username_base || '_user';
  END IF;

  v_username := public.find_available_username(v_username_base);

  -- Samtycken från registreringsformuläret
  v_accept_terms   := COALESCE((NEW.raw_user_meta_data->>'accept_terms')::boolean, false);
  v_accept_privacy := COALESCE((NEW.raw_user_meta_data->>'accept_privacy')::boolean, false);
  v_user_agent     := NEW.raw_user_meta_data->>'user_agent';

  INSERT INTO public.user_profiles (id, email, profile_name, username,
                                    terms_accepted_at, privacy_accepted_at)
  VALUES (NEW.id, NEW.email, v_profile_name, v_username,
          CASE WHEN v_accept_terms   THEN v_now END,
          CASE WHEN v_accept_privacy THEN v_now END);

  INSERT INTO public.profiles (user_id, profile_name, is_active)
  VALUES (NEW.id, v_profile_name, true)
  RETURNING id INTO v_profile_id;

  UPDATE public.user_profiles
  SET active_profile_id = v_profile_id
  WHERE id = NEW.id;

  -- Sätt display_name i auth metadata så adminpanelen visar username
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('display_name', v_username)
  WHERE id = NEW.id;

  -- Audit trail — atomärt med kontoskapandet (art. 7.1)
  IF v_accept_terms THEN
    INSERT INTO public.consent_audit_log (user_id, consent_type, accepted, accepted_at, source, user_agent)
    VALUES (NEW.id, 'terms', true, v_now, 'signup', v_user_agent);
  END IF;

  IF v_accept_privacy THEN
    INSERT INTO public.consent_audit_log (user_id, consent_type, accepted, accepted_at, source, user_agent)
    VALUES (NEW.id, 'privacy', true, v_now, 'signup', v_user_agent);
  END IF;

  RETURN NEW;

EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RAISE;
END;
$function$;

-- 4. Hälsodatasamtycke (art. 9.2 a) ----------------------------------------
-- Lämnas aktivt i onboardingen när hälsodata faktiskt efterfrågas, inte som
-- villkor för att skapa konto (art. 7.4). Kan återkallas.

CREATE OR REPLACE FUNCTION public.log_health_data_consent(
  p_accepted   boolean,
  p_user_agent text DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_now     timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_profiles
  SET health_data_consent_at = CASE WHEN p_accepted THEN v_now ELSE NULL END
  WHERE id = v_user_id;

  INSERT INTO public.consent_audit_log (user_id, consent_type, accepted, accepted_at, source, user_agent)
  VALUES (v_user_id, 'health_data', p_accepted, v_now, 'onboarding', p_user_agent);
END;
$function$;

REVOKE ALL ON FUNCTION public.log_health_data_consent(boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_health_data_consent(boolean, text) TO authenticated;
