-- Add macro distribution and meal settings to profiles
-- Migration created: 2025-01-17
-- Purpose: Allow users to customize macro distribution ranges and meal configurations per profile

-- Add macro distribution columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fat_min_percent INTEGER CHECK (fat_min_percent >= 13 AND fat_min_percent <= 39),
ADD COLUMN IF NOT EXISTS fat_max_percent INTEGER CHECK (fat_max_percent >= 13 AND fat_max_percent <= 39),
ADD COLUMN IF NOT EXISTS carb_min_percent INTEGER CHECK (carb_min_percent >= 35 AND carb_min_percent <= 68),
ADD COLUMN IF NOT EXISTS carb_max_percent INTEGER CHECK (carb_max_percent >= 35 AND carb_max_percent <= 68),
ADD COLUMN IF NOT EXISTS protein_min_percent INTEGER CHECK (protein_min_percent >= 19 AND protein_min_percent <= 26),
ADD COLUMN IF NOT EXISTS protein_max_percent INTEGER CHECK (protein_max_percent >= 19 AND protein_max_percent <= 26);

-- Add meal configuration as JSONB (flexible structure for variable number of meals)
-- Structure: { "meals": [{ "name": "Frukost", "percentage": 30 }, ...] }
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS meals_config JSONB DEFAULT '{"meals": [
  {"name": "Frukost", "percentage": 30},
  {"name": "Lunch", "percentage": 30},
  {"name": "Mellanmål", "percentage": 10},
  {"name": "Middag", "percentage": 30}
]}'::jsonb;

-- Add validation constraint to ensure meal percentages sum to 100
-- This will be validated in the application layer for better UX

-- Add comment for meals_config structure
COMMENT ON COLUMN public.profiles.meals_config IS 'JSONB structure: {"meals": [{"name": string, "percentage": number}]}. Percentages should sum to 100.';

-- Add comments for macro distribution columns
COMMENT ON COLUMN public.profiles.fat_min_percent IS 'Minimum fat percentage (13-39%)';
COMMENT ON COLUMN public.profiles.fat_max_percent IS 'Maximum fat percentage (13-39%)';
COMMENT ON COLUMN public.profiles.carb_min_percent IS 'Minimum carbohydrate percentage (35-68%)';
COMMENT ON COLUMN public.profiles.carb_max_percent IS 'Maximum carbohydrate percentage (35-68%)';
COMMENT ON COLUMN public.profiles.protein_min_percent IS 'Minimum protein percentage (19-26%)';
COMMENT ON COLUMN public.profiles.protein_max_percent IS 'Maximum protein percentage (19-26%)';
