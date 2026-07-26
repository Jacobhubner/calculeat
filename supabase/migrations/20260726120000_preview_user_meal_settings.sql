-- Preview-sandlådan: isolera user_meal_settings så måltidsinställningar kan
-- ändras i "Testa som ny användare" utan att påverka det riktiga kontot.
--
-- Tidigare läckte useMealSettings ut ur sandlådan (tabellen saknade is_preview
-- och ingick inte i backup/restore). Måltidsinställningar HÖR dock till
-- onboarding-upplevelsen och ska vara ändringsbara i preview — därför full
-- isolering (samma mönster som weight_history/daily_logs) i stället för blockering.
--
-- 1. is_preview-kolumn (default false, NOT NULL).
-- 2. De unika constraints saknade is_preview → en preview-rad med samma
--    meal_name/meal_order som en riktig rad kunde inte skapas. Byts mot
--    preview-medvetna unika index (samma fix som daily_logs, 20260725010000).
-- 3. exit_preview_profile raderar is_preview=true-raderna vid avslut.

-- 1. Kolumn
ALTER TABLE public.user_meal_settings
  ADD COLUMN IF NOT EXISTS is_preview boolean NOT NULL DEFAULT false;

-- 2. Preview-medveten unikhet
ALTER TABLE public.user_meal_settings
  DROP CONSTRAINT IF EXISTS unique_meal_name_per_user;
ALTER TABLE public.user_meal_settings
  DROP CONSTRAINT IF EXISTS unique_meal_order_per_user;

CREATE UNIQUE INDEX IF NOT EXISTS user_meal_settings_name_per_user_key
  ON public.user_meal_settings USING btree (user_id, meal_name, is_preview);
CREATE UNIQUE INDEX IF NOT EXISTS user_meal_settings_order_per_user_key
  ON public.user_meal_settings USING btree (user_id, meal_order, is_preview);

-- 3. Radera preview-rader vid avslut. exit_preview_profile återskapas i sin
--    helhet (SECURITY DEFINER) med user_meal_settings-raderingen tillagd bland
--    de övriga is_preview-städningarna.
CREATE OR REPLACE FUNCTION public.exit_preview_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id        uuid := auth.uid();
  v_preview_id     uuid;
  v_old_profile_id uuid;
  v_backup         jsonb;
BEGIN
  SELECT active_profile_id, preview_backup_profile_id, preview_user_profiles_backup
  INTO v_preview_id, v_old_profile_id, v_backup
  FROM user_profiles WHERE id = v_user_id;

  IF v_old_profile_id IS NULL THEN RETURN; END IF;

  DELETE FROM daily_logs          WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM meal_entries        WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM weight_history      WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM calibration_history WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM food_items          WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM user_meal_settings  WHERE user_id = v_user_id AND is_preview = true;

  IF v_backup IS NOT NULL THEN
    UPDATE user_profiles
    SET
      profile_name                 = (v_backup->>'profile_name'),
      weight_kg                    = (v_backup->>'weight_kg')::numeric,
      height_cm                    = (v_backup->>'height_cm')::numeric::integer,
      gender                       = (v_backup->>'gender'),
      birth_date                   = (v_backup->>'birth_date')::date,
      body_fat_percentage          = (v_backup->>'body_fat_percentage')::numeric,
      bmr                          = (v_backup->>'bmr')::numeric,
      tdee                         = (v_backup->>'tdee')::numeric::integer,
      calories_min                 = (v_backup->>'calories_min')::numeric,
      calories_max                 = (v_backup->>'calories_max')::numeric,
      bmr_formula                  = (v_backup->>'bmr_formula'),
      activity_level               = (v_backup->>'activity_level'),
      pal_system                   = (v_backup->>'pal_system'),
      intensity_level              = (v_backup->>'intensity_level'),
      training_frequency_per_week  = (v_backup->>'training_frequency_per_week')::numeric,
      training_duration_minutes    = (v_backup->>'training_duration_minutes')::numeric,
      daily_steps                  = (v_backup->>'daily_steps'),
      custom_pal                   = (v_backup->>'custom_pal')::numeric,
      calorie_goal                 = (v_backup->>'calorie_goal'),
      deficit_level                = (v_backup->>'deficit_level'),
      custom_tdee                  = (v_backup->>'custom_tdee')::numeric,
      body_composition_method      = (v_backup->>'body_composition_method'),
      fat_min_percent              = (v_backup->>'fat_min_percent')::numeric,
      fat_max_percent              = (v_backup->>'fat_max_percent')::numeric,
      carb_min_percent             = (v_backup->>'carb_min_percent')::numeric,
      carb_max_percent             = (v_backup->>'carb_max_percent')::numeric,
      protein_min_percent          = (v_backup->>'protein_min_percent')::numeric,
      protein_max_percent          = (v_backup->>'protein_max_percent')::numeric,
      training_activity_id         = (v_backup->>'training_activity_id'),
      training_days_per_week       = (v_backup->>'training_days_per_week')::numeric::integer,
      training_minutes_per_session = (v_backup->>'training_minutes_per_session')::numeric::integer,
      walking_activity_id          = (v_backup->>'walking_activity_id'),
      steps_per_day                = (v_backup->>'steps_per_day')::numeric::integer,
      hours_standing_per_day       = (v_backup->>'hours_standing_per_day')::numeric,
      household_activity_id        = (v_backup->>'household_activity_id'),
      household_hours_per_day      = (v_backup->>'household_hours_per_day')::numeric,
      spa_factor                   = (v_backup->>'spa_factor')::numeric,
      tdee_source                  = (v_backup->>'tdee_source'),
      tdee_calculated_at           = (v_backup->>'tdee_calculated_at')::timestamptz,
      tdee_calculation_snapshot    = (v_backup->'tdee_calculation_snapshot'),
      target_weight_kg             = (v_backup->>'target_weight_kg')::numeric,
      initial_weight_kg            = (v_backup->>'initial_weight_kg')::numeric,
      meals_config                 = (v_backup->'meals_config'),
      active_profile_id            = v_old_profile_id,
      preview_backup_profile_id    = NULL,
      preview_user_profiles_backup = NULL
    WHERE id = v_user_id;
  ELSE
    UPDATE user_profiles
    SET active_profile_id         = v_old_profile_id,
        preview_backup_profile_id = NULL
    WHERE id = v_user_id;
  END IF;

  DELETE FROM profiles
  WHERE id = v_preview_id AND profile_name = '__preview__';
END;
$function$;
