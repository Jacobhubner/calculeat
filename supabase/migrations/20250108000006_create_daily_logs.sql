-- Daily logs (from Today/Yesterday/History sheets)
-- Stores daily nutrition tracking

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  log_date date NOT NULL,
  is_completed boolean DEFAULT false, -- Set to true when "Finish Day" is clicked

  -- Daily totals (calculated from meal_entries)
  total_calories numeric(10, 2) DEFAULT 0,
  total_fat_g numeric(10, 2) DEFAULT 0,
  total_carb_g numeric(10, 2) DEFAULT 0,
  total_protein_g numeric(10, 2) DEFAULT 0,
  kcal_per_gram numeric(10, 4),

  -- Noom tracking
  green_calories numeric(10, 2) DEFAULT 0,
  yellow_calories numeric(10, 2) DEFAULT 0,
  orange_calories numeric(10, 2) DEFAULT 0,

  -- Goals for this day (snapshot from user profile)
  goal_calories_min numeric(10, 2),
  goal_calories_max numeric(10, 2),
  goal_fat_min_g numeric(10, 2),
  goal_fat_max_g numeric(10, 2),
  goal_carb_min_g numeric(10, 2),
  goal_carb_max_g numeric(10, 2),
  goal_protein_min_g numeric(10, 2),
  goal_protein_max_g numeric(10, 2),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One log per user per day
  UNIQUE(user_id, log_date)
);

-- Meal entries (dynamic number based on user_meal_settings)
CREATE TABLE IF NOT EXISTS public.meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id uuid NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  meal_name text NOT NULL,
  meal_order integer NOT NULL,

  -- Meal totals
  meal_calories numeric(10, 2) DEFAULT 0,
  meal_fat_g numeric(10, 2) DEFAULT 0,
  meal_carb_g numeric(10, 2) DEFAULT 0,
  meal_protein_g numeric(10, 2) DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(daily_log_id, meal_order)
);

-- Meal entry items (individual food items in a meal)
CREATE TABLE IF NOT EXISTS public.meal_entry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_entry_id uuid NOT NULL REFERENCES public.meal_entries(id) ON DELETE CASCADE,
  food_item_id uuid NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,

  amount numeric(10, 2) NOT NULL,
  unit text NOT NULL,
  weight_grams numeric(10, 2),

  -- Calculated nutrition
  calories numeric(10, 2),
  fat_g numeric(10, 2),
  carb_g numeric(10, 2),
  protein_g numeric(10, 2),

  item_order integer NOT NULL,

  created_at timestamptz DEFAULT now(),

  UNIQUE(meal_entry_id, item_order)
);

-- Enable RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entry_items ENABLE ROW LEVEL SECURITY;

-- Daily logs policies
CREATE POLICY "Users can view own daily logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON public.daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
  ON public.daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Meal entries policies
CREATE POLICY "Users can view own meal entries"
  ON public.meal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal entries"
  ON public.meal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal entries"
  ON public.meal_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal entries"
  ON public.meal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Meal entry items policies
CREATE POLICY "Users can view own meal entry items"
  ON public.meal_entry_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
        AND meal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal entry items"
  ON public.meal_entry_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
        AND meal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meal entry items"
  ON public.meal_entry_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
        AND meal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal entry items"
  ON public.meal_entry_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
        AND meal_entries.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_entries_updated_at
  BEFORE UPDATE ON public.meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX idx_daily_logs_log_date ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX idx_daily_logs_completed ON public.daily_logs(user_id, is_completed);
CREATE INDEX idx_meal_entries_daily_log_id ON public.meal_entries(daily_log_id);
CREATE INDEX idx_meal_entries_user_id ON public.meal_entries(user_id);
CREATE INDEX idx_meal_entry_items_meal_entry_id ON public.meal_entry_items(meal_entry_id);
CREATE INDEX idx_meal_entry_items_food_item_id ON public.meal_entry_items(food_item_id);
