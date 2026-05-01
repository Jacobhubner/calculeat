-- Triggern calculate_meal_entry_item_nutrition beräknade multiplier fel för ml-livsmedel.
-- För default_unit='ml' (och andra icke-g enheter) användes:
--   v_multiplier := NEW.amount / default_amount  (t.ex. 5 dl / 100 = 0.05)
-- Istället för:
--   v_multiplier := v_weight_grams / weight_grams  (500g / 100g = 5)
-- Resultatet: kalorier blev 1/100 av rätt värde (2.35 istället för 235 kcal för 5 dl mjölk).
--
-- Fix: använd alltid v_weight_grams / food.weight_grams som multiplier när weight_grams är satt.
-- food.weight_grams = gram-ekvivalenten av reference_amount (t.ex. 100g för 100ml mjölk).

CREATE OR REPLACE FUNCTION public.calculate_meal_entry_item_nutrition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_food_item record;
  v_weight_grams numeric;
  v_multiplier numeric;
BEGIN
  SELECT * INTO v_food_item
  FROM public.food_items
  WHERE id = NEW.food_item_id;

  -- Capture snapshots on INSERT only — never overwrite on UPDATE
  IF TG_OP = 'INSERT' THEN
    NEW.snapshot_name                 := v_food_item.name;
    NEW.snapshot_energy_density_color := v_food_item.energy_density_color;
  END IF;

  -- Calculate weight in grams based on unit
  IF NEW.unit = 'g' THEN
    v_weight_grams := NEW.amount;
  ELSIF NEW.unit = 'kg' THEN
    v_weight_grams := NEW.amount * 1000;
  ELSIF NEW.unit = 'ml' AND v_food_item.ml_per_gram IS NOT NULL THEN
    v_weight_grams := NEW.amount / v_food_item.ml_per_gram;
  ELSIF NEW.unit = 'dl' AND v_food_item.ml_per_gram IS NOT NULL THEN
    v_weight_grams := (NEW.amount * 100) / v_food_item.ml_per_gram;
  ELSIF NEW.unit = 'msk' AND v_food_item.ml_per_gram IS NOT NULL THEN
    v_weight_grams := (NEW.amount * 15) / v_food_item.ml_per_gram;
  ELSIF NEW.unit = 'tsk' AND v_food_item.ml_per_gram IS NOT NULL THEN
    v_weight_grams := (NEW.amount * 5) / v_food_item.ml_per_gram;
  ELSIF v_food_item.grams_per_piece IS NOT NULL AND v_food_item.grams_per_piece > 0 THEN
    v_weight_grams := NEW.amount * v_food_item.grams_per_piece;
  ELSIF v_food_item.grams_per_unit IS NOT NULL AND v_food_item.grams_per_unit > 0 THEN
    v_weight_grams := NEW.amount * v_food_item.grams_per_unit;
  ELSE
    v_weight_grams := NEW.amount;
  END IF;

  NEW.weight_grams := v_weight_grams;

  -- Multiplier: alltid v_weight_grams / food.weight_grams när weight_grams är satt.
  -- food.weight_grams = gram-ekvivalenten av reference_amount (100g för 100ml-livsmedel).
  -- Fallback för gamla livsmedel utan weight_grams.
  IF v_food_item.weight_grams IS NOT NULL AND v_food_item.weight_grams > 0 THEN
    v_multiplier := v_weight_grams / v_food_item.weight_grams;
  ELSIF v_food_item.default_unit = 'g' THEN
    v_multiplier := v_weight_grams / NULLIF(v_food_item.default_amount, 0);
  ELSE
    v_multiplier := NEW.amount / NULLIF(v_food_item.default_amount, 0);
  END IF;

  NEW.calories  := v_food_item.calories  * v_multiplier;
  NEW.fat_g     := v_food_item.fat_g     * v_multiplier;
  NEW.carb_g    := v_food_item.carb_g    * v_multiplier;
  NEW.protein_g := v_food_item.protein_g * v_multiplier;

  RETURN NEW;
END;
$function$;
