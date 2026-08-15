-- =========================================================
-- Gratisnivån: två fria kalibreringar, därefter 1×/6 månader.
--
-- Tidigare regel: 1 kalibrering per kvartal (90 dagar) från allra första
-- kalibreringen. Konsekvens: en ny gratisanvändare fick aldrig uppleva
-- kalibreringsloopen (kalibrera → se TDEE justeras → förstå varför målet
-- ändrades) innan väggen kom. Loopen är produktens starkaste
-- differentierare mot MyFitnessPal/Lifesum/Yazio.
--
-- Ny regel för free:
--   Kalibrering 1–2  → fria, inget intervallkrav
--   Kalibrering 3+   → 1 per 180 dagar
-- premium/founder är fortsatt obegränsat (-1).
--
-- RÄKNAREN: profiles.lifetime_calibration_count ökas via trigger och
-- minskas ALDRIG. calibration_history får raderas av användaren (för att
-- städa felkalibreringar) — men radering får inte nollställa kvoten, då
-- vore gränsen frivillig. Därför en separat kolumn, inte COUNT(*).
--
-- RÄKNAS INTE:
--   * is_preview = true  — "Testa som ny användare" är en sandlåda vars
--     rader raderas vid exit; de får inte förbruka riktig kvot.
--   * ångrade kalibreringar — is_reverted sätts EFTER insert (av
--     revert_calibration_v2), så triggern ser alltid false vid INSERT.
--     Ångra rullar därför medvetet INTE tillbaka räknaren: annars blir
--     "kalibrera → ångra" en gratis oändlig loop.
--
-- Källordning (docs/PREMIUM_SPEC.md): get_plan_limits() är sanningen för
-- enforcement, src/lib/constants/entitlements.ts är UI-spegeln.
-- =========================================================

-- ── 1. Oraderbar livstidsräknare ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lifetime_calibration_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.lifetime_calibration_count IS
  'Antal skarpa kalibreringar genom tiderna. Ökas av trigger, minskas aldrig — '
  'radering av calibration_history får inte nollställa gratisnivåns kvot. '
  'Preview-kalibreringar (is_preview) räknas inte.';

-- Backfill för befintliga användare: räkna deras skarpa historik en gång.
-- Ångrade rader räknas med — de har förbrukat en kalibrering.
UPDATE public.profiles p
   SET lifetime_calibration_count = COALESCE(c.cnt, 0)
  FROM (
    SELECT user_id, COUNT(*) AS cnt
      FROM public.calibration_history
     WHERE is_preview = false
     GROUP BY user_id
  ) c
 WHERE p.user_id = c.user_id
   AND p.lifetime_calibration_count = 0;

-- ── 2. Trigger som ökar räknaren ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_lifetime_calibration_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Preview-sandlådan förbrukar aldrig riktig kvot.
  IF NEW.is_preview THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
     SET lifetime_calibration_count = lifetime_calibration_count + 1
   WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_lifetime_calibration_count ON public.calibration_history;
CREATE TRIGGER trg_bump_lifetime_calibration_count
  AFTER INSERT ON public.calibration_history
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_lifetime_calibration_count();

-- ── 3. Plangränser ───────────────────────────────────────────────────────
-- VARNING: denna funktion skrivs om i sin helhet vid varje ändring. Att
-- utgå från en gammal kropp har tidigare tappat feature-nycklar och låst
-- funktioner för ALLA (se 20260726081716_restore_premium_feature_keys).
-- Nyckeluppsättningen nedan är verifierad mot PlanLimits-typen i
-- src/lib/constants/entitlements.ts: 16 tidigare nycklar + de två nya.
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
      -- Behålls för bakåtkompatibilitet: äldre klienter som ännu inte
      -- laddat om läser denna nyckel och får kvartalsbeteendet.
      'calibrations_per_quarter', 1,
      -- Antal kalibreringar helt utan intervallkrav.
      'free_calibration_grace', 2,
      -- Intervall i dagar som gäller EFTER grace-kvoten.
      'calibration_interval_days', 180,
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
