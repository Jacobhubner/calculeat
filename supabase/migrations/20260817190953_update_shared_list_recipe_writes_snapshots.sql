-- update_shared_list_recipe skrev inte heller snapshot_*-kolumnerna.
-- Eftersom den DELETE:ar och återskapar alla ingredienser vid varje sparning
-- skulle den dessutom ha nollat snapshots som create nu sätter korrekt.
--
-- Kroppen är oförändrad från den befintliga versionen så när som på
-- ingrediens-INSERT:en längst ned. snapshot_* är livsmedlets värde PER 100 G.
CREATE OR REPLACE FUNCTION public.update_shared_list_recipe(
  p_recipe_id uuid,
  p_fields    jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id       uuid := auth.uid();
  v_list_id       uuid;
  v_food_item_id  uuid;
  v_is_member     boolean;
  v_save_as       text;
  v_ing           jsonb;
  v_ing_order     int := 0;
BEGIN
  SELECT shared_list_id, food_item_id
  INTO v_list_id, v_food_item_id
  FROM public.recipes
  WHERE id = p_recipe_id
    AND shared_list_id IS NOT NULL
    AND user_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'recipe_not_found_or_not_list_recipe');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = v_list_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  IF v_food_item_id IS NOT NULL AND p_fields ? 'nutrition' THEN
    v_save_as := COALESCE(p_fields->>'saveAs', 'portion');

    IF v_save_as = '100g' THEN
      UPDATE public.food_items SET
        name             = COALESCE(p_fields->>'name', name),
        default_amount   = 100,
        default_unit     = 'g',
        calories         = (p_fields->'nutrition'->'per100g'->>'calories')::numeric,
        protein_g        = (p_fields->'nutrition'->'per100g'->>'protein')::numeric,
        carb_g           = (p_fields->'nutrition'->'per100g'->>'carbs')::numeric,
        fat_g            = (p_fields->'nutrition'->'per100g'->>'fat')::numeric,
        weight_grams     = 100,
        kcal_per_gram    = (p_fields->'nutrition'->'per100g'->>'calories')::numeric / 100,
        energy_density_color = p_fields->'nutrition'->>'energyDensityColor',
        grams_per_piece  = NULL,
        serving_unit     = NULL,
        kcal_per_unit    = NULL,
        fat_per_unit     = NULL,
        carb_per_unit    = NULL,
        protein_per_unit = NULL,
        updated_at       = now()
      WHERE id = v_food_item_id;
    ELSE
      UPDATE public.food_items SET
        name             = COALESCE(p_fields->>'name', name),
        default_amount   = 1,
        default_unit     = 'portion',
        calories         = (p_fields->'nutrition'->'per100g'->>'calories')::numeric,
        protein_g        = (p_fields->'nutrition'->'per100g'->>'protein')::numeric,
        carb_g           = (p_fields->'nutrition'->'per100g'->>'carbs')::numeric,
        fat_g            = (p_fields->'nutrition'->'per100g'->>'fat')::numeric,
        weight_grams     = (p_fields->'nutrition'->'perServing'->>'weight')::numeric,
        kcal_per_gram    = (p_fields->'nutrition'->'per100g'->>'calories')::numeric / 100,
        energy_density_color = p_fields->'nutrition'->>'energyDensityColor',
        grams_per_piece  = (p_fields->'nutrition'->'perServing'->>'weight')::numeric,
        serving_unit     = 'portion',
        kcal_per_unit    = (p_fields->'nutrition'->'perServing'->>'calories')::numeric,
        fat_per_unit     = (p_fields->'nutrition'->'perServing'->>'fat')::numeric,
        carb_per_unit    = (p_fields->'nutrition'->'perServing'->>'carbs')::numeric,
        protein_per_unit = (p_fields->'nutrition'->'perServing'->>'protein')::numeric,
        updated_at       = now()
      WHERE id = v_food_item_id;
    END IF;
  END IF;

  UPDATE public.recipes SET
    name               = COALESCE(p_fields->>'name',                name),
    servings           = COALESCE((p_fields->>'servings')::integer,  servings),
    total_weight_grams = COALESCE((p_fields->'nutrition'->>'totalWeight')::numeric, total_weight_grams),
    image_url          = CASE WHEN p_fields ? 'image_url'      THEN p_fields->>'image_url'      ELSE image_url      END,
    instructions       = CASE WHEN p_fields ? 'instructions'   THEN p_fields->>'instructions'   ELSE instructions   END,
    equipment          = CASE WHEN p_fields ? 'equipment'      THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'equipment')) ELSE equipment END,
    prep_time_min      = CASE WHEN p_fields ? 'prep_time_min'  THEN (p_fields->>'prep_time_min')::integer  ELSE prep_time_min  END,
    cook_time_min      = CASE WHEN p_fields ? 'cook_time_min'  THEN (p_fields->>'cook_time_min')::integer  ELSE cook_time_min  END,
    updated_at         = now()
  WHERE id = p_recipe_id;

  IF p_fields ? 'ingredients' THEN
    DELETE FROM public.recipe_ingredients WHERE recipe_id = p_recipe_id;

    FOR v_ing IN SELECT * FROM jsonb_array_elements(p_fields->'ingredients') LOOP
      INSERT INTO public.recipe_ingredients (
        recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order,
        snapshot_calories, snapshot_fat_g, snapshot_carb_g, snapshot_protein_g
      )
      SELECT
        p_recipe_id,
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
  END IF;

  RETURN jsonb_build_object('success', true, 'recipe_id', p_recipe_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.update_shared_list_recipe(uuid, jsonb) FROM anon;
GRANT  EXECUTE ON FUNCTION public.update_shared_list_recipe(uuid, jsonb) TO public;
GRANT  EXECUTE ON FUNCTION public.update_shared_list_recipe(uuid, jsonb) TO authenticated;
