-- Underskottsnivån blir en egenskap hos perioden, inte en hårdkodning.
--
-- BAKGRUND: triggern sync_calorie_goal_from_phase satte
--   v_deficit := CASE WHEN phase_type = 'cut' THEN '20-25%' ELSE NULL END;
-- Alla cut-perioder fick alltså mellannivån oavsett vad användaren valt.
-- Eftersom triggern kör inuti start_diet_phase — före klientens
-- applyToProfile() — skrevs ett klientval över direkt. Symtomet hade blivit
-- lömskt: rätt siffror i dialogen, rätt kalorimål några sekunder, och sedan
-- tyst återgång vid nästa metabola kalibrering (som räknar om ur
-- deficit_level).
--
-- LÖSNING: nivån följer med perioden hela vägen in, så triggern har den
-- redan när den kör. Ingen kapplöpning mellan trigger och klient.

-- ── 1. Kolumnen ─────────────────────────────────────────────────────────
ALTER TABLE public.diet_phases
  ADD COLUMN IF NOT EXISTS deficit_level text;

-- Samma tillåtna värden som user_profiles.deficit_level. NULL är giltigt och
-- betyder "gäller inte" — bulk, maintenance och reverse har inget underskott.
ALTER TABLE public.diet_phases
  DROP CONSTRAINT IF EXISTS diet_phases_deficit_level_check;
ALTER TABLE public.diet_phases
  ADD CONSTRAINT diet_phases_deficit_level_check
  CHECK (deficit_level IS NULL OR deficit_level IN ('10-15%', '20-25%', '25-30%'));

-- Befintliga cut-perioder får det värde de faktiskt kördes med. Innan den här
-- migrationen fanns bara ett alternativ, så '20-25%' är inte en gissning utan
-- vad triggern bevisligen skrev.
UPDATE public.diet_phases
   SET deficit_level = '20-25%'
 WHERE phase_type = 'cut' AND deficit_level IS NULL;

COMMENT ON COLUMN public.diet_phases.deficit_level IS
  'Underskottsdjup för cut-perioder (10-15/20-25/25-30 %). NULL för övriga faser. Speglas till profilernas deficit_level av sync_calorie_goal_from_phase.';

-- ── 2. Triggern läser nivån i stället för att hårdkoda den ──────────────
CREATE OR REPLACE FUNCTION public.sync_calorie_goal_from_phase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_goal text;
  v_deficit text;
  v_energy_density boolean;
BEGIN
  IF NEW.is_preview THEN
    RETURN NEW;
  END IF;

  IF NEW.ended_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_goal := CASE NEW.phase_type
    WHEN 'cut'         THEN 'Weight loss'
    WHEN 'bulk'        THEN 'Weight gain'
    WHEN 'maintenance' THEN 'Maintain weight'
    WHEN 'reverse'     THEN 'Maintain weight'
  END;

  -- Nivån kommer från perioden. Fallbacken '20-25%' gäller bara rader som
  -- skapats utan nivå — den bevarar exakt det beteende som fanns innan, så
  -- ingen befintlig användare påverkas.
  v_deficit := CASE
    WHEN NEW.phase_type = 'cut' THEN COALESCE(NEW.deficit_level, '20-25%')
    ELSE NULL
  END;
  v_energy_density := NEW.phase_type <> 'bulk';

  -- Kanonisk källa (Fas 3). Har alla tre kolumnerna.
  UPDATE public.user_profiles
     SET calorie_goal = v_goal,
         deficit_level = v_deficit,
         show_energy_density = v_energy_density
   WHERE id = NEW.user_id;

  -- Spegling. Saknar show_energy_density, därför bara två kolumner.
  UPDATE public.profiles
     SET calorie_goal = v_goal,
         deficit_level = v_deficit
   WHERE user_id = NEW.user_id
     AND profile_name <> '__preview__';

  RETURN NEW;
END;
$function$;

-- Triggern måste även reagera när nivån ändras, annars slår ett byte igenom
-- på perioden men inte på profilen.
DROP TRIGGER IF EXISTS trg_sync_calorie_goal_from_phase ON public.diet_phases;
CREATE TRIGGER trg_sync_calorie_goal_from_phase
  AFTER INSERT OR UPDATE OF phase_type, ended_at, deficit_level
  ON public.diet_phases
  FOR EACH ROW EXECUTE FUNCTION public.sync_calorie_goal_from_phase();
