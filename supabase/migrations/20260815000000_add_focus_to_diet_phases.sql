-- =========================================================
-- Fokusspår på faser: 'strength' eller 'health'
-- Date: 2026-08-15
--
-- Samma fyra fastyper presenteras med olika namn och pekar mot olika
-- kostlägen beroende på spår:
--   strength (maximera muskeluppbyggnad):
--     cut→Deff-läge, bulk→Bulk-läge, maintenance→Aktiv-läge
--   health (hälsa och balans):
--     cut→Viktminskningsläge, bulk/maintenance→NNR-läge
--   reverse ärver utgångsfasens läge i båda spåren — en upptrappning är
--   återgången FRÅN ett underskott, och att byta makrofördelning samtidigt
--   som kalorierna höjs ändrar två variabler på en gång.
--
-- Varför kolumnen behövs: utan den byter en pågående fas namn om användaren
-- senare väljer ett annat fokus. Spåret hör till fasen, inte till
-- användarens nuvarande preferens.
--
-- OBS: denna migration skapade en ANDRA överlagring av start_diet_phase.
-- Den gamla droppas i 20260815000001 — se den filen.
-- =========================================================

ALTER TABLE public.diet_phases
  ADD COLUMN IF NOT EXISTS focus text NOT NULL DEFAULT 'strength'
  CHECK (focus IN ('strength', 'health'));

COMMENT ON COLUMN public.diet_phases.focus IS
  'Fokusspår fasen startades i: strength (muskeluppbyggnad, atletlägen) '
  'eller health (hälsa/balans, NNR + viktminskning). Styr fasens visningsnamn '
  'och vilket kostläge den pekar mot.';

CREATE OR REPLACE FUNCTION public.start_diet_phase(
  p_phase_type text,
  p_planned_weeks integer DEFAULT NULL,
  p_target_calories integer DEFAULT NULL,
  p_protein_g_per_kg numeric DEFAULT NULL,
  p_weekly_calorie_step integer DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_preview boolean DEFAULT false,
  p_focus text DEFAULT 'strength'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_weight numeric;
  v_new_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_phase_type NOT IN ('cut', 'bulk', 'maintenance', 'reverse') THEN
    RAISE EXCEPTION 'invalid_phase_type';
  END IF;

  IF p_focus NOT IN ('strength', 'health') THEN
    RAISE EXCEPTION 'invalid_focus';
  END IF;

  UPDATE public.diet_phases
     SET ended_at = CURRENT_DATE
   WHERE user_id = v_user
     AND is_preview = p_is_preview
     AND ended_at IS NULL;

  SELECT weight_kg INTO v_weight
    FROM public.weight_history
   WHERE user_id = v_user AND is_preview = p_is_preview
   ORDER BY recorded_at DESC
   LIMIT 1;

  IF v_weight IS NULL THEN
    SELECT weight_kg INTO v_weight FROM public.profiles
     WHERE user_id = v_user
     ORDER BY is_active DESC
     LIMIT 1;
  END IF;

  INSERT INTO public.diet_phases (
    user_id, phase_type, focus, planned_weeks, target_calories,
    protein_g_per_kg, weekly_calorie_step, notes, start_weight_kg, is_preview
  ) VALUES (
    v_user, p_phase_type, p_focus, p_planned_weeks, p_target_calories,
    p_protein_g_per_kg, p_weekly_calorie_step, p_notes, v_weight, p_is_preview
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean, text) TO authenticated;
