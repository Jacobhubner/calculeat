-- =========================================================
-- MIGRATION: Fixa calculate_food_item_nutrition-triggern för recept
-- Date: 2026-03-23
-- Problem: Triggern skriver över kcal_per_gram och kcal_per_unit
--   för recept med default_unit='portion'. Den beräknar felaktigt
--   kcal_per_gram = calories / default_amount (= calories / 1)
--   istället för att respektera klientens utsatta värden.
-- Fix: Hoppa över triggerberäkning när default_unit='portion' —
--   klienten sätter redan korrekta värden för recept.
-- =========================================================

CREATE OR REPLACE FUNCTION calculate_food_item_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  -- For recipe portions, client sets kcal_per_gram/kcal_per_unit correctly — skip trigger calc
  IF NEW.default_unit = 'portion' THEN
    RETURN NEW;
  END IF;

  -- Calculate kcal per gram
  IF NEW.default_unit = 'g' AND NEW.default_amount > 0 THEN
    NEW.kcal_per_gram := NEW.calories / NEW.default_amount;
  ELSIF NEW.grams_per_unit IS NOT NULL AND NEW.grams_per_unit > 0 THEN
    NEW.kcal_per_gram := NEW.calories / (NEW.default_amount * NEW.grams_per_unit);
  END IF;

  -- Calculate per unit values if grams_per_unit is set
  IF NEW.grams_per_unit IS NOT NULL AND NEW.grams_per_unit > 0 THEN
    NEW.kcal_per_unit := NEW.kcal_per_gram * NEW.grams_per_unit;
    NEW.fat_per_unit := (NEW.fat_g / NEW.default_amount) * NEW.grams_per_unit;
    NEW.carb_per_unit := (NEW.carb_g / NEW.default_amount) * NEW.grams_per_unit;
    NEW.protein_per_unit := (NEW.protein_g / NEW.default_amount) * NEW.grams_per_unit;
  END IF;

  -- Auto-assign energy density color based on food type and kcal/gram
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
