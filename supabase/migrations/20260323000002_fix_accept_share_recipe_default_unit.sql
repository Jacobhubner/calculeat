-- =========================================================
-- MIGRATION: accept_share_invitation respekterar receptets sparformat
-- Date: 2026-03-23
-- Anledning: När ett delat recept accepterades skapades food_item alltid
--   med default_unit='g', oavsett om originalet var sparat per portion.
--   Mottagaren fick därmed fel standardenhet när de loggade receptet.
-- Lösning: Läs default_unit, default_amount, serving_unit, grams_per_piece
--   och per-unit näringsvärden från food_item_snapshot och använd dem
--   i INSERT:en. Beräkna kcal_per_gram alltid, och kcal_per_unit/
--   fat_per_unit etc. när format är 'portion'.
-- =========================================================

CREATE OR REPLACE FUNCTION public.accept_share_invitation(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          uuid := auth.uid();
  v_inv          record;
  v_imported     int := 0;
  v_skipped      int := 0;
  v_item_row     jsonb;
  v_new_food_id  uuid;
  v_recipe_id    uuid;
  v_recipe_name  text;
  v_attempt      int;
  v_ing          jsonb;
  v_ing_food_id  uuid;

  -- För recipe food_item
  v_fi_snap        jsonb;
  v_fi_id          uuid;
  v_fi_calories    numeric := 0;
  v_fi_fat_g       numeric := 0;
  v_fi_carb_g      numeric := 0;
  v_fi_protein_g   numeric := 0;
  v_total_weight   numeric := 0;
  v_ing_cals       numeric;
  v_ing_fat        numeric;
  v_ing_carb       numeric;
  v_ing_prot       numeric;
  v_ing_weight     numeric;
  v_ing_ref_amt    numeric;

  -- Sparformat-fält (läses från snapshot om det finns)
  v_default_unit     text    := 'g';
  v_default_amount   numeric := 100;
  v_serving_unit     text    := NULL;
  v_grams_per_piece  numeric := NULL;
  v_kcal_per_gram    numeric := NULL;
  v_kcal_per_unit    numeric := NULL;
  v_fat_per_unit     numeric := NULL;
  v_carb_per_unit    numeric := NULL;
  v_protein_per_unit numeric := NULL;

  -- Nutrition per 100g (behövs för kcal_per_gram)
  v_cal_per_100g     numeric := 0;
  v_fat_per_100g     numeric := 0;
  v_carb_per_100g    numeric := 0;
  v_prot_per_100g    numeric := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_inv FROM share_invitations
  WHERE id = p_invitation_id AND recipient_id = v_uid
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;
  IF v_inv.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_already_processed');
  END IF;
  IF v_inv.expires_at < now() THEN
    UPDATE share_invitations SET status = 'expired', responded_at = now() WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'invitation_expired');
  END IF;

  IF v_inv.item_type = 'food_item' THEN
    v_new_food_id := _upsert_shared_food_item(v_inv.snapshot, v_uid, v_inv.sender_name);
    UPDATE share_invitations SET status = 'accepted', responded_at = now() WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', true, 'item_type', 'food_item', 'food_item_id', v_new_food_id);

  ELSIF v_inv.item_type = 'recipe' THEN
    v_recipe_name := v_inv.snapshot->>'name';
    v_attempt := 0;

    -- Skapa receptet
    LOOP
      BEGIN
        INSERT INTO recipes(user_id, name, servings, total_weight_grams)
        VALUES (v_uid,
          CASE WHEN v_attempt = 0 THEN v_recipe_name
               WHEN v_attempt = 1 THEN v_recipe_name || ' – ' || v_inv.sender_name
               ELSE v_recipe_name || ' – ' || v_inv.sender_name || ' (' || v_attempt || ')'
          END,
          (v_inv.snapshot->>'servings')::int,
          (v_inv.snapshot->>'total_weight_grams')::numeric
        ) RETURNING id INTO v_recipe_id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        v_attempt := v_attempt + 1;
        IF v_attempt > 10 THEN RAISE; END IF;
      END;
    END LOOP;

    -- Skapa ingrediensernas food_items
    FOR v_ing IN SELECT * FROM jsonb_array_elements(v_inv.snapshot->'ingredients') LOOP
      v_ing_food_id := _upsert_shared_food_item(v_ing->'food_item_snapshot', v_uid, v_inv.sender_name);
      INSERT INTO recipe_ingredients(recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order)
      VALUES (v_recipe_id, v_ing_food_id,
        (v_ing->>'amount')::numeric, v_ing->>'unit',
        (v_ing->>'weight_grams')::numeric, (v_ing->>'ingredient_order')::int);
    END LOOP;

    -- Skapa food_item för receptet självt (is_recipe=true) så det syns under "Mina"
    v_fi_snap := v_inv.snapshot->'food_item_snapshot';

    IF v_fi_snap IS NOT NULL AND v_fi_snap != 'null'::jsonb THEN
      -- Snapshoten innehåller redan beräknade näringsvärden
      v_fi_calories  := COALESCE((v_fi_snap->>'calories')::numeric, 0);
      v_fi_fat_g     := COALESCE((v_fi_snap->>'fat_g')::numeric, 0);
      v_fi_carb_g    := COALESCE((v_fi_snap->>'carb_g')::numeric, 0);
      v_fi_protein_g := COALESCE((v_fi_snap->>'protein_g')::numeric, 0);
      v_total_weight := COALESCE((v_fi_snap->>'weight_grams')::numeric,
                                  (v_inv.snapshot->>'total_weight_grams')::numeric, 100);

      -- Läs sparformat från snapshot
      v_default_unit   := COALESCE(v_fi_snap->>'default_unit', 'g');
      v_default_amount := COALESCE((v_fi_snap->>'default_amount')::numeric, 100);
      v_serving_unit   := v_fi_snap->>'serving_unit';
      v_grams_per_piece := (v_fi_snap->>'grams_per_piece')::numeric;

      -- Beräkna kcal_per_gram (alltid baserat på per-100g-värden)
      -- Om sparformat är portion: calories i snapshot = per portion, vi behöver per 100g
      IF v_default_unit = 'portion' AND v_grams_per_piece IS NOT NULL AND v_grams_per_piece > 0 THEN
        -- calories i snapshot är per portion → räkna om till per 100g
        v_cal_per_100g  := v_fi_calories  / v_grams_per_piece * 100;
        v_fat_per_100g  := v_fi_fat_g     / v_grams_per_piece * 100;
        v_carb_per_100g := v_fi_carb_g    / v_grams_per_piece * 100;
        v_prot_per_100g := v_fi_protein_g / v_grams_per_piece * 100;

        v_kcal_per_gram    := v_cal_per_100g / 100;
        v_kcal_per_unit    := v_fi_calories;
        v_fat_per_unit     := v_fi_fat_g;
        v_carb_per_unit    := v_fi_carb_g;
        v_protein_per_unit := v_fi_protein_g;

        -- food_item.calories ska vara per 100g
        v_fi_calories  := ROUND(v_cal_per_100g,  2);
        v_fi_fat_g     := ROUND(v_fat_per_100g,  2);
        v_fi_carb_g    := ROUND(v_carb_per_100g, 2);
        v_fi_protein_g := ROUND(v_prot_per_100g, 2);
      ELSE
        -- 100g-format: calories är redan per 100g
        v_kcal_per_gram := v_fi_calories / 100;
      END IF;

    ELSE
      -- Beräkna näringsvärden från ingrediensernas snapshots (per 100g av totalvikten)
      v_total_weight := COALESCE((v_inv.snapshot->>'total_weight_grams')::numeric, 0);

      FOR v_ing IN SELECT * FROM jsonb_array_elements(v_inv.snapshot->'ingredients') LOOP
        v_ing_ref_amt := COALESCE((v_ing->'food_item_snapshot'->>'reference_amount')::numeric, 100);
        v_ing_weight  := COALESCE((v_ing->>'weight_grams')::numeric, 0);

        IF v_ing_weight > 0 AND v_ing_ref_amt > 0 THEN
          v_ing_cals := COALESCE((v_ing->'food_item_snapshot'->>'calories')::numeric, 0);
          v_ing_fat  := COALESCE((v_ing->'food_item_snapshot'->>'fat_g')::numeric, 0);
          v_ing_carb := COALESCE((v_ing->'food_item_snapshot'->>'carb_g')::numeric, 0);
          v_ing_prot := COALESCE((v_ing->'food_item_snapshot'->>'protein_g')::numeric, 0);

          v_fi_calories  := v_fi_calories  + (v_ing_cals  / v_ing_ref_amt * v_ing_weight);
          v_fi_fat_g     := v_fi_fat_g     + (v_ing_fat   / v_ing_ref_amt * v_ing_weight);
          v_fi_carb_g    := v_fi_carb_g    + (v_ing_carb  / v_ing_ref_amt * v_ing_weight);
          v_fi_protein_g := v_fi_protein_g + (v_ing_prot  / v_ing_ref_amt * v_ing_weight);
        END IF;
      END LOOP;

      -- Normalisera till per 100g om vi har totalvikt
      IF v_total_weight > 0 THEN
        v_fi_calories  := ROUND(v_fi_calories  / v_total_weight * 100, 2);
        v_fi_fat_g     := ROUND(v_fi_fat_g     / v_total_weight * 100, 2);
        v_fi_carb_g    := ROUND(v_fi_carb_g    / v_total_weight * 100, 2);
        v_fi_protein_g := ROUND(v_fi_protein_g / v_total_weight * 100, 2);
      END IF;

      v_kcal_per_gram := CASE WHEN v_fi_calories > 0 THEN v_fi_calories / 100 ELSE NULL END;
    END IF;

    -- Hämta receptets faktiska namn (kan ha fått suffix vid namnkollision)
    SELECT name INTO v_recipe_name FROM recipes WHERE id = v_recipe_id;

    INSERT INTO food_items (
      user_id, name, source, shared_by,
      is_recipe, calories, fat_g, carb_g, protein_g,
      reference_unit, reference_amount,
      default_amount, default_unit, food_type,
      weight_grams, is_hidden,
      serving_unit, grams_per_piece,
      kcal_per_gram, kcal_per_unit,
      fat_per_unit, carb_per_unit, protein_per_unit
    )
    VALUES (
      v_uid, v_recipe_name, 'user', v_inv.sender_name,
      true, v_fi_calories, v_fi_fat_g, v_fi_carb_g, v_fi_protein_g,
      'g', 100,
      v_default_amount, v_default_unit, 'Solid',
      v_total_weight, false,
      v_serving_unit, v_grams_per_piece,
      v_kcal_per_gram, v_kcal_per_unit,
      v_fat_per_unit, v_carb_per_unit, v_protein_per_unit
    )
    RETURNING id INTO v_fi_id;

    -- Koppla food_item till receptet
    UPDATE recipes SET food_item_id = v_fi_id WHERE id = v_recipe_id;

    UPDATE share_invitations SET status = 'accepted', responded_at = now() WHERE id = p_invitation_id;
    RETURN jsonb_build_object(
      'success', true,
      'item_type', 'recipe',
      'recipe_id', v_recipe_id,
      'food_item_id', v_fi_id
    );

  ELSIF v_inv.item_type = 'food_list' THEN
    FOR v_item_row IN SELECT * FROM jsonb_array_elements(v_inv.snapshot->'items') LOOP
      BEGIN
        PERFORM _upsert_shared_food_item(v_item_row, v_uid, v_inv.sender_name);
        v_imported := v_imported + 1;
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
      END;
    END LOOP;
    UPDATE share_invitations SET status = 'accepted', responded_at = now() WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', true,
      'item_type', 'food_list',
      'imported_count', v_imported, 'skipped_count', v_skipped);

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'unknown_item_type');
  END IF;

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_accept_detected');
END;
$$;

COMMENT ON FUNCTION public.accept_share_invitation IS
  'Accepterar en delningsinbjudan. För recept skapas ett food_item med is_recipe=true
   kopplat till recipes.food_item_id. Sparformatet (per portion / per 100g) från
   originalet bevaras: default_unit, default_amount, serving_unit, grams_per_piece
   och kcal_per_unit sätts baserat på food_item_snapshot i inbjudan.';
