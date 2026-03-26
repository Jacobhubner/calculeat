-- =========================================================
-- MIGRATION: Fixa energy_density_color för recept med default_unit='portion'
-- Date: 2026-03-26
-- Problem: Triggern calculate_food_item_nutrition returnerar tidigt
--   (RETURN NEW) för recept med default_unit='portion' utan att
--   beräkna energy_density_color. Importerade delade recept med
--   portion-format saknar därmed färg (grön/gul/orange).
-- Fix: Beräkna energy_density_color från kcal_per_gram FÖRE
--   den tidiga returen för portion-recept, sedan skips
--   kcal_per_gram/kcal_per_unit-beräkningarna (klienten sätter dem).
-- Backfill: Uppdatera befintliga food_items utan energy_density_color
--   som har kcal_per_gram satt.
-- =========================================================

CREATE OR REPLACE FUNCTION calculate_food_item_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign energy density color based on food type and kcal/gram
  -- (done first so portion-recipes also get their color set)
  IF NEW.food_type IS NOT NULL AND NEW.kcal_per_gram IS NOT NULL THEN
    IF NEW.food_type = 'Solid' THEN
      IF NEW.kcal_per_gram < 1 THEN
        NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 2.4 THEN
        NEW.energy_density_color := 'Yellow';
      ELSE
        NEW.energy_density_color := 'Orange';
      END IF;
    ELSIF NEW.food_type = 'Liquid' THEN
      IF NEW.kcal_per_gram < 0.4 THEN
        NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 0.5 THEN
        NEW.energy_density_color := 'Yellow';
      ELSE
        NEW.energy_density_color := 'Orange';
      END IF;
    ELSIF NEW.food_type = 'Soup' THEN
      IF NEW.kcal_per_gram < 0.5 THEN
        NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 1 THEN
        NEW.energy_density_color := 'Yellow';
      ELSE
        NEW.energy_density_color := 'Orange';
      END IF;
    END IF;
  END IF;

  -- For recipe portions, client sets kcal_per_gram/kcal_per_unit correctly — skip further calc
  IF NEW.default_unit = 'portion' THEN
    RETURN NEW;
  END IF;

  -- Calculate kcal per gram
  IF NEW.default_unit = 'g' AND NEW.default_amount > 0 THEN
    NEW.kcal_per_gram := NEW.calories / NEW.default_amount;
  ELSIF NEW.grams_per_unit IS NOT NULL AND NEW.grams_per_unit > 0 THEN
    NEW.kcal_per_gram := NEW.calories / (NEW.default_amount * NEW.grams_per_unit);
  END IF;

  -- Recalculate color after kcal_per_gram is set (for non-portion items)
  IF NEW.food_type IS NOT NULL AND NEW.kcal_per_gram IS NOT NULL THEN
    IF NEW.food_type = 'Solid' THEN
      IF NEW.kcal_per_gram < 1 THEN
        NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 2.4 THEN
        NEW.energy_density_color := 'Yellow';
      ELSE
        NEW.energy_density_color := 'Orange';
      END IF;
    ELSIF NEW.food_type = 'Liquid' THEN
      IF NEW.kcal_per_gram < 0.4 THEN
        NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 0.5 THEN
        NEW.energy_density_color := 'Yellow';
      ELSE
        NEW.energy_density_color := 'Orange';
      END IF;
    ELSIF NEW.food_type = 'Soup' THEN
      IF NEW.kcal_per_gram < 0.5 THEN
        NEW.energy_density_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 1 THEN
        NEW.energy_density_color := 'Yellow';
      ELSE
        NEW.energy_density_color := 'Orange';
      END IF;
    END IF;
  END IF;

  -- Calculate per unit values if grams_per_unit is set
  IF NEW.grams_per_unit IS NOT NULL AND NEW.grams_per_unit > 0 THEN
    NEW.kcal_per_unit := NEW.kcal_per_gram * NEW.grams_per_unit;
    NEW.fat_per_unit := (NEW.fat_g / NEW.default_amount) * NEW.grams_per_unit;
    NEW.carb_per_unit := (NEW.carb_g / NEW.default_amount) * NEW.grams_per_unit;
    NEW.protein_per_unit := (NEW.protein_g / NEW.default_amount) * NEW.grams_per_unit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill: sätt energy_density_color på befintliga food_items som saknar det
-- men har kcal_per_gram och food_type satt
UPDATE food_items
SET energy_density_color = CASE
  WHEN food_type = 'Solid' THEN
    CASE
      WHEN kcal_per_gram < 1    THEN 'Green'
      WHEN kcal_per_gram <= 2.4 THEN 'Yellow'
      ELSE 'Orange'
    END
  WHEN food_type = 'Liquid' THEN
    CASE
      WHEN kcal_per_gram < 0.4  THEN 'Green'
      WHEN kcal_per_gram <= 0.5 THEN 'Yellow'
      ELSE 'Orange'
    END
  WHEN food_type = 'Soup' THEN
    CASE
      WHEN kcal_per_gram < 0.5 THEN 'Green'
      WHEN kcal_per_gram <= 1  THEN 'Yellow'
      ELSE 'Orange'
    END
  ELSE NULL
END
WHERE energy_density_color IS NULL
  AND kcal_per_gram IS NOT NULL
  AND food_type IN ('Solid', 'Liquid', 'Soup');
