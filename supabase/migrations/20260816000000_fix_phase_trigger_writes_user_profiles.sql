-- =========================================================
-- FIX: periodtriggern skrev till fel tabell → start_diet_phase gav 400
-- Date: 2026-08-16
--
-- 20260815000003 lade till show_energy_density i UPDATE:n mot `profiles`.
-- Den kolumnen finns bara på `user_profiles`. Hela INSERT:en i
-- start_diet_phase misslyckades därför med 42703
-- (column "show_energy_density" of relation "profiles" does not exist),
-- och RPC:n svarade 400. INGEN kunde starta en period.
--
-- Felet syntes inte i utvecklingen eftersom testerna bara täcker
-- beräkningarna, och det första manuella testet gjordes i preview-läget —
-- där triggern returnerar tidigt och aldrig når UPDATE:n.
--
-- Rätt tabell är user_profiles: kanonisk källa efter Fas 3
-- (useUpdateProfile skriver dit), och kontoinställningar hör hemma där
-- enligt projektets profiltabellsregel. profiles uppdateras fortfarande
-- som spegling, men bara med de kolumner som faktiskt finns där.
-- =========================================================

CREATE OR REPLACE FUNCTION public.sync_calorie_goal_from_phase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  v_deficit := CASE WHEN NEW.phase_type = 'cut' THEN '20-25%' ELSE NULL END;
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
$$;
