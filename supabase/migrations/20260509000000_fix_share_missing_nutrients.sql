-- =========================================================
-- MIGRATION: Fix sharing — include food_nutrients in snapshots
-- Date: 2026-05-09
-- Problem: send_share_invitation builds snapshots without food_nutrients
--   (saturated_fat, sugars, salt + all other extended nutrients).
--   _upsert_shared_food_item creates the food_item row but never
--   inserts corresponding food_nutrients rows.
-- Fix:
--   1. send_share_invitation: embed nutrients array in food_item snapshot
--      (both top-level food_items and recipe ingredient snapshots)
--   2. _upsert_shared_food_item: after INSERT, copy nutrients from snapshot
-- =========================================================

-- =========================================================
-- STEG 1: Uppdatera _upsert_shared_food_item
--   Nytt: kopierar food_nutrients från snapshot efter INSERT
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

  -- Nutritionsvärden från snapshot
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

  -- Beräkna samma hash som triggern (utan name)
  v_computed_hash text;
BEGIN
  -- -------------------------------------------------------
  -- GLOBALT OBJEKT: Länka till original, kopiera INTE
  -- -------------------------------------------------------
  IF v_is_global AND v_original_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.food_items
    WHERE id = v_original_id
      AND user_id IS NULL
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- USER-ÄGET OBJEKT: Deduplicering via data_hash
  -- -------------------------------------------------------
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
    -- Exakt nutritionsmatch: returnera befintligt ID (ingen kopia)
    -- OBS: vi skriver INTE över befintliga food_nutrients — användaren
    -- kanske har egna värden. Deduplicering prioriteras framför nutrients.
    RETURN v_existing_id;
  END IF;

  -- -------------------------------------------------------
  -- Ingen match: Skapa ny user-kopia med source='shared'
  -- -------------------------------------------------------
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
        user_id,
        name,
        source,
        shared_by,
        calories,
        fat_g,
        carb_g,
        protein_g,
        reference_unit,
        reference_amount,
        default_amount,
        default_unit,
        food_type,
        ml_per_gram,
        grams_per_piece,
        serving_unit,
        density_g_per_ml,
        notes,
        brand,
        barcode,
        is_recipe,
        is_hidden,
        weight_grams
      )
      VALUES (
        p_user_id,
        v_suffix_name,
        'shared',
        p_sender_name,
        v_calories,
        v_fat_g,
        v_carb_g,
        v_protein_g,
        v_ref_unit,
        v_ref_amount,
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
        false,
        false,
        (p_snapshot->>'weight_grams')::numeric
      )
      RETURNING id INTO v_new_id;

      -- -------------------------------------------------------
      -- Kopiera food_nutrients från snapshot (om de finns)
      -- Snapshot-format: "nutrients": [{"nutrient_code": "saturated_fat",
      --   "amount": 2.3, "unit": "g", "reference_amount": 100,
      --   "reference_unit": "g"}, ...]
      -- -------------------------------------------------------
      IF p_snapshot->'nutrients' IS NOT NULL
         AND jsonb_array_length(p_snapshot->'nutrients') > 0
      THEN
        FOR v_nutrient IN
          SELECT * FROM jsonb_array_elements(p_snapshot->'nutrients')
        LOOP
          INSERT INTO public.food_nutrients (
            food_item_id,
            nutrient_code,
            amount,
            unit,
            reference_amount,
            reference_unit
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
   Globala objekt (is_global=true): länkas till original, kopieras ej.
   User-ägda objekt: deduplicering via data_hash, retry-loop för namnkollisioner.
   Kopierar food_nutrients (mättat fett, sockerarter, salt m.fl.) från snapshot.';

REVOKE EXECUTE ON FUNCTION public._upsert_shared_food_item FROM PUBLIC, anon, authenticated;

-- =========================================================
-- STEG 2: Uppdatera send_share_invitation
--   Nytt: hämtar food_nutrients och bäddar in i varje food_item-snapshot
-- =========================================================

-- Droppa den gamla overload-varianten med omvänd parameterordning
DROP FUNCTION IF EXISTS public.send_share_invitation(text, text, uuid);

CREATE OR REPLACE FUNCTION public.send_share_invitation(
  p_item_id           uuid,
  p_item_type         text,
  p_recipient_email   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id       uuid := auth.uid();
  v_sender_name     text;
  v_recipient_id    uuid;
  v_item_snapshot   jsonb;
  v_invitation_id   uuid;
  v_food_item       record;
  v_recipe          record;
  v_ingredient      record;
  v_ingredients_arr jsonb := '[]'::jsonb;
  v_ing_snap        jsonb;
  v_fi_snap         jsonb;
  v_nutrients_arr   jsonb;
BEGIN
  IF p_item_type NOT IN ('food_item', 'recipe') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_item_type');
  END IF;

  SELECT COALESCE(profile_name, email)
  INTO v_sender_name
  FROM public.user_profiles
  WHERE id = v_sender_id;

  IF v_sender_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'sender_not_found');
  END IF;

  IF p_item_type = 'food_item' THEN
    SELECT * INTO v_food_item
    FROM public.food_items
    WHERE id = p_item_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;

    IF v_food_item.user_id IS NULL OR v_food_item.user_id != v_sender_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_owner');
    END IF;

    IF v_food_item.source != 'manual' THEN
      RETURN jsonb_build_object('success', false, 'error', 'cannot_share_non_manual_item');
    END IF;

    -- Hämta nutrients för detta livsmedel
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object(
        'nutrient_code',   fn.nutrient_code,
        'amount',          fn.amount,
        'unit',            fn.unit,
        'reference_amount', fn.reference_amount,
        'reference_unit',  fn.reference_unit
      )),
      '[]'::jsonb
    )
    INTO v_nutrients_arr
    FROM public.food_nutrients fn
    WHERE fn.food_item_id = p_item_id;

    v_item_snapshot := jsonb_build_object(
      'name',               v_food_item.name,
      'calories',           v_food_item.calories,
      'fat_g',              v_food_item.fat_g,
      'carb_g',             v_food_item.carb_g,
      'protein_g',          v_food_item.protein_g,
      'reference_unit',     v_food_item.reference_unit,
      'reference_amount',   v_food_item.reference_amount,
      'default_amount',     v_food_item.default_amount,
      'default_unit',       v_food_item.default_unit,
      'food_type',          v_food_item.food_type,
      'ml_per_gram',        v_food_item.ml_per_gram,
      'grams_per_piece',    v_food_item.grams_per_piece,
      'serving_unit',       v_food_item.serving_unit,
      'density_g_per_ml',   v_food_item.density_g_per_ml,
      'notes',              v_food_item.notes,
      'brand',              v_food_item.brand,
      'barcode',            v_food_item.barcode,
      'weight_grams',       v_food_item.weight_grams,
      'is_global',          false,
      'original_food_item_id', NULL,
      'nutrients',          v_nutrients_arr
    );

  ELSIF p_item_type = 'recipe' THEN
    SELECT * INTO v_recipe
    FROM public.recipes
    WHERE id = p_item_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;

    IF v_recipe.user_id != v_sender_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_owner');
    END IF;

    -- Bygg ingredient-snapshots (inkl. nutrients per ingrediens)
    FOR v_ingredient IN
      SELECT
        ri.amount, ri.unit, ri.weight_grams, ri.ingredient_order,
        fi.id AS fi_id, fi.name, fi.calories, fi.fat_g, fi.carb_g,
        fi.protein_g, fi.reference_unit, fi.reference_amount,
        fi.default_amount, fi.default_unit, fi.food_type,
        fi.ml_per_gram, fi.grams_per_piece, fi.serving_unit,
        fi.density_g_per_ml, fi.notes, fi.brand, fi.barcode,
        fi.weight_grams AS fi_weight_grams, fi.user_id AS fi_user_id
      FROM public.recipe_ingredients ri
      JOIN public.food_items fi ON fi.id = ri.food_item_id
      WHERE ri.recipe_id = p_item_id
      ORDER BY ri.ingredient_order
    LOOP
      -- Hämta nutrients för denna ingrediens
      -- Globala (SLV/USDA) objekt har nutrients i food_nutrients-tabellen.
      -- Vi inkluderar dem i snapshoten som fallback om globalt objekt saknas
      -- vid accept (men _upsert_shared_food_item länkar till originalet om det finns).
      SELECT COALESCE(
        jsonb_agg(jsonb_build_object(
          'nutrient_code',    fn.nutrient_code,
          'amount',           fn.amount,
          'unit',             fn.unit,
          'reference_amount', fn.reference_amount,
          'reference_unit',   fn.reference_unit
        )),
        '[]'::jsonb
      )
      INTO v_nutrients_arr
      FROM public.food_nutrients fn
      WHERE fn.food_item_id = v_ingredient.fi_id;

      v_fi_snap := jsonb_build_object(
        'name',               v_ingredient.name,
        'calories',           v_ingredient.calories,
        'fat_g',              v_ingredient.fat_g,
        'carb_g',             v_ingredient.carb_g,
        'protein_g',          v_ingredient.protein_g,
        'reference_unit',     v_ingredient.reference_unit,
        'reference_amount',   v_ingredient.reference_amount,
        'default_amount',     v_ingredient.default_amount,
        'default_unit',       v_ingredient.default_unit,
        'food_type',          v_ingredient.food_type,
        'ml_per_gram',        v_ingredient.ml_per_gram,
        'grams_per_piece',    v_ingredient.grams_per_piece,
        'serving_unit',       v_ingredient.serving_unit,
        'density_g_per_ml',   v_ingredient.density_g_per_ml,
        'notes',              v_ingredient.notes,
        'brand',              v_ingredient.brand,
        'barcode',            v_ingredient.barcode,
        'weight_grams',       v_ingredient.fi_weight_grams,
        'is_global',          (v_ingredient.fi_user_id IS NULL),
        'original_food_item_id', CASE
          WHEN v_ingredient.fi_user_id IS NULL THEN v_ingredient.fi_id
          ELSE NULL
        END,
        'nutrients',          v_nutrients_arr
      );

      v_ing_snap := jsonb_build_object(
        'amount',           v_ingredient.amount,
        'unit',             v_ingredient.unit,
        'weight_grams',     v_ingredient.weight_grams,
        'ingredient_order', v_ingredient.ingredient_order,
        'food_item_snapshot', v_fi_snap
      );
      v_ingredients_arr := v_ingredients_arr || jsonb_build_array(v_ing_snap);
    END LOOP;

    -- Bygg recipe food_item snapshot (om det finns)
    v_fi_snap := NULL;
    IF v_recipe.food_item_id IS NOT NULL THEN
      -- Hämta nutrients för receptets food_item
      SELECT COALESCE(
        jsonb_agg(jsonb_build_object(
          'nutrient_code',    fn.nutrient_code,
          'amount',           fn.amount,
          'unit',             fn.unit,
          'reference_amount', fn.reference_amount,
          'reference_unit',   fn.reference_unit
        )),
        '[]'::jsonb
      )
      INTO v_nutrients_arr
      FROM public.food_nutrients fn
      WHERE fn.food_item_id = v_recipe.food_item_id;

      SELECT jsonb_build_object(
        'name',             fi.name,
        'calories',         fi.calories,
        'fat_g',            fi.fat_g,
        'carb_g',           fi.carb_g,
        'protein_g',        fi.protein_g,
        'reference_unit',   fi.reference_unit,
        'reference_amount', fi.reference_amount,
        'default_amount',   fi.default_amount,
        'default_unit',     fi.default_unit,
        'food_type',        fi.food_type,
        'ml_per_gram',      fi.ml_per_gram,
        'grams_per_piece',  fi.grams_per_piece,
        'serving_unit',     fi.serving_unit,
        'density_g_per_ml', fi.density_g_per_ml,
        'notes',            fi.notes,
        'brand',            fi.brand,
        'barcode',          fi.barcode,
        'weight_grams',     fi.weight_grams,
        'is_global',        (fi.user_id IS NULL),
        'original_food_item_id', CASE WHEN fi.user_id IS NULL THEN fi.id ELSE NULL END,
        'nutrients',        v_nutrients_arr
      )
      INTO v_fi_snap
      FROM public.food_items fi
      WHERE fi.id = v_recipe.food_item_id;
    END IF;

    v_item_snapshot := jsonb_build_object(
      'name',               v_recipe.name,
      'servings',           v_recipe.servings,
      'total_weight_grams', v_recipe.total_weight_grams,
      'food_item_snapshot', v_fi_snap,
      'ingredients',        v_ingredients_arr
    );
  END IF;

  -- E-post-enumeration prevention
  SELECT id INTO v_recipient_id
  FROM public.user_profiles
  WHERE lower(email) = lower(trim(p_recipient_email));

  IF v_recipient_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'invitation_id', NULL);
  END IF;

  IF v_recipient_id = v_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_share_with_yourself');
  END IF;

  INSERT INTO public.share_invitations (
    sender_id, recipient_id, item_type, item_id,
    snapshot, sender_name
  )
  VALUES (
    v_sender_id, v_recipient_id, p_item_type, p_item_id,
    v_item_snapshot, v_sender_name
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_invitation_id;

  IF v_invitation_id IS NULL THEN
    SELECT id INTO v_invitation_id
    FROM public.share_invitations
    WHERE sender_id    = v_sender_id
      AND recipient_id = v_recipient_id
      AND item_type    = p_item_type
      AND item_id      = p_item_id
      AND status       = 'pending'
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object('success', true, 'invitation_id', v_invitation_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.send_share_invitation IS
  'Skapar delningsinbjudan. Validerar ägarskap (enbart source=manual tillåts).
   Returnerar alltid success oavsett om mottagarens e-post finns (privacy).
   Snapshot v1+ inkluderar nutrients-array med utökade näringsvärden.
   SECURITY DEFINER: kör med förhöjda rättigheter för cross-user-uppslag.';
