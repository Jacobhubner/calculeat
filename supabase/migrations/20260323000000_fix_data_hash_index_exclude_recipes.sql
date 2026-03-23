-- =========================================================
-- MIGRATION: Exkludera recept från data_hash-uniqueindexet
-- Date: 2026-03-23
-- Problem: idx_food_items_user_data_hash täcker även is_recipe=true,
--   vilket gör att två recept med identiska makros krockar vid INSERT.
--   Indexet syftar till deduplicering av livsmedel vid delning — inte recept.
-- Fix: Lägg till AND is_recipe = false i det partiella indexet.
-- =========================================================

DROP INDEX IF EXISTS public.idx_food_items_user_data_hash;

CREATE UNIQUE INDEX idx_food_items_user_data_hash
  ON public.food_items(user_id, data_hash)
  WHERE user_id IS NOT NULL
    AND is_recipe = false;
