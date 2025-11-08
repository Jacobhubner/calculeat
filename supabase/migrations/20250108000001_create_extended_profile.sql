-- Extended user profile for CalculEat
-- Stores all user data from Profile sheet

CREATE TABLE IF NOT EXISTS public.users_extended (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  date_of_birth date,
  sex text CHECK (sex IN ('Man', 'Woman')),
  height_cm numeric(5, 2), -- in centimeters
  weight_kg numeric(5, 2), -- in kilograms

  -- BMR & TDEE Settings
  bmr_formula text DEFAULT 'Mifflin-St Jeor equation' CHECK (bmr_formula IN (
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

  pal_system text DEFAULT 'FAO/WHO/UNU based PAL values' CHECK (pal_system IN (
    'FAO/WHO/UNU based PAL values',
    'DAMNRIPPED PAL values',
    'Pro Physique PAL values',
    'Fitness Stuff PAL values',
    'Basic internet PAL values',
    'Custom PAL'
  )),

  activity_level text DEFAULT 'Moderately active' CHECK (activity_level IN (
    'Sedentary',
    'Lightly active',
    'Moderately active',
    'Very active',
    'Extremely active'
  )),

  intensity_level text CHECK (intensity_level IN (
    'None',
    'Light',
    'Moderate',
    'Difficult',
    'Intense'
  )),

  -- For PAL systems that use these
  training_frequency_per_week integer,
  training_duration_minutes integer,
  daily_steps text,
  custom_pal_value numeric(3, 2),

  -- Body Composition (optional)
  body_fat_percentage numeric(4, 2),
  body_fat_method text,

  -- Calorie Goals
  calorie_goal_type text DEFAULT 'Weight maintain' CHECK (calorie_goal_type IN (
    'Weight maintain',
    'Weight gain',
    'Weight loss',
    'Custom TDEE'
  )),

  deficit_level text CHECK (deficit_level IN (
    'Small deficit',
    'Moderate deficit',
    'Large deficit'
  )),

  target_weight_kg numeric(5, 2),
  custom_tdee numeric(6, 0),

  -- Macro Preferences (stored as percentages)
  fat_min_percent integer DEFAULT 25,
  fat_max_percent integer DEFAULT 40,
  carb_min_percent integer DEFAULT 45,
  carb_max_percent integer DEFAULT 60,
  protein_min_percent integer DEFAULT 10,
  protein_max_percent integer DEFAULT 20,

  -- Profile Modes
  current_mode text CHECK (current_mode IN ('NNR', 'Off-Season', 'On-Season', 'Custom')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users_extended ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own extended profile"
  ON public.users_extended
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own extended profile"
  ON public.users_extended
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own extended profile"
  ON public.users_extended
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_users_extended_updated_at
  BEFORE UPDATE ON public.users_extended
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index
CREATE INDEX idx_users_extended_id ON public.users_extended(id);
