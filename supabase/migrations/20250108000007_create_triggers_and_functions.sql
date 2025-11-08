-- Additional triggers and functions for automatic calculations

-- Function to recalculate meal entry totals when items change
CREATE OR REPLACE FUNCTION recalculate_meal_entry_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_meal_entry_id uuid;
  v_totals record;
BEGIN
  -- Get the meal_entry_id
  IF TG_OP = 'DELETE' THEN
    v_meal_entry_id := OLD.meal_entry_id;
  ELSE
    v_meal_entry_id := NEW.meal_entry_id;
  END IF;

  -- Calculate totals for this meal entry
  SELECT
    COALESCE(SUM(calories), 0) as total_calories,
    COALESCE(SUM(fat_g), 0) as total_fat,
    COALESCE(SUM(carb_g), 0) as total_carb,
    COALESCE(SUM(protein_g), 0) as total_protein
  INTO v_totals
  FROM public.meal_entry_items
  WHERE meal_entry_id = v_meal_entry_id;

  -- Update meal entry
  UPDATE public.meal_entries
  SET
    meal_calories = v_totals.total_calories,
    meal_fat_g = v_totals.total_fat,
    meal_carb_g = v_totals.total_carb,
    meal_protein_g = v_totals.total_protein,
    updated_at = now()
  WHERE id = v_meal_entry_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on meal_entry_items
CREATE TRIGGER recalculate_meal_entry_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_entry_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_meal_entry_totals();

-- Function to recalculate daily log totals when meal entries change
CREATE OR REPLACE FUNCTION recalculate_daily_log_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_daily_log_id uuid;
  v_totals record;
  v_noom_totals record;
BEGIN
  -- Get the daily_log_id
  IF TG_OP = 'DELETE' THEN
    v_daily_log_id := OLD.daily_log_id;
  ELSE
    v_daily_log_id := NEW.daily_log_id;
  END IF;

  -- Calculate totals for this daily log
  SELECT
    COALESCE(SUM(me.meal_calories), 0) as total_calories,
    COALESCE(SUM(me.meal_fat_g), 0) as total_fat,
    COALESCE(SUM(me.meal_carb_g), 0) as total_carb,
    COALESCE(SUM(me.meal_protein_g), 0) as total_protein
  INTO v_totals
  FROM public.meal_entries me
  WHERE me.daily_log_id = v_daily_log_id;

  -- Calculate Noom color totals
  SELECT
    COALESCE(SUM(CASE WHEN fi.noom_color = 'Green' THEN mei.calories ELSE 0 END), 0) as green_calories,
    COALESCE(SUM(CASE WHEN fi.noom_color = 'Yellow' THEN mei.calories ELSE 0 END), 0) as yellow_calories,
    COALESCE(SUM(CASE WHEN fi.noom_color = 'Orange' THEN mei.calories ELSE 0 END), 0) as orange_calories
  INTO v_noom_totals
  FROM public.meal_entries me
  JOIN public.meal_entry_items mei ON mei.meal_entry_id = me.id
  JOIN public.food_items fi ON fi.id = mei.food_item_id
  WHERE me.daily_log_id = v_daily_log_id;

  -- Update daily log
  UPDATE public.daily_logs
  SET
    total_calories = v_totals.total_calories,
    total_fat_g = v_totals.total_fat,
    total_carb_g = v_totals.total_carb,
    total_protein_g = v_totals.total_protein,
    green_calories = v_noom_totals.green_calories,
    yellow_calories = v_noom_totals.yellow_calories,
    orange_calories = v_noom_totals.orange_calories,
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

-- Trigger on meal_entries
CREATE TRIGGER recalculate_daily_log_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_daily_log_totals();

-- Function to calculate nutrition for meal_entry_items based on food_items
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

-- Trigger on meal_entry_items
CREATE TRIGGER calculate_meal_entry_item_nutrition_trigger
  BEFORE INSERT OR UPDATE ON public.meal_entry_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_meal_entry_item_nutrition();
