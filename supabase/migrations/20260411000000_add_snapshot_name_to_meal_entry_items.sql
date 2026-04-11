-- Add snapshot_name to meal_entry_items so food item renames don't alter history
ALTER TABLE public.meal_entry_items
  ADD COLUMN IF NOT EXISTS snapshot_name text;

-- Update the nutrition trigger to also capture the food item name at insert time
CREATE OR REPLACE FUNCTION calculate_meal_entry_item_nutrition()
RETURNS TRIGGER AS $$
DECLARE
  v_food_item record;
  v_weight_grams numeric;
  v_multiplier numeric;
BEGIN
  -- Get food item data
  SELECT * INTO v_food_item
  FROM public.food_items
  WHERE id = NEW.food_item_id;

  -- Capture name snapshot on INSERT (never overwrite on UPDATE so renames don't affect history)
  IF TG_OP = 'INSERT' THEN
    NEW.snapshot_name := v_food_item.name;
  END IF;

  -- Calculate weight in grams based on unit
  IF NEW.unit = 'g' THEN
    v_weight_grams := NEW.amount;
  ELSIF NEW.unit = 'ml' AND v_food_item.ml_per_gram IS NOT NULL THEN
    v_weight_grams := NEW.amount / v_food_item.ml_per_gram;
  ELSIF v_food_item.grams_per_unit IS NOT NULL THEN
    v_weight_grams := NEW.amount * v_food_item.grams_per_unit;
  ELSE
    -- Default to assuming the amount is in grams
    v_weight_grams := NEW.amount;
  END IF;

  NEW.weight_grams := v_weight_grams;

  -- Calculate multiplier (how many times the default serving)
  IF v_food_item.default_unit = 'g' THEN
    v_multiplier := v_weight_grams / v_food_item.default_amount;
  ELSE
    v_multiplier := NEW.amount / v_food_item.default_amount;
  END IF;

  -- Calculate nutrition
  NEW.calories := v_food_item.calories * v_multiplier;
  NEW.fat_g := v_food_item.fat_g * v_multiplier;
  NEW.carb_g := v_food_item.carb_g * v_multiplier;
  NEW.protein_g := v_food_item.protein_g * v_multiplier;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill snapshot_name for all existing rows where it is null
UPDATE public.meal_entry_items mei
SET snapshot_name = fi.name
FROM public.food_items fi
WHERE mei.food_item_id = fi.id
  AND mei.snapshot_name IS NULL;
