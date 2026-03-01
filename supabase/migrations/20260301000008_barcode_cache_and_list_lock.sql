-- =========================================================
-- MIGRATION: Fas 2 — barcode_lookup_cache + leave_list lock
-- Date: 2026-03-01
-- =========================================================

-- ---------------------------------------------------
-- 1. barcode_lookup_cache
-- Global cache: ett barcode = en rad, delas av alla användare.
-- Skrivs enbart via get_or_fetch_barcode RPC (SECURITY DEFINER).
-- Cachad data anses färsk i 30 dagar.
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barcode_lookup_cache (
  barcode         text        PRIMARY KEY,
  name            text,
  calories        numeric(10,2),
  fat_g           numeric(10,2),
  carb_g          numeric(10,2),
  protein_g       numeric(10,2),
  saturated_fat_g numeric(10,4),
  sugars_g        numeric(10,4),
  salt_g          numeric(10,4),
  default_unit    text        NOT NULL DEFAULT 'g',
  food_type       text,
  source_api      text        NOT NULL DEFAULT 'openfoodfacts',
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_barcode_length     CHECK (length(barcode) BETWEEN 8 AND 14),
  CONSTRAINT chk_food_type_valid    CHECK (food_type IS NULL OR food_type IN ('Solid', 'Liquid', 'Soup')),
  CONSTRAINT chk_default_unit_valid CHECK (default_unit IN ('g', 'ml'))
);

CREATE INDEX IF NOT EXISTS idx_barcode_cache_fetched_at
  ON public.barcode_lookup_cache (fetched_at);

ALTER TABLE public.barcode_lookup_cache ENABLE ROW LEVEL SECURITY;

-- Publik produktdata — alla autentiserade kan läsa
CREATE POLICY "Authenticated users can read barcode cache"
  ON public.barcode_lookup_cache FOR SELECT
  TO authenticated
  USING (true);

-- Direkta skrivningar blockeras — skrivs enbart via SECURITY DEFINER RPC
CREATE POLICY "No direct insert to barcode cache"
  ON public.barcode_lookup_cache FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update to barcode cache"
  ON public.barcode_lookup_cache FOR UPDATE
  USING (false);

COMMENT ON TABLE public.barcode_lookup_cache IS
  'Global server-side cache för barcode-lookups mot OpenFoodFacts.
   Skrivs enbart via get_or_fetch_barcode RPC + fetch-barcode Edge Function.
   Cachad data anses färsk i 30 dagar.';

