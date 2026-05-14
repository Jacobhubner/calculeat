-- Trigger calculate_food_item_nutrition beräknar fel kcal_per_unit för ml-livsmedel
-- där densitet (ml_per_gram) != 1.
--
-- Problemet: triggern gör kcal_per_unit = kcal_per_gram * grams_per_piece
-- För ml-livsmedel lagras grams_per_piece i ML (t.ex. 500 för 500ml förpackning).
-- kcal_per_gram * 500ml ger fel svar när densitet != 1 (500ml != 500g).
-- Exempel: Protein Chocolate Shake Arla (ml_per_gram=0.964)
--   Fel: 0.4917 kcal/g * 500 = 245.85 kcal
--   Rätt: 51 kcal/100ml * 500/100 = 255 kcal
--
-- Fix: ml-livsmedel använder (calories / default_amount) * grams_per_piece direkt.
-- g-livsmedel berörs inte.

CREATE OR REPLACE FUNCTION calculate_food_item_nutrition()
RETURNS TRIGGER AS $$
DECLARE
  v_grams_per_unit numeric;
BEGIN
  -- Auto-assign energy density color
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

  -- Portion-format recept: client sätter kcal_per_gram och kcal_per_unit korrekt
  IF NEW.default_unit = 'portion' THEN
    RETURN NEW;
  END IF;

  v_grams_per_unit := COALESCE(
    NULLIF(NEW.grams_per_unit, 0),
    NULLIF(NEW.grams_per_piece, 0)
  );

  -- Beräkna kcal_per_gram
  IF NEW.default_unit = 'g' AND NEW.default_amount > 0 THEN
    NEW.kcal_per_gram := NEW.calories / NEW.default_amount;
  ELSIF NEW.default_unit = 'ml' AND NEW.weight_grams IS NOT NULL AND NEW.weight_grams > 0 THEN
    NEW.kcal_per_gram := NEW.calories / NEW.weight_grams;
  ELSIF v_grams_per_unit IS NOT NULL AND v_grams_per_unit > 0 THEN
    NEW.kcal_per_gram := NEW.calories / (NEW.default_amount * v_grams_per_unit);
  END IF;

  -- Uppdatera energitäthetsfärg efter kcal_per_gram
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

  -- Beräkna per-unit värden.
  -- För ml-livsmedel: grams_per_piece lagrar ml-mängd (t.ex. 500 för 500ml).
  -- Rätt formel: (calories / default_amount) * ml_per_piece — oavsett densitet.
  -- För g-livsmedel: kcal_per_gram * grams_per_piece är korrekt.
  IF v_grams_per_unit IS NOT NULL AND v_grams_per_unit > 0 THEN
    IF NEW.default_unit = 'ml' THEN
      NEW.kcal_per_unit    := ROUND((NEW.calories    / NULLIF(NEW.default_amount, 0) * v_grams_per_unit)::numeric, 2);
      NEW.fat_per_unit     := ROUND((NEW.fat_g       / NULLIF(NEW.default_amount, 0) * v_grams_per_unit)::numeric, 4);
      NEW.carb_per_unit    := ROUND((NEW.carb_g      / NULLIF(NEW.default_amount, 0) * v_grams_per_unit)::numeric, 4);
      NEW.protein_per_unit := ROUND((NEW.protein_g   / NULLIF(NEW.default_amount, 0) * v_grams_per_unit)::numeric, 4);
    ELSE
      NEW.kcal_per_unit    := NEW.kcal_per_gram * v_grams_per_unit;
      NEW.fat_per_unit     := (NEW.fat_g     / NEW.default_amount) * v_grams_per_unit;
      NEW.carb_per_unit    := (NEW.carb_g    / NEW.default_amount) * v_grams_per_unit;
      NEW.protein_per_unit := (NEW.protein_g / NEW.default_amount) * v_grams_per_unit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Retroaktiv rättning: nollställ grams_per_unit-reliktvärden för ml-livsmedel
-- med densitet != 1 så att triggern använder grams_per_piece korrekt.
-- (Protein Chocolate Shake Arla hade grams_per_unit=1.0373 som maskerade grams_per_piece=500)
UPDATE food_items
SET grams_per_unit = NULL
WHERE
  default_unit = 'ml'
  AND grams_per_unit IS NOT NULL
  AND grams_per_unit < 2.0
  AND grams_per_piece IS NOT NULL
  AND grams_per_piece > 5
  AND ml_per_gram IS NOT NULL
  AND ABS(ml_per_gram - 1.0) > 0.001;
