-- normalize_username: konverterar godtycklig text till ett giltigt username-format
-- Regler: lowercase, åäö→aao, icke-alphanumeriska → _, leading/trailing _ trimmade
CREATE OR REPLACE FUNCTION public.normalize_username(p_input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT btrim(
    regexp_replace(
      lower(translate(trim(p_input), 'åäöÅÄÖ', 'aaoAAO')),
      '[^a-z0-9_]', '_', 'g'
    ),
    '_'
  );
$$;

-- find_available_username: hittar ett ledigt username med auto-suffix vid konflikt
CREATE OR REPLACE FUNCTION public.find_available_username(p_base text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_candidate text := p_base;
  v_counter   int  := 2;
BEGIN
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE lower(username) = lower(v_candidate)
    ) THEN
      RETURN v_candidate;
    END IF;
    v_candidate := p_base || '_' || v_counter;
    v_counter   := v_counter + 1;
    EXIT WHEN v_counter > 9999;
  END LOOP;
  RETURN p_base || '_' || substr(gen_random_uuid()::text, 1, 6);
END;
$$;
