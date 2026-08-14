-- =========================================================
-- MIGRATION: Lägg till CoFID som datakälla
-- Datum: 2026-08-14
--
-- CoFID = McCance and Widdowson's Composition of Foods Integrated Dataset,
-- den brittiska motsvarigheten till Livsmedelsverket och USDA. Publicerad av
-- Public Health England under Open Government Licence v3.0, som tillåter
-- kommersiell användning mot attribution (se villkoren §9).
--
-- Tack vare food_data_sources-tabellen (20260814130000) räcker det med en
-- INSERT här — search_food_items behöver inte röras.
--
-- Kör scripts/import-cofid.ts efter den här migrationen för att fylla på data.
-- =========================================================

-- ALTER TYPE ... ADD VALUE kan inte köras i samma transaktion som något som
-- använder värdet. Därför en egen sats före INSERT:en nedan.
ALTER TYPE food_source ADD VALUE IF NOT EXISTS 'cofid';
