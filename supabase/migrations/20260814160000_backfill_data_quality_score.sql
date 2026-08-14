-- =========================================================
-- MIGRATION: Fyll i data_quality_score för SLV och CoFID
-- Datum: 2026-08-14
--
-- data_quality_score viktar rankingen i search_food_items:
--   * COALESCE(fi.data_quality_score, 100) / 100.0
--
-- Bara import_usda.cjs satte fältet. SLV och CoFID lämnade det NULL, vilket
-- via COALESCE gav dem full poäng (100) — CoFID rankades alltså som 100 trots
-- att registret säger 95, och USDA:s SR Legacy-poster (88) hamnade
-- systematiskt lägre än de två andra källorna utan att det var avsett.
--
-- Värdena speglar defaultQualityScore i src/lib/constants/dataSources.ts.
-- Importskripten sätter dem numera själva; den här migrationen rättar rader
-- som redan finns.
--
-- OBS: satserna nedan träffade ingenting i praktiken. Kolumnen har
-- DEFAULT 100 sedan 20260601000000, så importerade rader är aldrig NULL.
-- Rättat i 20260814161000, som riktar sig mot värdet i stället.
-- =========================================================

-- SLV = 100: nationell databas med löpande uppdaterade analysvärden
UPDATE public.food_items
SET data_quality_score = 100
WHERE source = 'livsmedelsverket'
  AND user_id IS NULL
  AND data_quality_score IS NULL;

-- CoFID = 95: analytiska värden från Public Health England, men delvis
-- äldre mätningar än SLV:s
UPDATE public.food_items
SET data_quality_score = 95
WHERE source = 'cofid'
  AND user_id IS NULL
  AND data_quality_score IS NULL;
