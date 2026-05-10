-- =========================================================
-- MIGRATION: Robust nutrient-kopiering + retroaktiv fix
-- Date: 2026-05-10
-- Problem: send_share_invitation hade row_security-bug som gjorde att
--   nutrients-arrayen i snapshot blev null/tom. Gamla accepterade
--   inbjudningar saknar därför nutrients på mottagarens food_items.
-- Fix:
--   1. _upsert_shared_food_item: fallback-logik — om snapshot saknar
--      nutrients men original_food_item_id finns, hämta nutrients
--      direkt från källan i databasen
--   2. Retroaktiv kopiering av nutrients för redan-importerade
--      source='shared' food_items som saknar nutrients
-- =========================================================

-- =========================================================
-- STEG 1: Uppdatera _upsert_shared_food_item med fallback
-- =========================================================

CREATE OR REPLACE FUNCTION public._upsert_shared_food_item(
  p_snapshot    jsonb,
  p_user_id     uuid,
  p_sender_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_is_global            boolean := COALESCE((p_snapshot->>'is_global')::boolean, false);
  v_original_id          uuid    := (p_snapshot->>'original_food_item_id')::uuid;
  v_existing_id          uuid;
  v_new_id               uuid;
  v_target_name          text;
  v_suffix_name          text;
  v_attempt              int;
  v_nutrient             jsonb;

  v_calories     numeric := COALESCE((p_snapshot->>'calories')::numeric, 0);
  v_fat_g        numeric := COALESCE((p_snapshot->>'fat_g')::numeric, 0);
  v_carb_g       numeric := COALESCE((p_snapshot->>'carb_g')::numeric, 0);
  v_protein_g    numeric := COALESCE((p_snapshot->>'protein_g')::numeric, 0);
  v_ref_unit     text    := COALESCE(p_snapshot->>'reference_unit', 'g');
  v_ref_amount   numeric := COALESCE((p_snapshot->>'reference_amount')::numeric, 100);
  v_brand        text    := COALESCE(p_snapshot->>'brand', '');
  v_barcode      text    := COALESCE(p_snapshot->>'barcode', '');
  v_density      numeric := COALESCE((p_snapshot->>'density_g_per_ml')::numeric, 0);
  v_grams_piece  numeric := COALESCE((p_snapshot->>'grams_per_piece')::numeric, 0);
  v_ml_per_gram  numeric := COALESCE((p_snapshot->>'ml_per_gram')::numeric, 0);

  v_computed_hash text;
BEGIN
  -- GLOBALT OBJEKT: Länka till original, kopiera INTE
  IF v_is_global AND v_original_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.food_items
    WHERE id = v_original_id AND user_id IS NULL
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  -- USER-ÄGET OBJEKT: Deduplicering via data_hash
  v_computed_hash := encode(
    sha256(
      concat_ws('|',
        ROUND(v_calories, 2)::text,
        ROUND(v_fat_g, 2)::text,
        ROUND(v_carb_g, 2)::text,
        ROUND(v_protein_g, 2)::text,
        lower(v_ref_unit),
        ROUND(v_ref_amount, 2)::text,
        lower(v_brand),
        v_barcode,
        ROUND(v_density, 4)::text,
        ROUND(v_grams_piece, 4)::text,
        ROUND(v_ml_per_gram, 4)::text
      )::bytea
    ),
    'hex'
  );

  SELECT id INTO v_existing_id
  FROM public.food_items
  WHERE user_id   = p_user_id
    AND data_hash = v_computed_hash
    AND is_hidden = false
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Skapa ny user-kopia med source='shared'
  v_target_name := p_snapshot->>'name';

  FOR v_attempt IN 0..11 LOOP
    IF v_attempt = 0 THEN
      v_suffix_name := v_target_name;
    ELSIF v_attempt = 1 THEN
      v_suffix_name := v_target_name || ' – ' || p_sender_name;
    ELSE
      v_suffix_name := v_target_name || ' – ' || p_sender_name || ' (' || (v_attempt)::text || ')';
    END IF;

    BEGIN
      INSERT INTO public.food_items (
        user_id, name, source, shared_by,
        calories, fat_g, carb_g, protein_g,
        reference_unit, reference_amount,
        default_amount, default_unit, food_type,
        ml_per_gram, grams_per_piece, serving_unit,
        density_g_per_ml, notes, brand, barcode,
        is_recipe, is_hidden, weight_grams
      )
      VALUES (
        p_user_id, v_suffix_name, 'shared', p_sender_name,
        v_calories, v_fat_g, v_carb_g, v_protein_g,
        v_ref_unit, v_ref_amount,
        COALESCE((p_snapshot->>'default_amount')::numeric, 100),
        COALESCE(p_snapshot->>'default_unit', 'g'),
        COALESCE(p_snapshot->>'food_type', 'Solid'),
        NULLIF(v_ml_per_gram, 0),
        NULLIF(v_grams_piece, 0),
        p_snapshot->>'serving_unit',
        NULLIF(v_density, 0),
        p_snapshot->>'notes',
        NULLIF(p_snapshot->>'brand', ''),
        NULLIF(p_snapshot->>'barcode', ''),
        false, false,
        (p_snapshot->>'weight_grams')::numeric
      )
      RETURNING id INTO v_new_id;

      -- -------------------------------------------------------
      -- Kopiera food_nutrients — två nivåer:
      -- 1. Snapshot har nutrients-array → använd den
      -- 2. Snapshot saknar/tom nutrients men original_food_item_id
      --    finns → hämta direkt från food_nutrients för originalet
      -- -------------------------------------------------------
      IF p_snapshot->'nutrients' IS NOT NULL
         AND jsonb_array_length(p_snapshot->'nutrients') > 0
      THEN
        FOR v_nutrient IN
          SELECT * FROM jsonb_array_elements(p_snapshot->'nutrients')
        LOOP
          INSERT INTO public.food_nutrients (
            food_item_id, nutrient_code, amount, unit,
            reference_amount, reference_unit
          )
          VALUES (
            v_new_id,
            v_nutrient->>'nutrient_code',
            (v_nutrient->>'amount')::numeric,
            COALESCE(v_nutrient->>'unit', 'g'),
            COALESCE((v_nutrient->>'reference_amount')::numeric, 100),
            COALESCE(v_nutrient->>'reference_unit', 'g')
          )
          ON CONFLICT (food_item_id, nutrient_code) DO NOTHING;
        END LOOP;

      ELSIF v_original_id IS NOT NULL THEN
        -- Fallback: kopiera direkt från källan i databasen
        INSERT INTO public.food_nutrients (
          food_item_id, nutrient_code, amount, unit,
          reference_amount, reference_unit
        )
        SELECT v_new_id, fn.nutrient_code, fn.amount, fn.unit,
               fn.reference_amount, fn.reference_unit
        FROM public.food_nutrients fn
        WHERE fn.food_item_id = v_original_id
        ON CONFLICT (food_item_id, nutrient_code) DO NOTHING;
      END IF;

      RETURN v_new_id;

    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;

  RAISE EXCEPTION 'name_conflict_unresolvable: Kunde inte skapa unikt namn för livsmedel "%"', v_target_name;
END;
$$;

COMMENT ON FUNCTION public._upsert_shared_food_item IS
  'Intern dedupliceringsmotor för delningsimport. Ej anropbar direkt av klienter.
   Nutrients: 1) från snapshot-array om den finns, 2) fallback via original_food_item_id
   direkt från food_nutrients i databasen. row_security=off krävs för cross-user-läsning.';

