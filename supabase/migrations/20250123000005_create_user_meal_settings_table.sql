-- Create user_meal_settings table for storing meal configurations per profile
-- This allows each profile to have its own meal structure and calorie distribution

CREATE TABLE IF NOT EXISTS public.user_meal_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  meal_order INTEGER NOT NULL CHECK (meal_order >= 0),
  percentage_of_daily_calories NUMERIC NOT NULL CHECK (percentage_of_daily_calories >= 0 AND percentage_of_daily_calories <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique meal order per profile
  CONSTRAINT unique_meal_order_per_profile UNIQUE(profile_id, meal_order),
  -- Ensure unique meal name per profile
  CONSTRAINT unique_meal_name_per_profile UNIQUE(profile_id, meal_name)
);

-- Enable RLS
ALTER TABLE public.user_meal_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own meal settings"
  ON public.user_meal_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal settings"
  ON public.user_meal_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meal settings"
  ON public.user_meal_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal settings"
  ON public.user_meal_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meal_settings_profile_id ON public.user_meal_settings(profile_id);
CREATE INDEX IF NOT EXISTS idx_meal_settings_profile_order ON public.user_meal_settings(profile_id, meal_order);

-- Create trigger for updated_at
CREATE TRIGGER update_user_meal_settings_updated_at
  BEFORE UPDATE ON public.user_meal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.user_meal_settings IS 'Meal configuration settings per profile - meal names, order, and calorie distribution';
COMMENT ON COLUMN public.user_meal_settings.profile_id IS 'Reference to the profile this meal setting belongs to';
COMMENT ON COLUMN public.user_meal_settings.meal_name IS 'Name of the meal (e.g., Frukost, Lunch, Middag)';
COMMENT ON COLUMN public.user_meal_settings.meal_order IS 'Order of the meal in the day (0-indexed)';
COMMENT ON COLUMN public.user_meal_settings.percentage_of_daily_calories IS 'Percentage of daily calories allocated to this meal';
