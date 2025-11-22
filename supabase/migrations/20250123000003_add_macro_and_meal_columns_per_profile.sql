-- Add macro columns to profiles table so each profile can have its own macro settings
-- Add macro columns to user_profiles table for backward compatibility

-- Step 1: Add macro columns to profiles table
ALTER TABLE profiles
ADD COLUMN fat_min_percent NUMERIC CHECK (fat_min_percent >= 0 AND fat_min_percent <= 100),
ADD COLUMN fat_max_percent NUMERIC CHECK (fat_max_percent >= 0 AND fat_max_percent <= 100),
ADD COLUMN carb_min_percent NUMERIC CHECK (carb_min_percent >= 0 AND carb_min_percent <= 100),
ADD COLUMN carb_max_percent NUMERIC CHECK (carb_max_percent >= 0 AND carb_max_percent <= 100),
ADD COLUMN protein_min_percent NUMERIC CHECK (protein_min_percent >= 0 AND protein_min_percent <= 100),
ADD COLUMN protein_max_percent NUMERIC CHECK (protein_max_percent >= 0 AND protein_max_percent <= 100);

-- Step 2: Add macro columns to user_profiles table for backward compatibility
ALTER TABLE user_profiles
ADD COLUMN fat_min_percent NUMERIC CHECK (fat_min_percent >= 0 AND fat_min_percent <= 100),
ADD COLUMN fat_max_percent NUMERIC CHECK (fat_max_percent >= 0 AND fat_max_percent <= 100),
ADD COLUMN carb_min_percent NUMERIC CHECK (carb_min_percent >= 0 AND carb_min_percent <= 100),
ADD COLUMN carb_max_percent NUMERIC CHECK (carb_max_percent >= 0 AND carb_max_percent <= 100),
ADD COLUMN protein_min_percent NUMERIC CHECK (protein_min_percent >= 0 AND protein_min_percent <= 100),
ADD COLUMN protein_max_percent NUMERIC CHECK (protein_max_percent >= 0 AND protein_max_percent <= 100);

-- Step 3: Add comments for documentation
COMMENT ON COLUMN profiles.fat_min_percent IS 'Minimum fat percentage for macro distribution';
COMMENT ON COLUMN profiles.fat_max_percent IS 'Maximum fat percentage for macro distribution';
COMMENT ON COLUMN profiles.carb_min_percent IS 'Minimum carbohydrate percentage for macro distribution';
COMMENT ON COLUMN profiles.carb_max_percent IS 'Maximum carbohydrate percentage for macro distribution';
COMMENT ON COLUMN profiles.protein_min_percent IS 'Minimum protein percentage for macro distribution';
COMMENT ON COLUMN profiles.protein_max_percent IS 'Maximum protein percentage for macro distribution';
