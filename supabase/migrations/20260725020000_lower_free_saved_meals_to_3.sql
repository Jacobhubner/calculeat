-- Sänker gratistaket för sparade måltider från 10 → 3 (beslut 2026-07-25).
-- Sparade måltider är en stark bekvämlighetsfunktion; 10 var för högt för att
-- fungera som premium-drivande gate inför hard launch.
--
-- Endast get_plan_limits() ändras. Enforcement-triggern (trg_enforce_saved_meals_quota)
-- läser limiten live via get_plan_limits() och behöver inte röras.
-- INGEN dataförlust: triggern är BEFORE INSERT (count(*) >= limit) — befintliga
-- rader raderas inte, gratisanvändare över taket kan bara inte lägga till fler.
--
-- Håll i synk: docs/PREMIUM_SPEC.md + src/lib/constants/entitlements.ts (FREE_LIMITS).

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
      'label_scans_per_month', -1
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
      'label_scans_per_month', 5
    )
  END;
$$;
