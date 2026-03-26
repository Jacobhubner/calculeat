-- =========================================================
-- MIGRATION: Backfill snapshot_calories/fat/carb/protein
-- Date: 2026-03-26
-- Problem: Ingredienser skapade innan snapshot-kolumnerna
--   implementerades har snapshot_calories = NULL, vilket gör
--   att varningen "Ett eller flera livsmedel har uppdaterats"
--   aldrig visas när man redigerar receptet.
-- Fix: Fyll i nuvarande värden från food_items som startpunkt.
--   Nästa gång livsmedlet ändras och receptet sparas om
--   uppdateras snapshot till det nya värdet automatiskt.
-- =========================================================

UPDATE recipe_ingredients ri
SET
  snapshot_calories  = fi.calories,
  snapshot_fat_g     = fi.fat_g,
  snapshot_carb_g    = fi.carb_g,
  snapshot_protein_g = fi.protein_g
FROM food_items fi
WHERE ri.food_item_id = fi.id
  AND (
    ri.snapshot_calories  IS NULL OR
    ri.snapshot_fat_g     IS NULL OR
    ri.snapshot_carb_g    IS NULL OR
    ri.snapshot_protein_g IS NULL
  );
