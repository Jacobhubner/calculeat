-- Ångrar premiumlåset på metodbeskrivningen (infört samma dag).
--
-- BESLUT 2026-08-19: modalen förklarar HUR tidsberäkningen fungerar och
-- vilka källor den vilar på. Det är en metod- och källredovisning, inte en
-- funktion — och synlighetsprincipen i PREMIUM_SPEC.md säger att
-- informationen aldrig är premium, bara funktionen. En användare som jämför
-- med en annan kalkylator och får färre veckor måste kunna kontrollera varför.
--
-- Nyckeln tas bort helt i stället för att sättas till true i båda grenarna:
-- en nyckel som alltid är sann är en gräns som ser ut att finnas men inte gör
-- det, och sådana blir kvar för evigt (jfr all_diet_modes, som fortfarande
-- ligger kvar deprecated).
--
-- ⚠️ Antal nycklar: 20 före, 19 efter — tillbaka till samma uppsättning som
-- PlanLimits hade innan.

CREATE OR REPLACE FUNCTION public.get_plan_limits(p_plan text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
AS $function$
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
      'free_calibration_grace', -1,
      'calibration_interval_days', 0,
      'advanced_body_comp', true,
      'genetic_potential', true,
      'owned_shared_lists', -1,
      'label_scans_per_month', -1,
      'food_suggestions', true,
      'all_diet_modes', true,
      'recipe_bank_full', true,
      'diet_phase_planning', true
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
      'free_calibration_grace', 2,
      'calibration_interval_days', 180,
      'advanced_body_comp', false,
      'genetic_potential', false,
      'owned_shared_lists', 1,
      'label_scans_per_month', 5,
      'food_suggestions', false,
      -- ÄNDRAD 2026-08-15: alla fem kostlägen fria (var false)
      'all_diet_modes', true,
      'recipe_bank_full', false,
      -- NY: fasplanering över tid är premium
      'diet_phase_planning', false
    )
  END;
$function$;
