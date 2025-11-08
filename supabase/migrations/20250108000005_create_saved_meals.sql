-- Saved meals (from Meals sheet)
-- User-created meal templates that can be loaded into daily logs

CREATE TABLE IF NOT EXISTS public.saved_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, name)
);

-- Saved meal items (up to 10 from Excel, but unlimited here)
CREATE TABLE IF NOT EXISTS public.saved_meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id uuid NOT NULL REFERENCES public.saved_meals(id) ON DELETE CASCADE,
  food_item_id uuid NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,

  amount numeric(10, 2) NOT NULL,
  unit text NOT NULL,
  weight_grams numeric(10, 2),

  item_order integer NOT NULL,

  created_at timestamptz DEFAULT now(),

  UNIQUE(saved_meal_id, item_order)
);

-- Enable RLS
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meal_items ENABLE ROW LEVEL SECURITY;

-- Saved meals policies
CREATE POLICY "Users can view own saved meals"
  ON public.saved_meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved meals"
  ON public.saved_meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved meals"
  ON public.saved_meals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved meals"
  ON public.saved_meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Saved meal items policies
CREATE POLICY "Users can view own saved meal items"
  ON public.saved_meal_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_meals
      WHERE saved_meals.id = saved_meal_items.saved_meal_id
        AND saved_meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own saved meal items"
  ON public.saved_meal_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.saved_meals
      WHERE saved_meals.id = saved_meal_items.saved_meal_id
        AND saved_meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own saved meal items"
  ON public.saved_meal_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_meals
      WHERE saved_meals.id = saved_meal_items.saved_meal_id
        AND saved_meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own saved meal items"
  ON public.saved_meal_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_meals
      WHERE saved_meals.id = saved_meal_items.saved_meal_id
        AND saved_meals.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_saved_meals_updated_at
  BEFORE UPDATE ON public.saved_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_saved_meals_user_id ON public.saved_meals(user_id);
CREATE INDEX idx_saved_meal_items_saved_meal_id ON public.saved_meal_items(saved_meal_id);
CREATE INDEX idx_saved_meal_items_food_item_id ON public.saved_meal_items(food_item_id);
