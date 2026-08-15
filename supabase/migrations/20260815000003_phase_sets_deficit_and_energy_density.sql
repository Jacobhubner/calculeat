-- =========================================================
-- Periodstart sätter nu även deficit_level och show_energy_density
-- Date: 2026-08-15
--
-- Riktningsfrågan i grunduppgifterna ("Vad vill du med vikten?") togs bort.
-- Den behövdes aldrig för TDEE — det beräknas ur ålder, kön, längd, vikt och
-- aktivitetsnivå — och ställdes en gång till i perioddialogen med andra ord.
--
-- Men den satte tre fält som fortfarande behövs:
--   calorie_goal        — redan hanterat av denna trigger
--   deficit_level       — 20-25 % vid viktnedgång
--   show_energy_density — på vid nedgång/underhåll, av vid uppgång
--
-- De två sistnämnda flyttas hit, så att de härleds från periodvalet i stället
-- för att gissas innan användaren angett någon riktning.
--
-- Varför i triggern och inte i klienten: calorie_goal sätts redan här, och att
-- sätta de tre fälten i två olika transaktioner kan lämna profilen i ett
-- halvuppdaterat läge om det andra anropet misslyckas.
--
-- Kaloritäthetsindikatorn: PÅ vid nedgång och underhåll (hjälper både
-- kaloriundvikande och aptitkontroll — mätta sig på volym), AV vid uppgång (då
-- vill man snarare ha kaloritäta livsmedel). Upptrappning räknas som
-- nedgång-liknande: användaren kommer FRÅN ett underskott.
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

  UPDATE public.profiles
     SET calorie_goal = v_goal,
         deficit_level = v_deficit,
         show_energy_density = v_energy_density
   WHERE user_id = NEW.user_id
     AND profile_name <> '__preview__';

  RETURN NEW;
END;
$$;
