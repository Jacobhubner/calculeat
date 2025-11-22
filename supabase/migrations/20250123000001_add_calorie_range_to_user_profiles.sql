-- Add calorie range columns to user_profiles table
-- These columns store the min/max calorie targets based on energy goals
-- This migration mirrors the same columns added to the profiles table

ALTER TABLE user_profiles
ADD COLUMN calories_min DECIMAL(10, 2),
ADD COLUMN calories_max DECIMAL(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.calories_min IS 'Minimum daily calorie target based on energy goal';
COMMENT ON COLUMN user_profiles.calories_max IS 'Maximum daily calorie target based on energy goal';
