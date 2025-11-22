-- Update sync trigger to include macro columns
-- This ensures macro settings are synced from active profile to user_profiles

CREATE OR REPLACE FUNCTION public.sync_active_profile_to_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if this is the active profile
  IF NEW.is_active = true THEN
    -- Update user_profiles with all data from the active profile including macros
    UPDATE public.user_profiles
    SET
      profile_name = NEW.profile_name,
      birth_date = NEW.birth_date,
      gender = NEW.gender,
      height_cm = NEW.height_cm,
      weight_kg = NEW.weight_kg,
      bmr_formula = NEW.bmr_formula,
      pal_system = NEW.pal_system,
      activity_level = NEW.activity_level,
      intensity_level = NEW.intensity_level,
      training_frequency_per_week = NEW.training_frequency_per_week,
      training_duration_minutes = NEW.training_duration_minutes,
      daily_steps = NEW.daily_steps,
      custom_pal = NEW.custom_pal,
      body_fat_percentage = NEW.body_fat_percentage,
      body_composition_method = NEW.body_composition_method,
      bmr = NEW.bmr,
      tdee = NEW.tdee,
      calorie_goal = NEW.calorie_goal,
      deficit_level = NEW.deficit_level,
      custom_tdee = NEW.custom_tdee,
      calories_min = NEW.calories_min,
      calories_max = NEW.calories_max,
      fat_min_percent = NEW.fat_min_percent,
      fat_max_percent = NEW.fat_max_percent,
      carb_min_percent = NEW.carb_min_percent,
      carb_max_percent = NEW.carb_max_percent,
      protein_min_percent = NEW.protein_min_percent,
      protein_max_percent = NEW.protein_max_percent,
      updated_at = NEW.updated_at
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists, no need to recreate it
-- It will use the updated function automatically
