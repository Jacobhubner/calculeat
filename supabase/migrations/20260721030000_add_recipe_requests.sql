-- =========================================================
-- MIGRATION: Önska recept — recipe_requests
-- Date: 2026-07-21
-- Användare kan önska recept från Upptäck-fliken. Önskemålen läses av
-- admins och styr vilka receptbatchar som seedas härnäst (Fas 2 av
-- receptbanken). Enkel rate limit: max 5 önskemål/användare/dygn.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.recipe_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_text text NOT NULL CHECK (char_length(trim(request_text)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_requests_user ON public.recipe_requests(user_id, created_at);

ALTER TABLE public.recipe_requests ENABLE ROW LEVEL SECURITY;

-- KRITISK REGEL: ny tabell ⇒ block_anonymous_users-policy
CREATE POLICY "block_anonymous_users" ON public.recipe_requests
  AS RESTRICTIVE FOR ALL
  USING ((SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)) IS FALSE);

CREATE POLICY "Users can insert own recipe requests" ON public.recipe_requests
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users and admins can view recipe requests" ON public.recipe_requests
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = (SELECT auth.uid()))
  );

-- Rate limit: max 5 önskemål per användare per rullande dygn
CREATE OR REPLACE FUNCTION public.enforce_recipe_request_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.recipe_requests
    WHERE user_id = NEW.user_id AND created_at > now() - interval '24 hours'
  ) >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT:recipe_requests' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recipe_request_rate_limit ON public.recipe_requests;
CREATE TRIGGER trg_recipe_request_rate_limit
  BEFORE INSERT ON public.recipe_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_recipe_request_rate_limit();
