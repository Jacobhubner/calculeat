-- =========================================================
-- Premium-omläggning: kostlägen blir GRATIS, fasplanering blir PREMIUM
-- Date: 2026-08-15
--
-- BESLUT 2026-08-15 — ERSÄTTER beslut 2026-07-19 om all_diet_modes.
--
-- Varför gränsen flyttas:
-- Kostlägen är ett ENGÅNGSVAL — man applicerar en makrofördelning och sedan
-- är det gjort. Svag återkommande nytta för en månadsprenumeration. Faser
-- ger nytta VARJE VECKA: veckoräknare, progress, upptrappning, guidade
-- fasbyten. Det matchar 45 kr/mån betydligt bättre.
--
-- Den gamla gränsen skar dessutom mitt i en naturlig helhet: gratis fick
-- Weight Loss Mode men inte On-Season — två varianter av samma sak,
-- godtyckligt delade. Nu är ALLA makrofördelningar fria och det som säljs
-- är planeringen över tid.
--
-- Fasen pekar ut ett kostläge (Deff/Bulk/Aktiv/NNR) och hämtar kalori- och
-- proteinmål därifrån (se src/lib/calculations/dietPhases.ts). Med
-- kostlägena fria får varje gratisanvändare rätt siffror — det som kostar
-- är att appen driver planen åt en över tid.
--
-- GRÄNSEN, konkret:
--   Gratis:  välja fas, kalorimål, proteinmål, veckoräknare, byta fas
--   Premium: fashistorik, planerad längd + progressbar, guidat nästa steg,
--            reverse dietens veckoupptrappning
--
-- NAMNVALET `diet_phase_planning` (inte ..._history): nyckeln gate:ar fyra
-- saker och historik är bara en av dem. Reverse-motorn är den starkaste
-- konverteringsdrivaren — den beräknar ett nytt kalorimål varje vecka, något
-- ingen kan reproducera för hand — och får inte gömmas bakom ett namn som
-- säger "historik".
--
-- Varför kalorimålet ALDRIG gate:as: MyFitnessPal ger kalorimål gratis. En
-- användare som möter ett lås på "hur mycket ska jag äta under min cut"
-- jämför direkt med MFP och förlorar Calculeat. Med den här gränsen ligger
-- gratisnivån ÖVER MFP:s, som tar betalt för hela makromålet.
--
-- VARNING (tech_debt_get_plan_limits_key_loss): funktionen skrivs om i sin
-- helhet varje gång och tappade 3 nycklar 2026-07-26, vilket låste
-- funktioner för ALLA. Nyckeluppsättningen är verifierad mot produktion
-- 2026-08-15: 18 befintliga + 1 ny = 19, identiska i free och premium.
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
$$;