-- ---------------------------------------------------
-- 2. get_or_fetch_barcode RPC
-- Kontrollerar cache (30 dagar) → anropar Edge Function vid cache miss
-- → sparar i cache → returnerar data.
-- Rate limiting: max 10 scans per minut per användare (via scan_usage).
--
-- pg_net 0.19.5 API:
--   net.http_post(...) RETURNS bigint (request_id, asynkront)
--   net.http_collect_response(request_id, async := false) RETURNS net.http_response_result
--   net.http_response_result: (status request_status, message text, response net.http_response)
--   net.http_response: (status_code int, headers jsonb, body text)
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_fetch_barcode(
  p_barcode text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_cached     public.barcode_lookup_cache%ROWTYPE;
  v_scan_count int;
  v_request_id bigint;
  v_response   net.http_response_result;
  v_result     jsonb;
  v_status     int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  IF p_barcode IS NULL
     OR length(p_barcode) < 8
     OR length(p_barcode) > 14
     OR p_barcode !~ '^[0-9]+$'
  THEN
    RETURN jsonb_build_object('error', 'invalid_barcode_format');
  END IF;

  -- Rate limiting: max 10 scans per minut per användare
  SELECT COUNT(*) INTO v_scan_count
  FROM public.scan_usage
  WHERE user_id  = v_user_id
    AND scan_type = 'barcode'
    AND created_at > now() - interval '1 minute';

  IF v_scan_count >= 10 THEN
    RETURN jsonb_build_object('error', 'rate_limited');
  END IF;

  -- Kolla cache (färsk = fetched inom 30 dagar)
  SELECT * INTO v_cached
  FROM public.barcode_lookup_cache
  WHERE barcode   = p_barcode
    AND fetched_at > now() - interval '30 days';

  IF FOUND THEN
    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', true, null);

    RETURN jsonb_build_object(
      'source', 'cache',
      'data', jsonb_build_object(
        'name',            v_cached.name,
        'calories',        v_cached.calories,
        'fat_g',           v_cached.fat_g,
        'carb_g',          v_cached.carb_g,
        'protein_g',       v_cached.protein_g,
        'saturated_fat_g', v_cached.saturated_fat_g,
        'sugars_g',        v_cached.sugars_g,
        'salt_g',          v_cached.salt_g,
        'default_unit',    v_cached.default_unit,
        'food_type',       v_cached.food_type,
        'default_amount',  100
      )
    );
  END IF;

  -- Cache-miss: anropa fetch-barcode Edge Function via pg_net
  -- verify_jwt: false på Edge Function — ingen Authorization-header krävs
  v_request_id := net.http_post(
    url     := 'https://mdtrmyvwkypnivbjtgkc.supabase.co/functions/v1/fetch-barcode',
    body    := jsonb_build_object('barcode', p_barcode),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );

  -- Vänta på svar (synkront)
  v_response := net.http_collect_response(v_request_id, async := false);

  -- Nätverksfel
  IF v_response.status <> 'SUCCESS' THEN
    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', false, 'fetch_failed');
    RETURN jsonb_build_object('error', 'fetch_failed', 'detail', v_response.message);
  END IF;

  v_status := v_response.response.status_code;

  -- Parsa body
  BEGIN
    v_result := v_response.response.body::jsonb;
  EXCEPTION WHEN others THEN
    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', false, 'parse_failed');
    RETURN jsonb_build_object('error', 'parse_failed');
  END;

  -- HTTP-fel från Edge Function
  IF v_status < 200 OR v_status >= 300 THEN
    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', false,
            COALESCE(v_result->>'error', 'fetch_failed'));
    RETURN COALESCE(v_result, jsonb_build_object('error', 'fetch_failed'));
  END IF;

  -- Applikationsfel i svaret
  IF (v_result->>'error') IS NOT NULL THEN
    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', false, v_result->>'error');
    RETURN v_result;
  END IF;

  -- Spara i cache (ON CONFLICT: uppdatera om äldre än 30 dagar)
  INSERT INTO public.barcode_lookup_cache (
    barcode, name, calories, fat_g, carb_g, protein_g,
    saturated_fat_g, sugars_g, salt_g, default_unit, food_type, fetched_at
  )
  VALUES (
    p_barcode,
    v_result->'data'->>'name',
    (v_result->'data'->>'calories')::numeric,
    (v_result->'data'->>'fat_g')::numeric,
    (v_result->'data'->>'carb_g')::numeric,
    (v_result->'data'->>'protein_g')::numeric,
    (v_result->'data'->>'saturated_fat_g')::numeric,
    (v_result->'data'->>'sugars_g')::numeric,
    (v_result->'data'->>'salt_g')::numeric,
    COALESCE(v_result->'data'->>'default_unit', 'g'),
    v_result->'data'->>'food_type',
    now()
  )
  ON CONFLICT (barcode) DO UPDATE
    SET name            = EXCLUDED.name,
        calories        = EXCLUDED.calories,
        fat_g           = EXCLUDED.fat_g,
        carb_g          = EXCLUDED.carb_g,
        protein_g       = EXCLUDED.protein_g,
        saturated_fat_g = EXCLUDED.saturated_fat_g,
        sugars_g        = EXCLUDED.sugars_g,
        salt_g          = EXCLUDED.salt_g,
        default_unit    = EXCLUDED.default_unit,
        food_type       = EXCLUDED.food_type,
        fetched_at      = EXCLUDED.fetched_at
  WHERE public.barcode_lookup_cache.fetched_at < now() - interval '30 days';

  -- Logga lyckad scan
  INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
  VALUES (v_user_id, 'barcode', true, null);

  RETURN jsonb_build_object('source', 'off', 'data', v_result->'data');
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_fetch_barcode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_fetch_barcode(text) TO authenticated;

COMMENT ON FUNCTION public.get_or_fetch_barcode IS
  'Hämtar barcode-data: kontrollerar cache (30 dagar), annars anropar fetch-barcode Edge Function.
   Rate limiting: max 10 anrop per minut per användare.
   Loggar alla anrop i scan_usage.';

-- ---------------------------------------------------
-- 3. leave_shared_list_confirmed — FOR UPDATE-lås
-- Eliminerar race condition: sista-member-check kan raca utan lås.
-- SET LOCAL lock_timeout hindrar lång väntan vid lock-contention.
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_shared_list_confirmed(
  p_shared_list_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid;
  v_member_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Sätt lock_timeout lokalt för denna transaktion
  -- Skyddar mot lång väntan vid hög konkurrens
  SET LOCAL lock_timeout = '5s';

  -- Lås listan mot parallella ändringar INNAN member-count-kontrollen
  -- FOR UPDATE blockerar andra transaktioner som vill låsa/modifiera raden
  PERFORM id FROM public.shared_lists
  WHERE id = p_shared_list_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'list_not_found');
  END IF;

  -- Räkna antal kvarvarande aktiva medlemmar
  SELECT COUNT(*) INTO v_member_count
  FROM public.shared_list_members
  WHERE shared_list_id = p_shared_list_id;

  IF v_member_count > 1 THEN
    -- Fler medlemmar: bara lämna utan att radera listan
    DELETE FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id
      AND user_id = v_user_id;

    RETURN jsonb_build_object('success', true, 'action', 'left');
  ELSE
    -- Sista medlemmen: radera listan (CASCADE tar allt)
    DELETE FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id
      AND user_id = v_user_id;

    DELETE FROM public.shared_lists
    WHERE id = p_shared_list_id;

    RETURN jsonb_build_object('success', true, 'action', 'deleted');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.leave_shared_list_confirmed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_shared_list_confirmed(uuid) TO authenticated;

COMMENT ON FUNCTION public.leave_shared_list_confirmed IS
  'Lämnar en delad lista. Om sista medlemmen: raderar listan (CASCADE).
   FOR UPDATE-lås på shared_lists eliminerar race condition vid simultana lämningar.
   lock_timeout = 5s skyddar mot lång lock-väntan.';
