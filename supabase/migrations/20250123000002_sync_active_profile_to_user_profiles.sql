-- Sync active profile data to user_profiles table
-- This ensures that user_profiles always reflects the current active profile from profiles table
-- This is needed for backward compatibility with components that still read from user_profiles

-- Create function to sync active profile to user_profiles
CREATE OR REPLACE FUNCTION public.sync_active_profile_to_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if this is the active profile
  IF NEW.is_active = true THEN
    -- Update user_profiles with all data from the active profile
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
      updated_at = NEW.updated_at
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync on INSERT or UPDATE
DROP TRIGGER IF EXISTS sync_profile_to_user_profiles ON public.profiles;
CREATE TRIGGER sync_profile_to_user_profiles
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.sync_active_profile_to_user_profiles();

-- Perform initial sync for existing active profiles
UPDATE public.user_profiles up
SET
  profile_name = p.profile_name,
  birth_date = p.birth_date,
  gender = p.gender,
  height_cm = p.height_cm,
  weight_kg = p.weight_kg,
  bmr_formula = p.bmr_formula,
  pal_system = p.pal_system,
  activity_level = p.activity_level,
  intensity_level = p.intensity_level,
  training_frequency_per_week = p.training_frequency_per_week,
  training_duration_minutes = p.training_duration_minutes,
  daily_steps = p.daily_steps,
  custom_pal = p.custom_pal,
  body_fat_percentage = p.body_fat_percentage,
  body_composition_method = p.body_composition_method,
  bmr = p.bmr,
  tdee = p.tdee,
  calorie_goal = p.calorie_goal,
  deficit_level = p.deficit_level,
  custom_tdee = p.custom_tdee,
  calories_min = p.calories_min,
  calories_max = p.calories_max,
  updated_at = p.updated_at
FROM public.profiles p
WHERE up.id = p.user_id
  AND p.is_active = true;

COMMENT ON FUNCTION public.sync_active_profile_to_user_profiles() IS 'Syncs active profile data from profiles table to user_profiles for backward compatibility';
