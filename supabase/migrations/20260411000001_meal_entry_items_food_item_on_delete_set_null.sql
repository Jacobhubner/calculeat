-- Change meal_entry_items.food_item_id FK from CASCADE to SET NULL so that
-- deleting a food item preserves the logged row in history (calories/macros/name
-- are already snapshotted; food_item_id becomes null but the entry survives).

-- Make the column nullable first
ALTER TABLE public.meal_entry_items
  ALTER COLUMN food_item_id DROP NOT NULL;

-- Replace the FK constraint
ALTER TABLE public.meal_entry_items
  DROP CONSTRAINT IF EXISTS meal_entry_items_food_item_id_fkey;

ALTER TABLE public.meal_entry_items
  ADD CONSTRAINT meal_entry_items_food_item_id_fkey
    FOREIGN KEY (food_item_id)
    REFERENCES public.food_items(id)
    ON DELETE SET NULL;
