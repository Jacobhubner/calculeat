-- Update gender constraint to only allow 'male' and 'female'
-- This migration updates the user_profiles table to restrict gender choices

-- Drop the existing check constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_gender_check;

-- Add new constraint with only male and female
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_gender_check
CHECK (gender IN ('male', 'female'));

-- Update any existing records with 'other' or 'prefer_not_to_say' to NULL
UPDATE user_profiles
SET gender = NULL
WHERE gender NOT IN ('male', 'female');
