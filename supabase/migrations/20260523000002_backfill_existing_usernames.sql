-- Backfill: sätt username för befintliga rader där det saknas
-- Körs idempotent (WHERE username IS NULL) — påverkar inte users som redan har username
DO $$
DECLARE
  r record;
  v_base     text;
  v_username text;
BEGIN
  FOR r IN
    SELECT id, COALESCE(profile_name, email) AS source_name
    FROM public.user_profiles
    WHERE username IS NULL
    ORDER BY created_at
  LOOP
    v_base := public.normalize_username(r.source_name);
    IF length(v_base) < 2 THEN
      v_base := 'user_' || substr(r.id::text, 1, 6);
    END IF;
    v_username := public.find_available_username(v_base);
    UPDATE public.user_profiles SET username = v_username WHERE id = r.id;
  END LOOP;
END;
$$;
