-- Fix: triggern beräknade kcal_per_unit från grams_per_unit (gammal kolumn)
-- men AddFoodItemModal sparar portionsvikt i grams_per_piece (ny kolumn).
-- Nu: om grams_per_unit saknas men grams_per_piece finns, använd grams_per_piece.

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

-- Backfill: beräkna kcal_per_unit för befintliga livsmedel som har
-- grams_per_piece satt men kcal_per_unit = NULL (skapade manuellt av användare)
UPDATE food_items
SET
  kcal_per_unit    = ROUND((calories / default_amount) * grams_per_piece, 2),
  fat_per_unit     = ROUND((fat_g    / default_amount) * grams_per_piece, 4),
  carb_per_unit    = ROUND((carb_g   / default_amount) * grams_per_piece, 4),
  protein_per_unit = ROUND((protein_g / default_amount) * grams_per_piece, 4)
WHERE
  grams_per_piece IS NOT NULL
  AND grams_per_piece > 0
  AND (grams_per_unit IS NULL OR grams_per_unit = 0)
  AND kcal_per_unit IS NULL
  AND default_amount > 0
  AND default_unit != 'portion';
