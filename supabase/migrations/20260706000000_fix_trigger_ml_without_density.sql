-- Triggern beräknar fel kalorier för ml-livsmedel (default_unit='ml') som saknar ml_per_gram.
--
-- Exempel: Mjölk Röd - Arla (59 kcal/100ml, default_unit='ml', ml_per_gram=NULL, weight_grams=103)
-- Användaren loggar 5 dl:
--   v_weight_grams faller till ELSE: v_weight_grams = 5 (dl-siffra, inte ml)
--   Multiplier-gren: weight_grams=103 → v_multiplier = 5/103 = 0.0485
--   Kalorier: 59 * 0.0485 = 2.86 kcal (FEL — ska vara 295 kcal)
--
-- Rätt logik (matchar TS-koden i nutritionFromUnit.ts):
--   5 dl = 500 ml, ratio = 500/reference_amount(100) = 5, kalorier = 59 * 5 = 295 kcal
--
-- Två fel att fixa:
-- 1. ELSIF-kedjan hanterar inte dl/ml/msk/tsk när ml_per_gram IS NULL
-- 2. Multiplier-logiken använder weight_grams som bas för ml-livsmedel — fel när
--    weight_grams representerar densiteten (103g/100ml) snarare än gram-ekvivalenten.
--
-- Fix: för default_unit='ml' använd alltid reference_amount som multiplikatorbas.
-- Prioritera ml_per_gram för volym→gram-konvertering; utan densitet behandla ml≡gram.

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

  -- Beräkna v_weight_grams (gram-ekvivalent av loggad mängd)
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
  -- ml-livsmedel utan densitet: ml behandlas som gram (TS-koden gör detsamma)
  ELSIF NEW.unit = 'ml' AND v_food_item.default_unit = 'ml' THEN
    v_weight_grams := NEW.amount;
  ELSIF NEW.unit = 'dl' AND v_food_item.default_unit = 'ml' THEN
    v_weight_grams := NEW.amount * 100;
  ELSIF NEW.unit = 'msk' AND v_food_item.default_unit = 'ml' THEN
    v_weight_grams := NEW.amount * 15;
  ELSIF NEW.unit = 'tsk' AND v_food_item.default_unit = 'ml' THEN
    v_weight_grams := NEW.amount * 5;
  ELSIF v_food_item.grams_per_piece IS NOT NULL AND v_food_item.grams_per_piece > 0 THEN
    v_weight_grams := NEW.amount * v_food_item.grams_per_piece;
  ELSIF v_food_item.grams_per_unit IS NOT NULL AND v_food_item.grams_per_unit > 0 THEN
    v_weight_grams := NEW.amount * v_food_item.grams_per_unit;
  ELSE
    v_weight_grams := NEW.amount;
  END IF;

  NEW.weight_grams := v_weight_grams;

  -- Beräkna multiplier mot rätt bas.
  -- ml-livsmedel: kalorier lagras per reference_amount ml — använd alltid reference_amount som bas.
  --   OBS: weight_grams på ml-livsmedel representerar densiteten (g per 100ml), inte gram-basen.
  -- portion-recept: kalorier per 100g, weight_grams = portionsvikt — ska inte vara bas.
  -- g-livsmedel med weight_grams: korrekt gram-bas.
  IF v_food_item.default_unit = 'ml' THEN
    v_multiplier := v_weight_grams / NULLIF(COALESCE(v_food_item.reference_amount, v_food_item.default_amount), 0);
  ELSIF v_food_item.default_unit = 'portion' THEN
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


-- Retroaktiv rättning av alla ml-livsmedel som loggades med fel multiplier.
-- Inkluderar både: weight_grams IS NULL (fel v_weight_grams) och weight_grams > 0
-- (fel multiplikatorbas). Alla poster med default_unit='ml' och volymenheter rättas
-- om sparad calories matchar fel-formeln inom 5% tolerans.
--
-- Rätt formel: calories = fi.calories * v_total_ml / fi.reference_amount
--   där v_total_ml = amount * (100 för dl, 1 för ml, 15 för msk, 5 för tsk)
UPDATE public.meal_entry_items mei
SET
  weight_grams = CASE
    WHEN mei.unit = 'dl'  THEN mei.amount * 100
    WHEN mei.unit = 'ml'  THEN mei.amount
    WHEN mei.unit = 'msk' THEN mei.amount * 15
    WHEN mei.unit = 'tsk' THEN mei.amount * 5
    ELSE mei.amount
  END,
  calories  = ROUND((fi.calories  * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0))::numeric, 2),
  fat_g     = ROUND((fi.fat_g     * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0))::numeric, 2),
  carb_g    = ROUND((fi.carb_g    * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0))::numeric, 2),
  protein_g = ROUND((fi.protein_g * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0))::numeric, 2)
FROM public.food_items fi
WHERE mei.food_item_id = fi.id
  AND fi.default_unit = 'ml'
  AND fi.ml_per_gram IS NULL
  AND mei.unit IN ('dl', 'ml', 'msk', 'tsk')
  AND fi.calories IS NOT NULL AND fi.calories > 0
  AND mei.calories IS NOT NULL AND mei.calories > 0
  -- Korrekt värde som vi vill sätta
  AND fi.calories * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0) > 0
  -- Bara rättas om det sparade värdet SKILJER sig markant från korrekt värde (>5%)
  AND ABS(mei.calories - (fi.calories * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0)))
        > 0.05 * (fi.calories * (CASE WHEN mei.unit = 'dl' THEN mei.amount * 100 WHEN mei.unit = 'ml' THEN mei.amount WHEN mei.unit = 'msk' THEN mei.amount * 15 WHEN mei.unit = 'tsk' THEN mei.amount * 5 ELSE mei.amount END) / NULLIF(COALESCE(fi.reference_amount, fi.default_amount), 0));
