-- Recept i delade listor fick aldrig ingredienssnapshots.
--
-- create_shared_list_recipe utelämnade snapshot_*-kolumnerna i sin INSERT,
-- trots att klienten skickar dem (RecipeCalculatorModal bygger samma payload
-- för alla receptvägar). Följden: snapshot = NULL ⇒ driftvarningen "Ett eller
-- flera livsmedel har uppdaterats" kunde aldrig visas för listrecept, och de
-- syntes heller inte i driftkontrollen på adminsidan.
--
-- Semantik: snapshot_* är livsmedlets värde PER 100 G. COALESCE mot
-- food_items är ett skyddsnät om en anropare skulle utelämna dem — bättre
-- ett korrekt serversatt värde än NULL, som tyst tystar varningen.
--
-- Kroppen är i övrigt oförändrad från den befintliga 11-parametersvarianten:
-- 100g/portion-grenarna, kcal_per_unit, energy_density_color och
-- total_weight_grams ligger kvar precis som förut.
--
-- DROP krävs eftersom p_nutrition inte får ha default (originalet saknar
-- det). DROP tar bort GRANTs, så de sätts om nedan — PostgREST ansluter som
-- 'authenticator' och behöver PUBLIC-granten, inte bara authenticated.
DROP FUNCTION IF EXISTS public.create_shared_list_recipe(
  uuid, text, integer, jsonb, jsonb, text, text, text[], jsonb, integer, integer
);

CREATE FUNCTION public.create_shared_list_recipe(
  p_shared_list_id     uuid,
  p_name               text,
  p_servings           integer,
  p_ingredients        jsonb,
  p_nutrition          jsonb,
  p_image_url          text    DEFAULT NULL,
  p_instructions       text    DEFAULT NULL,
  p_equipment          text[]  DEFAULT NULL,
  p_equipment_settings jsonb   DEFAULT NULL,
  p_prep_time_min      integer DEFAULT NULL,
  p_cook_time_min      integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id       uuid := auth.uid();
  v_is_member     boolean;
  v_food_item_id  uuid;
  v_recipe_id     uuid;
  v_save_as       text;
  v_ing           jsonb;
  v_ing_order     int := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'name_required');
  END IF;

  IF p_nutrition IS NOT NULL THEN
    v_save_as := COALESCE(p_nutrition->>'saveAs', 'portion');

    IF v_save_as = '100g' THEN
      INSERT INTO public.food_items (
        user_id, shared_list_id, is_recipe, name,
        default_amount, default_unit,
        calories, protein_g, carb_g, fat_g,
        weight_grams, kcal_per_gram, energy_density_color, food_type,
        reference_amount, reference_unit
      ) VALUES (
        NULL, p_shared_list_id, true, trim(p_name),
        100, 'g',
        (p_nutrition->'per100g'->>'calories')::numeric,
        (p_nutrition->'per100g'->>'protein')::numeric,
        (p_nutrition->'per100g'->>'carbs')::numeric,
        (p_nutrition->'per100g'->>'fat')::numeric,
        100,
        (p_nutrition->'per100g'->>'calories')::numeric / 100,
        p_nutrition->>'energyDensityColor',
        'Solid',
        100, 'g'
      )
      RETURNING id INTO v_food_item_id;
    ELSE
      INSERT INTO public.food_items (
        user_id, shared_list_id, is_recipe, name,
        default_amount, default_unit,
        calories, protein_g, carb_g, fat_g,
        weight_grams, kcal_per_gram, energy_density_color, food_type,
        grams_per_piece, serving_unit,
        kcal_per_unit, fat_per_unit, carb_per_unit, protein_per_unit,
        reference_amount, reference_unit
      ) VALUES (
        NULL, p_shared_list_id, true, trim(p_name),
        1, 'portion',
        (p_nutrition->'per100g'->>'calories')::numeric,
        (p_nutrition->'per100g'->>'protein')::numeric,
        (p_nutrition->'per100g'->>'carbs')::numeric,
        (p_nutrition->'per100g'->>'fat')::numeric,
        (p_nutrition->'perServing'->>'weight')::numeric,
        (p_nutrition->'per100g'->>'calories')::numeric / 100,
        p_nutrition->>'energyDensityColor',
        'Solid',
        (p_nutrition->'perServing'->>'weight')::numeric,
        'portion',
        (p_nutrition->'perServing'->>'calories')::numeric,
        (p_nutrition->'perServing'->>'fat')::numeric,
        (p_nutrition->'perServing'->>'carbs')::numeric,
        (p_nutrition->'perServing'->>'protein')::numeric,
        (p_nutrition->'perServing'->>'weight')::numeric,
        'g'
      )
      RETURNING id INTO v_food_item_id;
    END IF;
  END IF;

  INSERT INTO public.recipes (
    user_id, shared_list_id, created_by, name, servings,
    food_item_id, total_weight_grams,
    image_url, instructions, equipment, equipment_settings,
    prep_time_min, cook_time_min
  ) VALUES (
    NULL, p_shared_list_id, v_user_id, trim(p_name), p_servings,
    v_food_item_id,
    (p_nutrition->>'totalWeight')::numeric,
    p_image_url, p_instructions, p_equipment, p_equipment_settings,
    p_prep_time_min, p_cook_time_min
  )
  RETURNING id INTO v_recipe_id;

  FOR v_ing IN SELECT * FROM jsonb_array_elements(p_ingredients) LOOP
    INSERT INTO public.recipe_ingredients (
      recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order,
      snapshot_calories, snapshot_fat_g, snapshot_carb_g, snapshot_protein_g
    )
    SELECT
      v_recipe_id,
      (v_ing->>'food_item_id')::uuid,
      (v_ing->>'amount')::numeric,
      v_ing->>'unit',
      (v_ing->>'weight_grams')::numeric,
      v_ing_order,
      COALESCE((v_ing->>'snapshot_calories')::numeric,  fi.calories),
      COALESCE((v_ing->>'snapshot_fat_g')::numeric,     fi.fat_g),
      COALESCE((v_ing->>'snapshot_carb_g')::numeric,    fi.carb_g),
      COALESCE((v_ing->>'snapshot_protein_g')::numeric, fi.protein_g)
    FROM public.food_items fi
    WHERE fi.id = (v_ing->>'food_item_id')::uuid;

    v_ing_order := v_ing_order + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'recipe_id', v_recipe_id,
    'food_item_id', v_food_item_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_shared_list_recipe(uuid, text, integer, jsonb, jsonb, text, text, text[], jsonb, integer, integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_shared_list_recipe(uuid, text, integer, jsonb, jsonb, text, text, text[], jsonb, integer, integer) TO public;
GRANT  EXECUTE ON FUNCTION public.create_shared_list_recipe(uuid, text, integer, jsonb, jsonb, text, text, text[], jsonb, integer, integer) TO authenticated;
