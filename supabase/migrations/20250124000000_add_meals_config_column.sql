-- Add meals_config column to profiles table to store meal distribution settings
-- This allows each profile to have its own meal configuration (names, percentages)

-- Add meals_config to profiles table
ALTER TABLE profiles
ADD COLUMN meals_config JSONB;

-- Add meals_config to user_profiles table for backward compatibility
ALTER TABLE user_profiles
ADD COLUMN meals_config JSONB;

-- Add comments for documentation
COMMENT ON COLUMN profiles.meals_config IS 'Meal distribution configuration stored as JSON with meal names and percentages';
COMMENT ON COLUMN user_profiles.meals_config IS 'Meal distribution configuration stored as JSON with meal names and percentages';
