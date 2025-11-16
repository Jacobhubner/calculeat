-- Add support for multiple profiles per user
-- Migration created: 2025-01-16
-- Purpose: Allow users to create, manage, and switch between multiple profiles

-- Step 1: Create new profiles table (many-to-one relationship with users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile metadata
  profile_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,

  -- Personal information (from user_profiles)
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg NUMERIC CHECK (weight_kg > 0 AND weight_kg < 500),

  -- BMR Formula settings (using exact same values as user_profiles)
  bmr_formula TEXT CHECK (bmr_formula IN (
    'Mifflin-St Jeor equation',
    'Cunningham equation',
    'Oxford/Henry equation',
    'Schofield equation',
    'Revised Harris-Benedict equation',
    'Original Harris-Benedict equation',
    'MacroFactor standard equation',
    'MacroFactor FFM equation',
    'MacroFactor athlete equation',
    'Fitness Stuff Podcast equation'
  )),

  -- PAL System settings (using exact same values as user_profiles)
  pal_system TEXT CHECK (pal_system IN (
    'FAO/WHO/UNU based PAL values',
    'DAMNRIPPED PAL values',
    'Pro Physique PAL values',
    'Fitness Stuff PAL values',
    'Basic internet PAL values',
    'Custom PAL'
  )),

  activity_level TEXT CHECK (activity_level IN (
    'Sedentary',
    'Lightly active',
    'Moderately active',
    'Very active',
    'Extremely active'
  )),

  intensity_level TEXT CHECK (intensity_level IN (
    'None',
    'Light',
    'Moderate',
    'Difficult',
    'Intense'
  )),

  -- Training details for PAL calculation
  training_frequency_per_week NUMERIC CHECK (training_frequency_per_week >= 0 AND training_frequency_per_week <= 14),
  training_duration_minutes NUMERIC CHECK (training_duration_minutes >= 0 AND training_duration_minutes <= 300),
  daily_steps TEXT CHECK (daily_steps IN (
    '3 000 – 4 999 steps/day',
    '5 000 – 6 999 steps/day',
    '7 000 – 8 999 steps/day',
    '9 000 – 10 999 steps/day',
    '11 000 – 12 999 steps/day',
    '≥ 13 000 steps/day'
  )),
  custom_pal NUMERIC CHECK (custom_pal >= 1.0 AND custom_pal <= 3.0),

  -- Body composition
  body_fat_percentage NUMERIC CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  body_composition_method TEXT CHECK (body_composition_method IN (
    'Jackson/Pollock 3 Caliper Method (Male)',
    'Jackson/Pollock 3 Caliper Method (Female)',
    'Jackson/Pollock 4 Caliper Method',
    'Jackson/Pollock 7 Caliper Method',
    'Durnin/Womersley Caliper Method',
    'Parillo Caliper Method',
    'Covert Bailey Measuring Tape Method',
    'U.S. Navy Body Fat Formula',
    'YMCA Measuring Tape Method',
    'Modified YMCA Measuring Tape Method',
    'Heritage BMI to Body Fat Method',
    'Reversed Cunningham equation'
  )),

  -- Calculated values
  bmr NUMERIC,
  tdee NUMERIC,

  -- Goals (using exact same values as user_profiles)
  calorie_goal TEXT CHECK (calorie_goal IN (
    'Maintain weight',
    'Weight loss',
    'Weight gain',
    'Custom TDEE'
  )),
  deficit_level TEXT CHECK (deficit_level IN (
    '10-15%',
    '20-25%',
    '25-30%'
  )),
  custom_tdee NUMERIC CHECK (custom_tdee >= 500 AND custom_tdee <= 10000),
  target_weight_kg NUMERIC CHECK (target_weight_kg > 0 AND target_weight_kg < 500),
  target_body_fat_percentage NUMERIC CHECK (target_body_fat_percentage >= 3 AND target_body_fat_percentage <= 50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_profile_name_per_user UNIQUE(user_id, profile_name),
  CONSTRAINT at_least_one_char_in_name CHECK (LENGTH(TRIM(profile_name)) > 0)
);

-- Step 2: Migrate existing data from user_profiles to profiles
-- Only migrate profiles that have meaningful data (not just email/name)
INSERT INTO public.profiles (
  user_id,
  profile_name,
  is_active,
  birth_date,
  gender,
  height_cm,
  weight_kg,
  bmr_formula,
  pal_system,
  activity_level,
  intensity_level,
  training_frequency_per_week,
  training_duration_minutes,
  daily_steps,
  custom_pal,
  body_fat_percentage,
  body_composition_method,
  bmr,
  tdee,
  calorie_goal,
  deficit_level,
  custom_tdee,
  created_at,
  updated_at
)
SELECT
  id AS user_id,
  COALESCE(profile_name, 'Min Profil') AS profile_name,
  true AS is_active,  -- Existing profile is active by default
  birth_date,
  gender,
  height_cm,
  weight_kg,
  bmr_formula,
  pal_system,
  activity_level,
  intensity_level,
  training_frequency_per_week,
  training_duration_minutes,
  daily_steps,
  custom_pal,
  body_fat_percentage,
  body_composition_method,
  bmr,
  tdee,
  calorie_goal,
  deficit_level,
  custom_tdee,
  created_at,
  updated_at
FROM public.user_profiles
WHERE birth_date IS NOT NULL OR height_cm IS NOT NULL OR weight_kg IS NOT NULL
  OR bmr IS NOT NULL OR tdee IS NOT NULL;

-- Step 3: Add active_profile_id to user_profiles for quick reference
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS active_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 4: Set active_profile_id for users who have migrated profiles
UPDATE public.user_profiles up
SET active_profile_id = p.id
FROM public.profiles p
WHERE up.id = p.user_id
  AND p.is_active = true;

-- Step 5: Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for profiles
CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_active ON public.profiles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON public.profiles(user_id, profile_name);

-- Step 9: Add comments for documentation
COMMENT ON TABLE public.profiles IS 'Multiple profiles per user for different goals (bulking, cutting, maintenance, etc.)';
COMMENT ON COLUMN public.profiles.user_id IS 'Reference to auth.users - owner of this profile';
COMMENT ON COLUMN public.profiles.profile_name IS 'Display name for the profile (e.g., "Bulking 2025", "Summer Cut")';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether this profile is currently active for the user';
COMMENT ON COLUMN public.user_profiles.active_profile_id IS 'Quick reference to the currently active profile';

-- Step 10: Create function to ensure only one active profile per user
CREATE OR REPLACE FUNCTION public.ensure_one_active_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a profile as active, deactivate all other profiles for this user
  IF NEW.is_active = true THEN
    UPDATE public.profiles
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;

    -- Update user_profiles.active_profile_id
    UPDATE public.user_profiles
    SET active_profile_id = NEW.id
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger to enforce one active profile
CREATE TRIGGER enforce_one_active_profile
  AFTER INSERT OR UPDATE OF is_active ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.ensure_one_active_profile();
