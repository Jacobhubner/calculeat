-- Food items table (from Items sheet)
-- Supports both regular foods and recipes

CREATE TABLE IF NOT EXISTS public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global items

  -- Basic info
  is_recipe boolean DEFAULT false,
  name text NOT NULL,

  -- Standard serving
  default_amount numeric(10, 2) NOT NULL DEFAULT 100,
  default_unit text NOT NULL DEFAULT 'g',

  -- Nutrition per default amount
  calories numeric(10, 2) NOT NULL,
  fat_g numeric(10, 2) NOT NULL,
  carb_g numeric(10, 2) NOT NULL,
  protein_g numeric(10, 2) NOT NULL,

  -- Calculated values (per gram)
  kcal_per_gram numeric(10, 4),

  -- Noom category
  noom_food_type text CHECK (noom_food_type IN ('Solid', 'Liquid', 'Soup')),
  noom_color text CHECK (noom_color IN ('Green', 'Yellow', 'Orange')),

  -- Unit conversions
  grams_per_unit numeric(10, 4), -- how many grams in one unit
  kcal_per_unit numeric(10, 2),
  fat_per_unit numeric(10, 4),
  carb_per_unit numeric(10, 4),
  protein_per_unit numeric(10, 4),

  -- For liquids
  ml_per_gram numeric(10, 4),

  -- For pieces
  grams_per_piece numeric(10, 2),

  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure unique names per user (global items have NULL user_id)
  UNIQUE NULLS NOT DISTINCT (user_id, name)
);

-- Enable RLS
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can see global items (user_id IS NULL) and their own items
CREATE POLICY "Users can view global and own food items"
  ON public.food_items
  FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own food items"
  ON public.food_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food items"
  ON public.food_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food items"
  ON public.food_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_food_items_updated_at
  BEFORE UPDATE ON public.food_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-calculate nutrition per unit/gram
CREATE OR REPLACE FUNCTION calculate_food_item_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate kcal per gram
  IF NEW.default_unit = 'g' AND NEW.default_amount > 0 THEN
    NEW.kcal_per_gram := NEW.calories / NEW.default_amount;
  ELSIF NEW.grams_per_unit IS NOT NULL AND NEW.grams_per_unit > 0 THEN
    NEW.kcal_per_gram := NEW.calories / (NEW.default_amount * NEW.grams_per_unit);
  END IF;

  -- Calculate per unit values if grams_per_unit is set
  IF NEW.grams_per_unit IS NOT NULL AND NEW.grams_per_unit > 0 THEN
    NEW.kcal_per_unit := NEW.kcal_per_gram * NEW.grams_per_unit;
    NEW.fat_per_unit := (NEW.fat_g / NEW.default_amount) * NEW.grams_per_unit;
    NEW.carb_per_unit := (NEW.carb_g / NEW.default_amount) * NEW.grams_per_unit;
    NEW.protein_per_unit := (NEW.protein_g / NEW.default_amount) * NEW.grams_per_unit;
  END IF;

  -- Auto-assign Noom color based on food type and kcal/gram
  IF NEW.noom_food_type IS NOT NULL AND NEW.kcal_per_gram IS NOT NULL THEN
    IF NEW.noom_food_type = 'Solid' THEN
      IF NEW.kcal_per_gram < 1 THEN
        NEW.noom_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 2.4 THEN
        NEW.noom_color := 'Yellow';
      ELSE
        NEW.noom_color := 'Orange';
      END IF;
    ELSIF NEW.noom_food_type = 'Liquid' THEN
      IF NEW.kcal_per_gram < 0.4 THEN
        NEW.noom_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 0.5 THEN
        NEW.noom_color := 'Yellow';
      ELSE
        NEW.noom_color := 'Orange';
      END IF;
    ELSIF NEW.noom_food_type = 'Soup' THEN
      IF NEW.kcal_per_gram < 0.5 THEN
        NEW.noom_color := 'Green';
      ELSIF NEW.kcal_per_gram <= 1 THEN
        NEW.noom_color := 'Yellow';
      ELSE
        NEW.noom_color := 'Orange';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate nutrition
CREATE TRIGGER calculate_food_item_nutrition_trigger
  BEFORE INSERT OR UPDATE ON public.food_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_food_item_nutrition();

-- Indexes
CREATE INDEX idx_food_items_user_id ON public.food_items(user_id);
CREATE INDEX idx_food_items_name ON public.food_items(name);
CREATE INDEX idx_food_items_is_recipe ON public.food_items(is_recipe);
CREATE INDEX idx_food_items_noom_color ON public.food_items(noom_color);
