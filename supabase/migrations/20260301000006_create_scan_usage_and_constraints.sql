-- =========================================================
-- MIGRATION: Fas 1 — scan_usage, constraints, RLS-fix
-- Date: 2026-03-01
-- =========================================================

-- ---------------------------------------------------
-- 1. scan_usage-tabell
-- Refereras i useBarcodeLookup.ts men saknas i DB.
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scan_usage (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type   text        NOT NULL,
  success     boolean     NOT NULL,
  error_type  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_scan_type CHECK (scan_type IN ('barcode', 'nutrition_label'))
);

CREATE INDEX IF NOT EXISTS idx_scan_usage_user_created
  ON public.scan_usage (user_id, created_at DESC);

ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scan usage"
  ON public.scan_usage FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own scan usage"
  ON public.scan_usage FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------
-- 2. CHECK constraints på food_items — NOT VALID + VALIDATE
--
-- NOT VALID: lägger till constraint utan att scanna befintlig data
--   (snabb, kort lock)
-- VALIDATE CONSTRAINT: validerar befintlig data med SHARE UPDATE EXCLUSIVE
--   (tillåter läsningar, blockerar inte SELECT)
-- ---------------------------------------------------
ALTER TABLE public.food_items
  ADD CONSTRAINT chk_calories_non_negative   CHECK (calories >= 0)      NOT VALID,
  ADD CONSTRAINT chk_fat_g_non_negative      CHECK (fat_g >= 0)         NOT VALID,
  ADD CONSTRAINT chk_carb_g_non_negative     CHECK (carb_g >= 0)        NOT VALID,
  ADD CONSTRAINT chk_protein_g_non_negative  CHECK (protein_g >= 0)     NOT VALID,
  ADD CONSTRAINT chk_default_amount_positive CHECK (default_amount > 0) NOT VALID,
  ADD CONSTRAINT chk_source_valid            CHECK (
    source IS NULL
    OR source IN ('manual', 'livsmedelsverket', 'usda', 'user', 'shared')
  ) NOT VALID;

ALTER TABLE public.food_items
  VALIDATE CONSTRAINT chk_calories_non_negative,
  VALIDATE CONSTRAINT chk_fat_g_non_negative,
  VALIDATE CONSTRAINT chk_carb_g_non_negative,
  VALIDATE CONSTRAINT chk_protein_g_non_negative,
  VALIDATE CONSTRAINT chk_default_amount_positive,
  VALIDATE CONSTRAINT chk_source_valid;

-- ---------------------------------------------------
-- 3. Fixa RLS på meal_entry_items:
--    auth.uid() → (SELECT auth.uid()) i EXISTS-clauses
--    Utvärderas en gång per statement, inte per rad.
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Users can view own meal entry items"   ON public.meal_entry_items;
DROP POLICY IF EXISTS "Users can insert own meal entry items" ON public.meal_entry_items;
DROP POLICY IF EXISTS "Users can update own meal entry items" ON public.meal_entry_items;
DROP POLICY IF EXISTS "Users can delete own meal entry items" ON public.meal_entry_items;

CREATE POLICY "Users can view own meal entry items"
  ON public.meal_entry_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries me
      WHERE me.id = meal_entry_items.meal_entry_id
        AND me.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own meal entry items"
  ON public.meal_entry_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_entries me
      WHERE me.id = meal_entry_items.meal_entry_id
        AND me.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own meal entry items"
  ON public.meal_entry_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries me
      WHERE me.id = meal_entry_items.meal_entry_id
        AND me.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own meal entry items"
  ON public.meal_entry_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries me
      WHERE me.id = meal_entry_items.meal_entry_id
        AND me.user_id = (SELECT auth.uid())
    )
  );

COMMENT ON TABLE public.scan_usage IS
  'Loggar varje barcode- och nutrition_label-skanning per användare.
   Används för rate-limiting och statistik.';
