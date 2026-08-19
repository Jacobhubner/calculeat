-- Nivån in i RPC:n, så triggern har den redan när den kör.
--
-- VARFÖR DROP OCH INTE CREATE OR REPLACE: en ny parameter med DEFAULT skapar
-- en ANDRA överlagring i stället för att ersätta den gamla. PostgREST kan då
-- inte avgöra vilken som avses och svarar 42725 (ambiguous function). Samma
-- fälla som p_focus gick i när den lades till.
--
-- DROP tar bort GRANTs. De återställs längst ned — inklusive PUBLIC, som är
-- den som faktiskt bär anropet: PostgREST ansluter som authenticator och
-- byter roll till authenticated, och utan PUBLIC-grant faller anropet.

DROP FUNCTION IF EXISTS public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean, text);

CREATE FUNCTION public.start_diet_phase(
  p_phase_type text,
  p_planned_weeks integer DEFAULT NULL::integer,
  p_target_calories integer DEFAULT NULL::integer,
  p_protein_g_per_kg numeric DEFAULT NULL::numeric,
  p_weekly_calorie_step integer DEFAULT NULL::integer,
  p_notes text DEFAULT NULL::text,
  p_is_preview boolean DEFAULT false,
  p_focus text DEFAULT 'strength'::text,
  p_deficit_level text DEFAULT NULL::text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_weight numeric;
  v_new_id uuid;
  v_deficit text;
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

  IF p_deficit_level IS NOT NULL
     AND p_deficit_level NOT IN ('10-15%', '20-25%', '25-30%') THEN
    RAISE EXCEPTION 'invalid_deficit_level';
  END IF;

  -- Nivån gäller bara underskott. Skickas den för bulk är det ett klientfel
  -- som tystas här i stället för att lagras — annars skulle en bulk-rad bära
  -- ett underskottsdjup som ingen läser men alla ser i databasen.
  v_deficit := CASE WHEN p_phase_type = 'cut' THEN p_deficit_level ELSE NULL END;

  -- Avsluta pågående fas i samma läge (skarpt/preview)
  UPDATE public.diet_phases
     SET ended_at = CURRENT_DATE
   WHERE user_id = v_user
     AND is_preview = p_is_preview
     AND ended_at IS NULL;

  -- Startvikt: senaste vägningen i rätt läge, annars profilens vikt
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
    protein_g_per_kg, weekly_calorie_step, notes, start_weight_kg, is_preview,
    deficit_level
  ) VALUES (
    v_user, p_phase_type, p_focus, p_planned_weeks, p_target_calories,
    p_protein_g_per_kg, p_weekly_calorie_step, p_notes, v_weight, p_is_preview,
    v_deficit
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$function$;

-- Återställ exakt de grants som fanns före DROP.
GRANT EXECUTE ON FUNCTION public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean, text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean, text, text) TO service_role;
