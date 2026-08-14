-- =========================================================
-- MIGRATION: Tillåt 'cofid' i chk_source_valid
-- Datum: 2026-08-14
--
-- food_items.source skyddas av en CHECK-constraint utöver enum-typen
-- (20260301000006). Den listar tillåtna källor explicit och kände inte till
-- 'cofid', så importen avvisades med:
--   new row for relation "food_items" violates check constraint "chk_source_valid"
--
-- Constraintet ligger kvar snarare än tas bort: det fångar felstavade källor
-- som enum-typen ensam skulle släppa igenom via cast.
--
-- NOT VALID + VALIDATE i två steg, som originalmigrationen — undviker att
-- hela tabellen låses under omvalideringen.
-- =========================================================

ALTER TABLE public.food_items
  DROP CONSTRAINT IF EXISTS chk_source_valid;

ALTER TABLE public.food_items
  ADD CONSTRAINT chk_source_valid CHECK (
    source IS NULL
    OR source IN ('manual', 'livsmedelsverket', 'usda', 'cofid', 'user', 'shared')
  ) NOT VALID;

ALTER TABLE public.food_items
  VALIDATE CONSTRAINT chk_source_valid;
