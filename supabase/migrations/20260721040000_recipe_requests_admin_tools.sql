-- =========================================================
-- MIGRATION: Receptönskemål — adminverktyg
-- Date: 2026-07-21
-- 1. RPC get_recipe_requests: admins får önskemålen MED avsändarens
--    användarnamn (user_profiles kan inte embeddas via PostgREST då FK
--    pekar på auth.users; SECURITY DEFINER-join löser det).
-- 2. DELETE-policy för admins: klarmarkera = radera. Delad state — när
--    en admin raderar försvinner önskemålet för alla admins (kravet
--    "klarmarkerar jag ska andra admins inte se aktiviteten").
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_recipe_requests()
RETURNS TABLE (id uuid, request_text text, created_at timestamptz, requester_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rr.id, rr.request_text, rr.created_at,
    COALESCE(up.username, up.email, 'Okänd användare') AS requester_name
  FROM public.recipe_requests rr
  LEFT JOIN public.user_profiles up ON up.id = rr.user_id
  WHERE EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
  ORDER BY rr.created_at DESC
  LIMIT 100;
$$;

REVOKE EXECUTE ON FUNCTION public.get_recipe_requests FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_recipe_requests TO authenticated;

CREATE POLICY "Admins can delete recipe requests" ON public.recipe_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = (SELECT auth.uid()))
  );
