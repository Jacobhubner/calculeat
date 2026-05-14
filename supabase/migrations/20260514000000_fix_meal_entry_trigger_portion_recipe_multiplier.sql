-- Trigger calculate_meal_entry_item_nutrition beräknar fel multiplier för portionsformat-recept.
--
-- Problemet: för portion-format recipe foods gäller:
--   food_items.calories       = per 100g
--   food_items.weight_grams   = portionsvikten (t.ex. 233g för 1 portion pizzadeg)
--   food_items.grams_per_piece = portionsvikten (samma värde)
--   food_items.default_unit   = 'portion'
--
-- När användaren loggar "1 portion":
--   v_weight_grams = 1 * grams_per_piece = 233  (korrekt — faktisk vikt)
--   Gammal multiplier: v_weight_grams / food.weight_grams = 233 / 233 = 1  (FEL)
--   Rätt multiplier:   v_weight_grams / 100 = 233 / 100 = 2.33
--
-- Fix: detektera portion-format recept via default_unit='portion' och använd 100 som bas.
-- Alla andra livsmedel (g-baserade, ml-baserade, styck) berörs inte.

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

  IF TG_OP = 'INSERT' THEN
    NEW.snapshot_name                 := v_food_item.name;
    NEW.snapshot_energy_density_color := v_food_item.energy_density_color;
  END IF;

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

  -- Multiplier: skalas alltid mot den bas som calories/fat_g/carb_g/protein_g lagras per.
  --
  -- Portion-format recept (default_unit='portion'):
  --   calories lagras per 100g, bas = 100.
  --   weight_grams = portionsvikten — ska INTE användas som bas.
  --
  -- ml-livsmedel och g-livsmedel:
  --   weight_grams = gram-ekvivalenten av reference_amount — korrekt bas.
  --
  -- Fallback för gamla livsmedel utan weight_grams.
  IF v_food_item.default_unit = 'portion' THEN
    v_multiplier := v_weight_grams / 100.0;
  ELSIF v_food_item.weight_grams IS NOT NULL AND v_food_item.weight_grams > 0 THEN
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


-- Retroaktiv rättning av historiska meal_entry_items för portion-format recept.
-- Uppdaterar poster där calories sparades med fel multiplier (weight_grams/weight_grams=1)
-- istället för rätt multiplier (weight_grams/100).
UPDATE public.meal_entry_items mei
SET
  calories  = ROUND((fi.calories  * mei.weight_grams / 100.0)::numeric, 2),
  fat_g     = ROUND((fi.fat_g     * mei.weight_grams / 100.0)::numeric, 2),
  carb_g    = ROUND((fi.carb_g    * mei.weight_grams / 100.0)::numeric, 2),
  protein_g = ROUND((fi.protein_g * mei.weight_grams / 100.0)::numeric, 2)
FROM public.food_items fi
WHERE
  mei.food_item_id = fi.id
  AND fi.default_unit = 'portion'
  AND fi.is_recipe = true
  AND fi.weight_grams IS NOT NULL
  AND fi.weight_grams > 0
  AND mei.weight_grams IS NOT NULL
  AND mei.weight_grams > 0
  AND fi.calories IS NOT NULL
  AND fi.calories > 0
  -- Identifiera poster med fel multiplier: sparad calories stämmer med weight_grams/weight_grams-formeln
  AND ABS(mei.calories - fi.calories * (mei.weight_grams / fi.weight_grams))
        < 0.01 * GREATEST(ABS(fi.calories * (mei.weight_grams / fi.weight_grams)), 0.01)
  -- Säkerställ att rätt värde faktiskt skiljer sig (undviker no-op när weight_grams=100)
  AND ABS(
        (fi.calories * mei.weight_grams / 100.0) -
        (fi.calories * mei.weight_grams / fi.weight_grams)
      ) > 0.5;
