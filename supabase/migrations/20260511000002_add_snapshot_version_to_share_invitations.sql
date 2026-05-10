-- Lägg till snapshot_version: 1 i alla nya snapshots från send_share_invitation.
-- Version 1 = nuvarande schema med:
--   - nutrients-array i food_item_snapshot
--   - kcal_per_unit/fat_per_unit/carb_per_unit/protein_per_unit i food_item_snapshot
--   - snapshot_version-fält
--
-- accept_share_invitation behöver inte ändras nu — den läser fält via ->>'field'
-- vilket returnerar NULL för okända/saknade fält, och fallbacks hanterar NULL.
-- Om breaking changes görs i framtiden: lägg till version-check i accept-funktionen.

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
      'snapshot_version',      1,
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
        'snapshot_version',      1,
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
        'snapshot_version',      1,
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
      'snapshot_version', 1,
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
