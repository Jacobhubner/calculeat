-- =========================================================
-- FIX: återställ de tre feature-nycklarna som tappades i
-- 20260725020000_lower_free_saved_meals_to_3.
--
-- Den migrationen skrev om HELA get_plan_limits() för att sänka
-- saved_meals 10→3, men utgick från en gammal funktionskropp och
-- tappade food_suggestions, all_diet_modes och recipe_bank_full —
-- nycklar som lagts till i 20260718 / 20260719 / 20260721.
--
-- Konsekvens i produktion: dessa tre kom tillbaka som NULL i JSON:en →
-- PremiumGate läste `undefined` (falsy) → funktionerna låstes för ALLA,
-- även founders/premium ("Vad ska jag äta?", kostlägen, receptbanken).
--
-- Denna migration återställer alla tre nycklarna OCH behåller det
-- avsiktliga saved_meals=3-taket. Ingen datapåverkan (ren funktion).
--
-- Källordning (docs/PREMIUM_SPEC.md): denna funktion är sanningen för
-- enforcement; src/lib/constants/entitlements.ts är UI-spegeln och har
-- redan alla tre nycklarna. Håll dem i synk.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_plan_limits(p_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_plan IN ('premium', 'founder') THEN jsonb_build_object(
      'saved_meals', -1,
      'recipes', -1,
      'recipe_images', true,
      'history_days', -1,
      'csv_export', true,
      'advanced_trends', true,
      'period_stats', true,
      'all_tdee_formulas', true,
      'calibrations_per_quarter', -1,
      'advanced_body_comp', true,
      'genetic_potential', true,
      'owned_shared_lists', -1,
      'label_scans_per_month', -1,
      'food_suggestions', true,
      'all_diet_modes', true,
      'recipe_bank_full', true
    )
    ELSE jsonb_build_object(
      'saved_meals', 3,
      'recipes', 3,
      'recipe_images', false,
      'history_days', 30,
      'csv_export', false,
      'advanced_trends', false,
      'period_stats', false,
      'all_tdee_formulas', false,
      'calibrations_per_quarter', 1,
      'advanced_body_comp', false,
      'genetic_potential', false,
      'owned_shared_lists', 1,
      'label_scans_per_month', 5,
      'food_suggestions', false,
      'all_diet_modes', false,
      'recipe_bank_full', false
    )
  END;
$$;
