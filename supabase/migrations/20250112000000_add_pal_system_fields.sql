-- Add new columns for PAL system and related fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pal_system TEXT,
ADD COLUMN IF NOT EXISTS intensity_level TEXT,
ADD COLUMN IF NOT EXISTS training_frequency_per_week INTEGER,
ADD COLUMN IF NOT EXISTS training_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS daily_steps TEXT,
ADD COLUMN IF NOT EXISTS custom_pal NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS deficit_level TEXT,
ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,2);

-- Add check constraints for data integrity
ALTER TABLE user_profiles
ADD CONSTRAINT training_frequency_check
  CHECK (training_frequency_per_week IS NULL OR (training_frequency_per_week >= 0 AND training_frequency_per_week <= 14)),
ADD CONSTRAINT training_duration_check
  CHECK (training_duration_minutes IS NULL OR (training_duration_minutes >= 0 AND training_duration_minutes <= 300)),
ADD CONSTRAINT custom_pal_check
  CHECK (custom_pal IS NULL OR (custom_pal >= 1.0 AND custom_pal <= 3.0)),
ADD CONSTRAINT target_weight_check
  CHECK (target_weight_kg IS NULL OR (target_weight_kg >= 30 AND target_weight_kg <= 300));

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.pal_system IS 'Physical Activity Level system choice';
COMMENT ON COLUMN user_profiles.intensity_level IS 'Training intensity level';
COMMENT ON COLUMN user_profiles.training_frequency_per_week IS 'Number of training sessions per week (0-14)';
COMMENT ON COLUMN user_profiles.training_duration_minutes IS 'Average duration of training session in minutes (0-300)';
COMMENT ON COLUMN user_profiles.daily_steps IS 'Average daily steps range';
COMMENT ON COLUMN user_profiles.custom_pal IS 'Custom PAL value if using Custom PAL system (1.0-3.0)';
COMMENT ON COLUMN user_profiles.deficit_level IS 'Calorie deficit level for weight loss';
COMMENT ON COLUMN user_profiles.target_weight_kg IS 'Target weight in kg for goal tracking';
