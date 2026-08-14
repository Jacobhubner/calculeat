-- =========================================================
-- MIGRATION: Registrera CoFID i food_data_sources
-- Datum: 2026-08-14
--
-- Separat från 20260814140000 därför att ALTER TYPE ... ADD VALUE inte får
-- användas i samma transaktion som det nya värdet — Postgres kräver att
-- enum-tillägget är committat först.
--
-- primary_locales: 'en-GB' är mer specifikt än USDA:s 'en', så
-- preferred_food_source_for_locale väljer CoFID för brittiska användare
-- medan en-US och en-AU fortsatt får USDA.
-- =========================================================

INSERT INTO public.food_data_sources (source_id, tab_key, include_in_all, primary_locales, sort_order)
VALUES ('cofid', 'cofid', true, ARRAY['en-GB'], 95)
ON CONFLICT (source_id) DO UPDATE
  SET tab_key         = EXCLUDED.tab_key,
      include_in_all  = EXCLUDED.include_in_all,
      primary_locales = EXCLUDED.primary_locales,
      sort_order      = EXCLUDED.sort_order;
