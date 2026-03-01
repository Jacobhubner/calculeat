-- =========================================================
-- MIGRATION: Fas 1 — GIN trigram-index + global_food_id index
-- Date: 2026-03-01
--
-- VIKTIGT: Denna fil innehåller CREATE INDEX CONCURRENTLY.
-- CONCURRENTLY kräver att SQL körs utanför en transaktion.
-- Supabase CLI wrappar migrations i en implicit transaktion —
-- om deploy misslyckas med "cannot run inside a transaction block":
--   Kör dessa statements manuellt i Supabase Studio SQL Editor.
-- =========================================================

-- pg_trgm extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN-index på food_items.name — accelererar similarity() och ILIKE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_food_items_name_trgm
  ON public.food_items USING GIN (name gin_trgm_ops);

-- GIN-index på food_items.brand — accelererar brand-sökning
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_food_items_brand_trgm
  ON public.food_items USING GIN (brand gin_trgm_ops);

-- Index på global_food_id — accelererar shadowing EXISTS-subquery i search_food_items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_food_items_global_food_id
  ON public.food_items (global_food_id)
  WHERE global_food_id IS NOT NULL;
