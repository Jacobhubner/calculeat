-- Uppdatera create_shared_list_recipe med stöd för nya detaljfält
CREATE OR REPLACE FUNCTION public.create_shared_list_recipe(
  p_shared_list_id  uuid,
  p_name            text,
  p_servings        integer,
  p_ingredients     jsonb,
  p_nutrition       jsonb,
  p_image_url       text    DEFAULT NULL,
  p_instructions    text    DEFAULT NULL,
  p_equipment       text[]  DEFAULT NULL,
  p_prep_time_min   integer DEFAULT NULL,
  p_cook_time_min   integer DEFAULT NULL
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
  -- Verifiera listmedlemskap
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

  -- Skapa food_item för receptet (om nutritionsdata finns)
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
      -- portion-format
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
        (p_nutrition->'perServing'->>'calories')::numeric,
        (p_nutrition->'perServing'->>'protein')::numeric,
        (p_nutrition->'perServing'->>'carbs')::numeric,
        (p_nutrition->'perServing'->>'fat')::numeric,
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

  -- Skapa receptet med nya detaljfält
  INSERT INTO public.recipes (
    user_id, shared_list_id, created_by, name, servings,
    food_item_id, total_weight_grams,
    image_url, instructions, equipment, prep_time_min, cook_time_min
  ) VALUES (
    NULL, p_shared_list_id, v_user_id, trim(p_name), p_servings,
    v_food_item_id,
    (p_nutrition->>'totalWeight')::numeric,
    p_image_url, p_instructions, p_equipment, p_prep_time_min, p_cook_time_min
  )
  RETURNING id INTO v_recipe_id;

  -- Lägg till ingredienser
  FOR v_ing IN SELECT * FROM jsonb_array_elements(p_ingredients) LOOP
    INSERT INTO public.recipe_ingredients (
      recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order
    ) VALUES (
      v_recipe_id,
      (v_ing->>'food_item_id')::uuid,
      (v_ing->>'amount')::numeric,
      v_ing->>'unit',
      (v_ing->>'weight_grams')::numeric,
      v_ing_order
    );
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


-- Uppdatera update_shared_list_recipe med stöd för nya detaljfält
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
  -- Hämta list_id och food_item_id, verifiera att det är ett list-recept
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

  -- Uppdatera food_item om det finns och nutrition-data skickades
  IF v_food_item_id IS NOT NULL AND p_fields ? 'nutrition' THEN
    v_save_as := COALESCE(p_fields->>'saveAs', 'portion');

    IF v_save_as = '100g' THEN
      UPDATE public.food_items SET
        name            = COALESCE(p_fields->>'name', name),
        default_amount  = 100,
        default_unit    = 'g',
        calories        = (p_fields->'nutrition'->'per100g'->>'calories')::numeric,
        protein_g       = (p_fields->'nutrition'->'per100g'->>'protein')::numeric,
        carb_g          = (p_fields->'nutrition'->'per100g'->>'carbs')::numeric,
        fat_g           = (p_fields->'nutrition'->'per100g'->>'fat')::numeric,
        weight_grams    = 100,
        kcal_per_gram   = (p_fields->'nutrition'->'per100g'->>'calories')::numeric / 100,
        energy_density_color = p_fields->'nutrition'->>'energyDensityColor',
        grams_per_piece = NULL,
        serving_unit    = NULL,
        kcal_per_unit   = NULL,
        fat_per_unit    = NULL,
        carb_per_unit   = NULL,
        protein_per_unit= NULL,
        updated_at      = now()
      WHERE id = v_food_item_id;
    ELSE
      UPDATE public.food_items SET
        name            = COALESCE(p_fields->>'name', name),
        default_amount  = 1,
        default_unit    = 'portion',
        calories        = (p_fields->'nutrition'->'perServing'->>'calories')::numeric,
        protein_g       = (p_fields->'nutrition'->'perServing'->>'protein')::numeric,
        carb_g          = (p_fields->'nutrition'->'perServing'->>'carbs')::numeric,
        fat_g           = (p_fields->'nutrition'->'perServing'->>'fat')::numeric,
        weight_grams    = (p_fields->'nutrition'->'perServing'->>'weight')::numeric,
        kcal_per_gram   = (p_fields->'nutrition'->'per100g'->>'calories')::numeric / 100,
        energy_density_color = p_fields->'nutrition'->>'energyDensityColor',
        grams_per_piece = (p_fields->'nutrition'->'perServing'->>'weight')::numeric,
        serving_unit    = 'portion',
        kcal_per_unit   = (p_fields->'nutrition'->'perServing'->>'calories')::numeric,
        fat_per_unit    = (p_fields->'nutrition'->'perServing'->>'fat')::numeric,
        carb_per_unit   = (p_fields->'nutrition'->'perServing'->>'carbs')::numeric,
        protein_per_unit= (p_fields->'nutrition'->'perServing'->>'protein')::numeric,
        updated_at      = now()
      WHERE id = v_food_item_id;
    END IF;
  END IF;

  -- Uppdatera receptet inkl. nya detaljfält
  UPDATE public.recipes SET
    name               = COALESCE(p_fields->>'name',                name),
    servings           = COALESCE((p_fields->>'servings')::integer,  servings),
    total_weight_grams = COALESCE((p_fields->'nutrition'->>'totalWeight')::numeric, total_weight_grams),
    image_url          = CASE WHEN p_fields ? 'image_url'
                              THEN p_fields->>'image_url'
                              ELSE image_url END,
    instructions       = CASE WHEN p_fields ? 'instructions'
                              THEN p_fields->>'instructions'
                              ELSE instructions END,
    equipment          = CASE WHEN p_fields ? 'equipment'
                              THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'equipment'))
                              ELSE equipment END,
    prep_time_min      = CASE WHEN p_fields ? 'prep_time_min'
                              THEN (p_fields->>'prep_time_min')::integer
                              ELSE prep_time_min END,
    cook_time_min      = CASE WHEN p_fields ? 'cook_time_min'
                              THEN (p_fields->>'cook_time_min')::integer
                              ELSE cook_time_min END,
    updated_at         = now()
  WHERE id = p_recipe_id;

  -- Uppdatera ingredienser om de skickades
  IF p_fields ? 'ingredients' THEN
    DELETE FROM public.recipe_ingredients WHERE recipe_id = p_recipe_id;

    FOR v_ing IN SELECT * FROM jsonb_array_elements(p_fields->'ingredients') LOOP
      INSERT INTO public.recipe_ingredients (
        recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order
      ) VALUES (
        p_recipe_id,
        (v_ing->>'food_item_id')::uuid,
        (v_ing->>'amount')::numeric,
        v_ing->>'unit',
        (v_ing->>'weight_grams')::numeric,
        v_ing_order
      );
      v_ing_order := v_ing_order + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'recipe_id', p_recipe_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
