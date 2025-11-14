-- Add profile enhancements
-- Migration to add profile_name and target_body_fat_percentage fields

-- Add profile_name field
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_name TEXT;

-- Add target_body_fat_percentage field
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS target_body_fat_percentage NUMERIC(4,2);

-- Add check constraint for target body fat percentage
ALTER TABLE user_profiles
ADD CONSTRAINT target_body_fat_check
  CHECK (target_body_fat_percentage IS NULL OR (target_body_fat_percentage >= 3 AND target_body_fat_percentage <= 50));

-- Add comments
COMMENT ON COLUMN user_profiles.profile_name IS 'Display name for the profile (optional, separate from full_name)';
COMMENT ON COLUMN user_profiles.target_body_fat_percentage IS 'Target body fat percentage goal (3-50%)';
