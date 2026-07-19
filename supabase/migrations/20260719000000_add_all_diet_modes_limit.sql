-- =========================================================
-- Ny plan-gräns: all_diet_modes (Kostlägen i profilen).
-- Gratis: endast NNR Mode. Premium: alla 5 (NNR, Weight Loss,
-- Active, Off-Season, On-Season) inkl. källreferens-modaler.
-- Endast UI-enforcement (egen profildata).
-- Spegel: src/lib/constants/entitlements.ts + docs/PREMIUM_SPEC.md.
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
      'all_diet_modes', true
    )
    ELSE jsonb_build_object(
      'saved_meals', 10,
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
      'all_diet_modes', false
    )
  END;
$$;
