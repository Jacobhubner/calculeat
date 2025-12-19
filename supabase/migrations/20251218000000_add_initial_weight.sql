-- Add initial_weight_kg column to profiles table
-- This represents the weight when TDEE was first calculated/entered
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS initial_weight_kg DECIMAL CHECK (initial_weight_kg > 0 AND initial_weight_kg < 500);

COMMENT ON COLUMN profiles.initial_weight_kg IS 'Startvikt när TDEE först beräknades/angavs';

-- Backfill för befintliga profiler med TDEE
-- Set initial_weight_kg = weight_kg for existing profiles that have TDEE
UPDATE profiles
SET initial_weight_kg = weight_kg
WHERE tdee IS NOT NULL AND initial_weight_kg IS NULL;
