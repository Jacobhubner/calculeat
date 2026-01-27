-- Make food_item_id nullable in recipes table
-- This allows recipes to be created without immediately linking to a food_item
-- The food_item will be created when the recipe is saved with calculated nutrition

ALTER TABLE public.recipes
  ALTER COLUMN food_item_id DROP NOT NULL;
