-- Add snapshot_energy_density_color to meal_entry_items so deleting a food item
-- does not corrupt the colour totals on historical daily_logs.

ALTER TABLE public.meal_entry_items
  ADD COLUMN IF NOT EXISTS snapshot_energy_density_color text;

-- Update nutrition trigger to capture energy_density_color at INSERT time only
CREATE OR REPLACE FUNCTION calculate_meal_entry_item_nutrition()
RETURNS TRIGGER AS $$
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
  ELSIF NEW.unit = 'ml' AND v_food_item.ml_per_gram IS NOT NULL THEN
    v_weight_grams := NEW.amount / v_food_item.ml_per_gram;
  ELSIF v_food_item.grams_per_unit IS NOT NULL THEN
    v_weight_grams := NEW.amount * v_food_item.grams_per_unit;
  ELSE
    v_weight_grams := NEW.amount;
  END IF;

  NEW.weight_grams := v_weight_grams;

  IF v_food_item.default_unit = 'g' THEN
    v_multiplier := v_weight_grams / v_food_item.default_amount;
  ELSE
    v_multiplier := NEW.amount / v_food_item.default_amount;
  END IF;

  NEW.calories  := v_food_item.calories  * v_multiplier;
  NEW.fat_g     := v_food_item.fat_g     * v_multiplier;
  NEW.carb_g    := v_food_item.carb_g    * v_multiplier;
  NEW.protein_g := v_food_item.protein_g * v_multiplier;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill snapshot_energy_density_color for existing rows
UPDATE public.meal_entry_items mei
SET snapshot_energy_density_color = fi.energy_density_color
FROM public.food_items fi
WHERE mei.food_item_id = fi.id
  AND mei.snapshot_energy_density_color IS NULL;

-- Update recalculate_daily_log_totals to use the snapshot column instead of
-- joining food_items, so colour totals are frozen at log time.
CREATE OR REPLACE FUNCTION recalculate_daily_log_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_daily_log_id uuid;
  v_totals record;
  v_color_totals record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_daily_log_id := OLD.daily_log_id;
  ELSE
    v_daily_log_id := NEW.daily_log_id;
  END IF;

  SELECT
    COALESCE(SUM(me.meal_calories), 0) as total_calories,
    COALESCE(SUM(me.meal_fat_g),    0) as total_fat,
    COALESCE(SUM(me.meal_carb_g),   0) as total_carb,
    COALESCE(SUM(me.meal_protein_g),0) as total_protein
  INTO v_totals
  FROM public.meal_entries me
  WHERE me.daily_log_id = v_daily_log_id;

  -- Use snapshotted colour — no join to food_items needed
  SELECT
    COALESCE(SUM(CASE WHEN mei.snapshot_energy_density_color = 'Green'  THEN mei.calories ELSE 0 END), 0) as green_calories,
    COALESCE(SUM(CASE WHEN mei.snapshot_energy_density_color = 'Yellow' THEN mei.calories ELSE 0 END), 0) as yellow_calories,
    COALESCE(SUM(CASE WHEN mei.snapshot_energy_density_color = 'Orange' THEN mei.calories ELSE 0 END), 0) as orange_calories
  INTO v_color_totals
  FROM public.meal_entries me
  JOIN public.meal_entry_items mei ON mei.meal_entry_id = me.id
  WHERE me.daily_log_id = v_daily_log_id;

  UPDATE public.daily_logs
  SET
    total_calories  = v_totals.total_calories,
    total_fat_g     = v_totals.total_fat,
    total_carb_g    = v_totals.total_carb,
    total_protein_g = v_totals.total_protein,
    green_calories  = v_color_totals.green_calories,
    yellow_calories = v_color_totals.yellow_calories,
    orange_calories = v_color_totals.orange_calories,
    kcal_per_gram = CASE
      WHEN v_totals.total_calories > 0 THEN
        v_totals.total_calories / NULLIF(
          (SELECT COALESCE(SUM(weight_grams), 0)
           FROM public.meal_entries me2
           JOIN public.meal_entry_items mei2 ON mei2.meal_entry_id = me2.id
           WHERE me2.daily_log_id = v_daily_log_id
          ), 0
        )
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = v_daily_log_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
