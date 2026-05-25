-- =========================================================
-- MIGRATION: Add data quality metadata + fix global uniqueness
-- Date: 2026-06-01
-- Description:
--   1. Adds data_quality_score, external_id, imported_at, import_version
--      to food_items — generic fields used by all external datasources.
--   2. Fixes global uniqueness constraint to allow same name from
--      different sources (e.g. SLV "Banan" + USDA "Banan").
--   3. Adds unique index on (source, external_id) for idempotent UPSERT.
-- =========================================================

-- 1. New metadata columns
ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS data_quality_score int DEFAULT 100
    CHECK (data_quality_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS import_version text;

-- 2. Backfill quality scores for existing global items
UPDATE public.food_items
  SET data_quality_score = 100
  WHERE user_id IS NULL
    AND shared_list_id IS NULL
    AND source = 'livsmedelsverket'
    AND data_quality_score IS NULL;

UPDATE public.food_items
  SET data_quality_score = 100
  WHERE user_id IS NULL
    AND shared_list_id IS NULL
    AND source = 'manual'
    AND data_quality_score IS NULL;

UPDATE public.food_items
  SET data_quality_score = 70
  WHERE user_id IS NOT NULL
    AND data_quality_score IS NULL;

-- 3. Drop old global uniqueness constraint (name-only, blocks multi-source)
DROP INDEX IF EXISTS idx_food_items_global_name;

-- 4. New global uniqueness: unique per (source, name) — allows SLV + USDA same name
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_global_source_name
  ON public.food_items(source, name)
  WHERE user_id IS NULL AND shared_list_id IS NULL;

-- 5. Unique index for idempotent UPSERT on external imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_external_source
  ON public.food_items(source, external_id)
  WHERE external_id IS NOT NULL AND user_id IS NULL AND shared_list_id IS NULL;

COMMENT ON COLUMN public.food_items.data_quality_score IS
  'Quality score 0–100. SLV=100, USDA Foundation>=90, USDA SR Legacy=88, user=70. Used for ranking and future trust UI.';
COMMENT ON COLUMN public.food_items.external_id IS
  'External database ID (e.g. USDA FDC fdcId). Used as UPSERT key for idempotent imports.';
COMMENT ON COLUMN public.food_items.imported_at IS
  'Timestamp of last import/update from external source.';
COMMENT ON COLUMN public.food_items.import_version IS
  'Version string identifying the import batch (e.g. ''foundation-2024-04'', ''sr-legacy-2018'').';
