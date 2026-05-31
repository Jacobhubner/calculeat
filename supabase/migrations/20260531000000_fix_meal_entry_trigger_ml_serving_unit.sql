-- Fix: calculate_meal_entry_item_nutrition used the wrong formula for ml-products
-- with density (ml_per_gram) and a serving unit (grams_per_piece stores ml, not grams).
--
-- Bug: serving-unit branch stored ml in v_weight_grams (e.g. 500 for a 500ml carton),
-- then divided by food.weight_grams which is the gram-equivalent of reference_amount
-- (e.g. 103.73g for 100ml milk at density 0.964). This caused a unit mismatch:
--   WRONG: multiplier = 500ml / 103.73g = 4.82  → 51 * 4.82 = 245.8 kcal
--   RIGHT: multiplier = 518.7g / 103.73g = 5.0  → 51 * 5.0  = 255.0 kcal
--
-- Fix: when grams_per_piece stores ml (ml-product with density), convert to gram first.
-- All other products (g-products, ml-products without density) are unaffected.

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
    IF v_food_item.default_unit = 'ml' AND v_food_item.ml_per_gram IS NOT NULL THEN
      -- grams_per_piece stores ml for ml-products; convert to gram to preserve weight_grams invariant
      v_weight_grams := NEW.amount * v_food_item.grams_per_piece / v_food_item.ml_per_gram;
    ELSE
      v_weight_grams := NEW.amount * v_food_item.grams_per_piece;
    END IF;
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


-- Retroaktiv rättning av historiska meal_entry_items för ml-produkter med densitet
-- och serving-enhet. Dessa poster har fel weight_grams (ml istället för gram) och
-- fel kalorier (densitetsfaktorn applicerades en extra gång).
--
-- Identifieringskriterium: unit inte i (g,kg,ml,dl,msk,tsk) OCH food.default_unit='ml'
-- OCH food.ml_per_gram IS NOT NULL OCH food.grams_per_piece IS NOT NULL.
-- OBS: Identifieringen baseras på ett systematiskt felmönster, inte en explicit buggmarkör.
-- Alla träffar representerar poster som skapades av den felaktiga trigger-logiken.
-- Manuellt korrigerade undantag (osannolikt) skrivs om — accepterat.
UPDATE public.meal_entry_items mei
SET
  weight_grams = ROUND((mei.amount * fi.grams_per_piece / fi.ml_per_gram)::numeric, 4),
  calories     = ROUND((fi.calories  * (mei.amount * fi.grams_per_piece / fi.ml_per_gram) / fi.weight_grams)::numeric, 2),
  fat_g        = ROUND((fi.fat_g     * (mei.amount * fi.grams_per_piece / fi.ml_per_gram) / fi.weight_grams)::numeric, 4),
  carb_g       = ROUND((fi.carb_g    * (mei.amount * fi.grams_per_piece / fi.ml_per_gram) / fi.weight_grams)::numeric, 4),
  protein_g    = ROUND((fi.protein_g * (mei.amount * fi.grams_per_piece / fi.ml_per_gram) / fi.weight_grams)::numeric, 4)
FROM public.food_items fi
WHERE
  mei.food_item_id       = fi.id
  AND fi.default_unit    = 'ml'
  AND fi.ml_per_gram     IS NOT NULL
  AND fi.ml_per_gram     > 0
  AND fi.grams_per_piece IS NOT NULL
  AND fi.grams_per_piece > 0
  AND fi.weight_grams    IS NOT NULL
  AND fi.weight_grams    > 0
  AND mei.unit NOT IN ('g', 'kg', 'ml', 'dl', 'msk', 'tsk')
  AND mei.amount         > 0;