REVOKE EXECUTE ON FUNCTION public._upsert_shared_food_item FROM PUBLIC, anon, authenticated;

-- =========================================================
-- STEG 2: Retroaktiv kopiering för redan-importerade items
-- Kopierar nutrients från original till source='shared' items
-- som saknar nutrients men har spårbart original via snapshot.
-- =========================================================

INSERT INTO public.food_nutrients (
  food_item_id, nutrient_code, amount, unit, reference_amount, reference_unit
)
SELECT DISTINCT ON (shared.id, fn.nutrient_code)
  shared.id,
  fn.nutrient_code,
  fn.amount,
  fn.unit,
  fn.reference_amount,
  fn.reference_unit
FROM public.food_items shared
-- Hitta original_food_item_id från snapshot i share_invitations
JOIN LATERAL (
  SELECT (ing->'food_item_snapshot'->>'original_food_item_id')::uuid AS original_id
  FROM public.share_invitations si,
       LATERAL jsonb_array_elements(COALESCE(si.snapshot->'ingredients', '[]')) ing
  WHERE si.recipient_id = shared.user_id
    AND ing->'food_item_snapshot'->>'name' = shared.name
    AND (ing->'food_item_snapshot'->>'original_food_item_id') IS NOT NULL
  LIMIT 1
) AS orig ON true
JOIN public.food_nutrients fn ON fn.food_item_id = orig.original_id
-- Bara items som helt saknar nutrients
WHERE shared.source = 'shared'
  AND NOT EXISTS (
    SELECT 1 FROM public.food_nutrients fn2
    WHERE fn2.food_item_id = shared.id
  )
ON CONFLICT (food_item_id, nutrient_code) DO NOTHING;
