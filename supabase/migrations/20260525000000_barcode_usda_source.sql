-- Add p_source parameter to save_barcode_result so USDA hits are tagged correctly.
-- Fix check_barcode_cache: not_found error code was 'off_not_found' — changed to
-- 'not_found' so the client can distinguish a cache miss (no hit) from a cached
-- miss (hit + error). The hook already treats both as lookup failures but the
-- distinction matters for logging and future per-source retry logic.

CREATE OR REPLACE FUNCTION public.save_barcode_result(
  p_barcode text,
  p_status  text,
  p_data    jsonb DEFAULT NULL,
  p_error   text DEFAULT NULL,
  p_source  text DEFAULT 'openfoodfacts'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  IF p_status = 'found' AND p_data IS NOT NULL THEN
    INSERT INTO public.barcode_lookup_cache (
      barcode, name, calories, fat_g, carb_g, protein_g,
      saturated_fat_g, sugars_g, salt_g, fiber_g,
      default_unit, food_type, source_api, status, fetched_at
    )
    VALUES (
      p_barcode,
      p_data->>'name',
      (p_data->>'calories')::numeric,
      (p_data->>'fat_g')::numeric,
      (p_data->>'carb_g')::numeric,
      (p_data->>'protein_g')::numeric,
      (p_data->>'saturated_fat_g')::numeric,
      (p_data->>'sugars_g')::numeric,
      (p_data->>'salt_g')::numeric,
      (p_data->>'fiber_g')::numeric,
      COALESCE(p_data->>'default_unit', 'g'),
      p_data->>'food_type',
      p_source,
      'found',
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
          fiber_g         = EXCLUDED.fiber_g,
          default_unit    = EXCLUDED.default_unit,
          food_type       = EXCLUDED.food_type,
          source_api      = EXCLUDED.source_api,
          status          = 'found',
          fetched_at      = EXCLUDED.fetched_at
    WHERE public.barcode_lookup_cache.fetched_at < now() - interval '30 days';

    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', true, null);

  ELSIF p_status = 'not_found' THEN
    INSERT INTO public.barcode_lookup_cache (barcode, status, fetched_at)
    VALUES (p_barcode, 'not_found', now())
    ON CONFLICT (barcode) DO UPDATE
      SET status = 'not_found', fetched_at = now()
    WHERE public.barcode_lookup_cache.fetched_at < now() - interval '7 days';

    INSERT INTO public.scan_usage (user_id, scan_type, success, error_type)
    VALUES (v_user_id, 'barcode', false, COALESCE(p_error, 'not_found'));
  END IF;
END;
$$;

-- Fix: not_found error code was 'off_not_found', now 'not_found' (source-agnostic)
CREATE OR REPLACE FUNCTION public.check_barcode_cache(p_barcode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
DECLARE
  v_cached public.barcode_lookup_cache%ROWTYPE;
BEGIN
  SELECT * INTO v_cached
  FROM public.barcode_lookup_cache
  WHERE barcode = p_barcode
    AND (
      (status = 'found'     AND fetched_at > now() - interval '30 days')
      OR
      (status = 'not_found' AND fetched_at > now() - interval '7 days')
    )
  ORDER BY
    CASE source_api
      WHEN 'openfoodfacts'    THEN 1
      WHEN 'usda'             THEN 2
      WHEN 'user_contributed' THEN 3
      ELSE 4
    END
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_cached
    FROM public.barcode_lookup_cache
    WHERE barcode   = p_barcode
      AND source_api = 'user_contributed'
      AND status     = 'found'
      AND fetched_at > now() - interval '90 days';
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('hit', false);
  END IF;

  IF v_cached.status = 'not_found' THEN
    -- Source-agnostic error code: client treats this as "both sources failed"
    RETURN jsonb_build_object('hit', true, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'hit', true,
    'data', jsonb_build_object(
      'name',            v_cached.name,
      'calories',        v_cached.calories,
      'fat_g',           v_cached.fat_g,
      'carb_g',          v_cached.carb_g,
      'protein_g',       v_cached.protein_g,
      'saturated_fat_g', v_cached.saturated_fat_g,
      'sugars_g',        v_cached.sugars_g,
      'salt_g',          v_cached.salt_g,
      'fiber_g',         v_cached.fiber_g,
      'default_unit',    v_cached.default_unit,
      'food_type',       v_cached.food_type,
      'default_amount',  100
    )
  );
END;
$$;
