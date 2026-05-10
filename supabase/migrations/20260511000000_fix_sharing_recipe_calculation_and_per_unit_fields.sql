-- Fix 1: accept_share_invitation — korrekt kalorieberäkning för portion-recept
-- Receptets food_item lagrar per-100g i calories/fat_g/carb_g/protein_g.
-- Den gamla koden räknade om dessa felaktigt via grams_per_piece.
-- Nu läses per-100g direkt, och kcal_per_unit beräknas från snapshot eller fallback grams_per_piece.
CREATE OR REPLACE FUNCTION public.accept_share_invitation(p_invitation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_nutrient     jsonb;

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

  v_default_unit          text    := 'g';
  v_default_amount        numeric := 100;
  v_reference_unit        text    := 'g';
  v_reference_amount      numeric := 100;
  v_food_type             text    := 'Solid';
  v_serving_unit          text    := NULL;
  v_grams_per_piece       numeric := NULL;
  v_ml_per_gram           numeric := NULL;
  v_density_g_per_ml      numeric := NULL;
  v_notes                 text    := NULL;
  v_brand                 text    := NULL;
  v_barcode               text    := NULL;
  v_kcal_per_gram         numeric := NULL;
  v_kcal_per_unit         numeric := NULL;
  v_fat_per_unit          numeric := NULL;
  v_carb_per_unit         numeric := NULL;
  v_protein_per_unit      numeric := NULL;
  v_energy_density_color  text    := NULL;
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

    FOR v_ing IN SELECT * FROM jsonb_array_elements(v_inv.snapshot->'ingredients') LOOP
      v_ing_food_id := _upsert_shared_food_item(v_ing->'food_item_snapshot', v_uid, v_inv.sender_name);
      INSERT INTO recipe_ingredients(
        recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order,
        snapshot_calories, snapshot_fat_g, snapshot_carb_g, snapshot_protein_g
      )
      VALUES (
        v_recipe_id, v_ing_food_id,
        (v_ing->>'amount')::numeric, v_ing->>'unit',
        (v_ing->>'weight_grams')::numeric, (v_ing->>'ingredient_order')::int,
        (v_ing->'food_item_snapshot'->>'calories')::numeric,
        (v_ing->'food_item_snapshot'->>'fat_g')::numeric,
        (v_ing->'food_item_snapshot'->>'carb_g')::numeric,
        (v_ing->'food_item_snapshot'->>'protein_g')::numeric
      );
    END LOOP;

    v_fi_snap := v_inv.snapshot->'food_item_snapshot';

    IF v_fi_snap IS NOT NULL AND v_fi_snap != 'null'::jsonb THEN
      -- Receptets food_item lagrar alltid per-100g i calories/fat_g/carb_g/protein_g.
      -- Läs dessa direkt utan omräkning.
      v_fi_calories       := COALESCE((v_fi_snap->>'calories')::numeric, 0);
      v_fi_fat_g          := COALESCE((v_fi_snap->>'fat_g')::numeric, 0);
      v_fi_carb_g         := COALESCE((v_fi_snap->>'carb_g')::numeric, 0);
      v_fi_protein_g      := COALESCE((v_fi_snap->>'protein_g')::numeric, 0);
      v_total_weight      := COALESCE((v_fi_snap->>'weight_grams')::numeric,
                                       (v_inv.snapshot->>'total_weight_grams')::numeric, 100);

      v_default_unit      := COALESCE(v_fi_snap->>'default_unit', 'g');
      v_default_amount    := COALESCE((v_fi_snap->>'default_amount')::numeric, 100);
      v_reference_unit    := COALESCE(v_fi_snap->>'reference_unit', 'g');
      v_reference_amount  := COALESCE((v_fi_snap->>'reference_amount')::numeric, 100);
      v_food_type         := COALESCE(v_fi_snap->>'food_type', 'Solid');
      v_serving_unit      := v_fi_snap->>'serving_unit';
      v_grams_per_piece   := (v_fi_snap->>'grams_per_piece')::numeric;
      v_ml_per_gram       := (v_fi_snap->>'ml_per_gram')::numeric;
      v_density_g_per_ml  := (v_fi_snap->>'density_g_per_ml')::numeric;
      v_notes             := NULLIF(v_fi_snap->>'notes', '');
      v_brand             := NULLIF(v_fi_snap->>'brand', '');
      v_barcode           := NULLIF(v_fi_snap->>'barcode', '');
      v_energy_density_color := v_fi_snap->>'energy_density_color';

      v_kcal_per_gram := v_fi_calories / 100;

      -- Läs per-unit direkt från snapshot (satt av send_share_invitation från DB)
      v_kcal_per_unit    := (v_fi_snap->>'kcal_per_unit')::numeric;
      v_fat_per_unit     := (v_fi_snap->>'fat_per_unit')::numeric;
      v_carb_per_unit    := (v_fi_snap->>'carb_per_unit')::numeric;
      v_protein_per_unit := (v_fi_snap->>'protein_per_unit')::numeric;

      -- Fallback: beräkna från grams_per_piece om saknas i snapshot
      IF v_kcal_per_unit IS NULL AND v_grams_per_piece IS NOT NULL AND v_grams_per_piece > 0 THEN
        v_kcal_per_unit    := ROUND(v_fi_calories  / 100 * v_grams_per_piece, 2);
        v_fat_per_unit     := ROUND(v_fi_fat_g     / 100 * v_grams_per_piece, 2);
        v_carb_per_unit    := ROUND(v_fi_carb_g    / 100 * v_grams_per_piece, 2);
        v_protein_per_unit := ROUND(v_fi_protein_g / 100 * v_grams_per_piece, 2);
      END IF;

    ELSE
      -- Inget food_item_snapshot: räkna om per-100g från ingredienser
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

      IF v_total_weight > 0 THEN
        v_fi_calories  := ROUND(v_fi_calories  / v_total_weight * 100, 2);
        v_fi_fat_g     := ROUND(v_fi_fat_g     / v_total_weight * 100, 2);
        v_fi_carb_g    := ROUND(v_fi_carb_g    / v_total_weight * 100, 2);
        v_fi_protein_g := ROUND(v_fi_protein_g / v_total_weight * 100, 2);
      END IF;

      v_kcal_per_gram := CASE WHEN v_fi_calories > 0 THEN v_fi_calories / 100 ELSE NULL END;
    END IF;

    SELECT name INTO v_recipe_name FROM recipes WHERE id = v_recipe_id;

    INSERT INTO food_items (
      user_id, name, source, shared_by,
      is_recipe, calories, fat_g, carb_g, protein_g,
      reference_unit, reference_amount,
      default_amount, default_unit, food_type,
      weight_grams, is_hidden,
      serving_unit, grams_per_piece,
      ml_per_gram, density_g_per_ml,
      notes, brand, barcode,
      kcal_per_gram, kcal_per_unit,
      fat_per_unit, carb_per_unit, protein_per_unit,
      energy_density_color
    )
    VALUES (
      v_uid, v_recipe_name, 'user', v_inv.sender_name,
      true, v_fi_calories, v_fi_fat_g, v_fi_carb_g, v_fi_protein_g,
      v_reference_unit, v_reference_amount,
      v_default_amount, v_default_unit, v_food_type,
      v_total_weight, false,
      v_serving_unit, v_grams_per_piece,
      v_ml_per_gram, v_density_g_per_ml,
      v_notes, v_brand, v_barcode,
      v_kcal_per_gram, v_kcal_per_unit,
      v_fat_per_unit, v_carb_per_unit, v_protein_per_unit,
      v_energy_density_color
    )
    RETURNING id INTO v_fi_id;

    -- Kopiera extended nutrients från food_item_snapshot.nutrients
    IF v_fi_snap IS NOT NULL
       AND v_fi_snap != 'null'::jsonb
       AND v_fi_snap->'nutrients' IS NOT NULL
       AND jsonb_array_length(v_fi_snap->'nutrients') > 0
    THEN
      FOR v_nutrient IN
        SELECT * FROM jsonb_array_elements(v_fi_snap->'nutrients')
      LOOP
        INSERT INTO public.food_nutrients (
          food_item_id, nutrient_code, amount, unit,
          reference_amount, reference_unit
        )
        VALUES (
          v_fi_id,
          v_nutrient->>'nutrient_code',
          (v_nutrient->>'amount')::numeric,
          COALESCE(v_nutrient->>'unit', 'g'),
          COALESCE((v_nutrient->>'reference_amount')::numeric, 100),
          COALESCE(v_nutrient->>'reference_unit', 'g')
        )
        ON CONFLICT (food_item_id, nutrient_code) DO NOTHING;
      END LOOP;
    END IF;

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
$function$;


-- Fix 2: send_share_invitation — inkludera kcal_per_unit m.fl. i snapshottet
CREATE OR REPLACE FUNCTION public.send_share_invitation(p_item_id uuid, p_item_type text, p_recipient_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
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
  v_item_name       text;
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

    v_item_name := v_food_item.name;

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
    WHERE fn.food_item_id = p_item_id;

    v_item_snapshot := jsonb_build_object(
      'name',                  v_food_item.name,
      'calories',              v_food_item.calories,
      'fat_g',                 v_food_item.fat_g,
      'carb_g',                v_food_item.carb_g,
      'protein_g',             v_food_item.protein_g,
      'reference_unit',        v_food_item.reference_unit,
      'reference_amount',      v_food_item.reference_amount,
      'default_amount',        v_food_item.default_amount,
      'default_unit',          v_food_item.default_unit,
      'food_type',             v_food_item.food_type,
      'ml_per_gram',           v_food_item.ml_per_gram,
      'grams_per_piece',       v_food_item.grams_per_piece,
      'serving_unit',          v_food_item.serving_unit,
      'density_g_per_ml',      v_food_item.density_g_per_ml,
      'notes',                 v_food_item.notes,
      'brand',                 v_food_item.brand,
      'barcode',               v_food_item.barcode,
      'weight_grams',          v_food_item.weight_grams,
      'energy_density_color',  v_food_item.energy_density_color,
      'kcal_per_unit',         v_food_item.kcal_per_unit,
      'fat_per_unit',          v_food_item.fat_per_unit,
      'carb_per_unit',         v_food_item.carb_per_unit,
      'protein_per_unit',      v_food_item.protein_per_unit,
      'is_global',             false,
      'original_food_item_id', NULL,
      'nutrients',             v_nutrients_arr
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

    v_item_name := v_recipe.name;

    FOR v_ingredient IN
      SELECT
        ri.amount, ri.unit, ri.weight_grams, ri.ingredient_order,
        fi.id AS fi_id, fi.name, fi.calories, fi.fat_g, fi.carb_g,
        fi.protein_g, fi.reference_unit, fi.reference_amount,
        fi.default_amount, fi.default_unit, fi.food_type,
        fi.ml_per_gram, fi.grams_per_piece, fi.serving_unit,
        fi.density_g_per_ml, fi.notes, fi.brand, fi.barcode,
        fi.weight_grams AS fi_weight_grams, fi.user_id AS fi_user_id,
        fi.energy_density_color AS fi_energy_density_color,
        fi.kcal_per_unit AS fi_kcal_per_unit,
        fi.fat_per_unit AS fi_fat_per_unit,
        fi.carb_per_unit AS fi_carb_per_unit,
        fi.protein_per_unit AS fi_protein_per_unit
      FROM public.recipe_ingredients ri
      JOIN public.food_items fi ON fi.id = ri.food_item_id
      WHERE ri.recipe_id = p_item_id
      ORDER BY ri.ingredient_order
    LOOP
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
        'name',                  v_ingredient.name,
        'calories',              v_ingredient.calories,
        'fat_g',                 v_ingredient.fat_g,
        'carb_g',                v_ingredient.carb_g,
        'protein_g',             v_ingredient.protein_g,
        'reference_unit',        v_ingredient.reference_unit,
        'reference_amount',      v_ingredient.reference_amount,
        'default_amount',        v_ingredient.default_amount,
        'default_unit',          v_ingredient.default_unit,
        'food_type',             v_ingredient.food_type,
        'ml_per_gram',           v_ingredient.ml_per_gram,
        'grams_per_piece',       v_ingredient.grams_per_piece,
        'serving_unit',          v_ingredient.serving_unit,
        'density_g_per_ml',      v_ingredient.density_g_per_ml,
        'notes',                 v_ingredient.notes,
        'brand',                 v_ingredient.brand,
        'barcode',               v_ingredient.barcode,
        'weight_grams',          v_ingredient.fi_weight_grams,
        'energy_density_color',  v_ingredient.fi_energy_density_color,
        'kcal_per_unit',         v_ingredient.fi_kcal_per_unit,
        'fat_per_unit',          v_ingredient.fi_fat_per_unit,
        'carb_per_unit',         v_ingredient.fi_carb_per_unit,
        'protein_per_unit',      v_ingredient.fi_protein_per_unit,
        'is_global',             (v_ingredient.fi_user_id IS NULL),
        'original_food_item_id', CASE
          WHEN v_ingredient.fi_user_id IS NULL THEN v_ingredient.fi_id
          ELSE NULL
        END,
        'nutrients',             v_nutrients_arr
      );

      v_ing_snap := jsonb_build_object(
        'amount',             v_ingredient.amount,
        'unit',               v_ingredient.unit,
        'weight_grams',       v_ingredient.weight_grams,
        'ingredient_order',   v_ingredient.ingredient_order,
        'food_item_snapshot', v_fi_snap
      );
      v_ingredients_arr := v_ingredients_arr || jsonb_build_array(v_ing_snap);
    END LOOP;

    v_fi_snap := NULL;
    IF v_recipe.food_item_id IS NOT NULL THEN
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
        'name',                  fi.name,
        'calories',              fi.calories,
        'fat_g',                 fi.fat_g,
        'carb_g',                fi.carb_g,
        'protein_g',             fi.protein_g,
        'reference_unit',        fi.reference_unit,
        'reference_amount',      fi.reference_amount,
        'default_amount',        fi.default_amount,
        'default_unit',          fi.default_unit,
        'food_type',             fi.food_type,
        'ml_per_gram',           fi.ml_per_gram,
        'grams_per_piece',       fi.grams_per_piece,
        'serving_unit',          fi.serving_unit,
        'density_g_per_ml',      fi.density_g_per_ml,
        'notes',                 fi.notes,
        'brand',                 fi.brand,
        'barcode',               fi.barcode,
        'weight_grams',          fi.weight_grams,
        'energy_density_color',  fi.energy_density_color,
        'kcal_per_unit',         fi.kcal_per_unit,
        'fat_per_unit',          fi.fat_per_unit,
        'carb_per_unit',         fi.carb_per_unit,
        'protein_per_unit',      fi.protein_per_unit,
        'is_global',             (fi.user_id IS NULL),
        'original_food_item_id', CASE WHEN fi.user_id IS NULL THEN fi.id ELSE NULL END,
        'nutrients',             v_nutrients_arr
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

  IF v_invitation_id IS NOT NULL AND v_recipient_id IS NOT NULL THEN
    PERFORM internal_create_notification(
      v_recipient_id,
      v_sender_id,
      'share_invitation_received',
      p_item_type,
      v_invitation_id,
      v_sender_name || ' delar ' || CASE WHEN p_item_type = 'recipe' THEN 'ett recept' ELSE 'ett livsmedel' END || ': ' || v_item_name
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'invitation_id', v_invitation_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
