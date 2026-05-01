-- Fix 1: Trigger — beräkna kcal_per_gram även för ml-livsmedel (default_unit='ml')
-- Tidigare täckte triggern bara 'g' och piece-baserade enheter.
-- ml-livsmedel: kalorier lagras per reference_amount ml (normaliserat till 100ml).
-- kcal_per_gram = calories / weight_grams  (weight_grams = gram-ekvivalent av reference_amount ml)

CREATE OR REPLACE FUNCTION calculate_food_item_nutrition()
RETURNS TRIGGER AS $$
DECLARE
  v_grams_per_unit numeric;
BEGIN
  -- Auto-assign energy density color (done first so portion-recipes also get color)
  IF NEW.food_type IS NOT NULL AND NEW.kcal_per_gram IS NOT NULL THEN
    IF NEW.food_type = 'Solid' THEN
      IF NEW.kcal_per_gram < 1 THEN NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 2.4 THEN NEW.energy_density_color := 'Yellow';
      ELSE NEW.energy_density_color := 'Orange'; END IF;
    ELSIF NEW.food_type = 'Liquid' THEN
      IF NEW.kcal_per_gram < 0.4 THEN NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 0.5 THEN NEW.energy_density_color := 'Yellow';
      ELSE NEW.energy_density_color := 'Orange'; END IF;
    ELSIF NEW.food_type = 'Soup' THEN
      IF NEW.kcal_per_gram < 0.5 THEN NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 1 THEN NEW.energy_density_color := 'Yellow';
      ELSE NEW.energy_density_color := 'Orange'; END IF;
    END IF;
  END IF;

  -- For recipe portions, client sets kcal_per_gram/kcal_per_unit correctly — skip further calc
  IF NEW.default_unit = 'portion' THEN
    RETURN NEW;
  END IF;

  -- Resolve effective grams_per_unit:
  -- prefer grams_per_unit (legacy), fall back to grams_per_piece (manual foods)
  v_grams_per_unit := COALESCE(
    NULLIF(NEW.grams_per_unit, 0),
    NULLIF(NEW.grams_per_piece, 0)
  );

  -- Calculate kcal per gram
  IF NEW.default_unit = 'g' AND NEW.default_amount > 0 THEN
    NEW.kcal_per_gram := NEW.calories / NEW.default_amount;
  ELSIF NEW.default_unit = 'ml' AND NEW.weight_grams IS NOT NULL AND NEW.weight_grams > 0 THEN
    -- ml-livsmedel: kalorier är per reference_amount ml, weight_grams är gram-ekvivalenten
    NEW.kcal_per_gram := NEW.calories / NEW.weight_grams;
  ELSIF v_grams_per_unit IS NOT NULL AND v_grams_per_unit > 0 THEN
    NEW.kcal_per_gram := NEW.calories / (NEW.default_amount * v_grams_per_unit);
  END IF;

  -- Recalculate color after kcal_per_gram is set (for non-portion items)
  IF NEW.food_type IS NOT NULL AND NEW.kcal_per_gram IS NOT NULL THEN
    IF NEW.food_type = 'Solid' THEN
      IF NEW.kcal_per_gram < 1 THEN NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 2.4 THEN NEW.energy_density_color := 'Yellow';
      ELSE NEW.energy_density_color := 'Orange'; END IF;
    ELSIF NEW.food_type = 'Liquid' THEN
      IF NEW.kcal_per_gram < 0.4 THEN NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 0.5 THEN NEW.energy_density_color := 'Yellow';
      ELSE NEW.energy_density_color := 'Orange'; END IF;
    ELSIF NEW.food_type = 'Soup' THEN
      IF NEW.kcal_per_gram < 0.5 THEN NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 1 THEN NEW.energy_density_color := 'Yellow';
      ELSE NEW.energy_density_color := 'Orange'; END IF;
    END IF;
  END IF;

  -- Calculate per-unit values using effective grams_per_unit
  IF v_grams_per_unit IS NOT NULL AND v_grams_per_unit > 0 THEN
    NEW.kcal_per_unit    := NEW.kcal_per_gram * v_grams_per_unit;
    NEW.fat_per_unit     := (NEW.fat_g     / NEW.default_amount) * v_grams_per_unit;
    NEW.carb_per_unit    := (NEW.carb_g    / NEW.default_amount) * v_grams_per_unit;
    NEW.protein_per_unit := (NEW.protein_g / NEW.default_amount) * v_grams_per_unit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Fix 2: Backfill kcal_per_gram för befintliga ml-livsmedel
-- weight_grams = gram-ekvivalent av reference_amount ml (sparas korrekt av klienten)
UPDATE food_items
SET kcal_per_gram = ROUND(calories / weight_grams, 4)
WHERE
  default_unit = 'ml'
  AND weight_grams IS NOT NULL
  AND weight_grams > 0
  AND kcal_per_gram IS NULL;


-- Fix 3: Recept sparade som 100g-format men vars food_item saknar portion-data
-- (grams_per_piece=NULL, serving_unit=NULL) trots att receptet har total_weight_grams.
-- Konvertera dessa till portion-format: sätt grams_per_piece=total_weight_grams/servings,
-- serving_unit='portion', och beräkna kcal_per_unit/fat_per_unit/carb_per_unit/protein_per_unit.
-- Obs: default_unit ändras INTE till 'portion' — det hanteras av triggern vid nästa save,
-- men vi sätter portion-fälten så att FoodItemsPage visar badges direkt.
UPDATE food_items fi
SET
  grams_per_piece   = ROUND(r.total_weight_grams / NULLIF(r.servings, 0), 2),
  serving_unit      = 'portion',
  kcal_per_unit     = ROUND((fi.calories  / fi.default_amount) * (r.total_weight_grams / NULLIF(r.servings, 0)), 2),
  fat_per_unit      = ROUND((fi.fat_g     / fi.default_amount) * (r.total_weight_grams / NULLIF(r.servings, 0)), 4),
  carb_per_unit     = ROUND((fi.carb_g    / fi.default_amount) * (r.total_weight_grams / NULLIF(r.servings, 0)), 4),
  protein_per_unit  = ROUND((fi.protein_g / fi.default_amount) * (r.total_weight_grams / NULLIF(r.servings, 0)), 4)
FROM recipes r
WHERE
  fi.id = r.food_item_id
  AND fi.is_recipe = true
  AND fi.grams_per_piece IS NULL
  AND fi.serving_unit IS NULL
  AND r.total_weight_grams IS NOT NULL
  AND r.total_weight_grams > 0
  AND r.servings > 0;
