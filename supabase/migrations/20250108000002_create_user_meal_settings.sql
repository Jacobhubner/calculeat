-- User meal configuration (dynamic number of meals)
-- Replaces fixed 5-meal structure from Excel

CREATE TABLE IF NOT EXISTS public.user_meal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meal configuration
  meal_name text NOT NULL,
  meal_order integer NOT NULL, -- 1, 2, 3, etc.
  percentage_of_daily_calories integer NOT NULL CHECK (percentage_of_daily_calories >= 1 AND percentage_of_daily_calories <= 100),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure unique meal order per user
  UNIQUE(user_id, meal_order),
  -- Ensure unique meal name per user
  UNIQUE(user_id, meal_name)
);

-- Enable RLS
ALTER TABLE public.user_meal_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own meal settings"
  ON public.user_meal_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal settings"
  ON public.user_meal_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal settings"
  ON public.user_meal_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal settings"
  ON public.user_meal_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_meal_settings_updated_at
  BEFORE UPDATE ON public.user_meal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_user_meal_settings_user_id ON public.user_meal_settings(user_id);
CREATE INDEX idx_user_meal_settings_meal_order ON public.user_meal_settings(user_id, meal_order);

-- Function to validate total percentage equals 100
CREATE OR REPLACE FUNCTION validate_meal_percentages()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage integer;
BEGIN
  SELECT SUM(percentage_of_daily_calories) INTO total_percentage
  FROM public.user_meal_settings
  WHERE user_id = NEW.user_id
    AND (id != NEW.id OR NEW.id IS NULL);

  -- Add the new/updated percentage
  total_percentage := COALESCE(total_percentage, 0) + NEW.percentage_of_daily_calories;

  -- Allow partial setup, but warn if over 100
  IF total_percentage > 100 THEN
    RAISE EXCEPTION 'Total meal percentages cannot exceed 100%%';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate percentages
CREATE TRIGGER validate_meal_percentages_trigger
  BEFORE INSERT OR UPDATE ON public.user_meal_settings
  FOR EACH ROW
  EXECUTE FUNCTION validate_meal_percentages();
