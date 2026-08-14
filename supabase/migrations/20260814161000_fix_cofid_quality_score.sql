-- =========================================================
-- MIGRATION: Rätta CoFID:s kvalitetspoäng till 95
-- Datum: 2026-08-14
--
-- Föregående migration (20260814160000) hade villkoret
-- `AND data_quality_score IS NULL` och träffade därför ingenting:
-- kolumnen har DEFAULT 100 sedan 20260601000000, så importerade rader får
-- 100 automatiskt och blir aldrig NULL.
--
-- CoFID ska ha 95 enligt registret (defaultQualityScore i dataSources.ts).
-- SLV och manual ska ha 100, vilket de redan har via default — de rörs inte.
--
-- Villkoret riktar sig mot värdet 100 snarare än NULL, och begränsas till
-- rader som importskriptet skapat (external_id IS NOT NULL) så att eventuella
-- manuellt justerade poäng inte skrivs över.
-- =========================================================

UPDATE public.food_items
SET data_quality_score = 95
WHERE source = 'cofid'
  AND user_id IS NULL
  AND external_id IS NOT NULL
  AND data_quality_score = 100;
