-- update_username: accepterar nu bara a-z0-9_ (inga åäö), max 30 tecken
-- Sparar alltid lowercase
CREATE OR REPLACE FUNCTION public.update_username(p_new_username text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions' AS $$
BEGIN
  IF p_new_username !~ '^[a-zA-Z0-9_]{2,30}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_format');
  END IF;

  IF p_new_username ~* '^(admin|support|calculeat|help|api|system|null|undefined|root|mod|moderator)$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'reserved_username');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE lower(username) = lower(trim(p_new_username))
      AND id <> (SELECT auth.uid())
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'username_taken');
  END IF;

  UPDATE public.user_profiles
  SET username = lower(trim(p_new_username))
  WHERE id = (SELECT auth.uid());

  RETURN jsonb_build_object('success', true);
END;
$$;

-- check_username_available: normaliserar input konsekvent med triggern
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public', 'extensions' AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE lower(username) = lower(public.normalize_username(trim(p_username)))
  );
$$;
