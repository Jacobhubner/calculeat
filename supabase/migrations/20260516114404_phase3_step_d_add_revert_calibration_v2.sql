-- Fas 3 Steg D: introduce revert_calibration_v2, keyed by user_id instead of
-- profile_id, ahead of retiring the profile_id-based revert_calibration (v1).
-- Reconstructed from the live database definition — this migration was
-- originally applied via apply_migration and is being backfilled into the
-- repo so migration history matches production.

CREATE OR REPLACE FUNCTION public.revert_calibration_v2(
  p_calibration_id uuid,
  p_previous_tdee numeric,
  p_previous_calories_min numeric DEFAULT NULL::numeric,
  p_previous_calories_max numeric DEFAULT NULL::numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id        uuid;
  v_calorie_goal   text;
  v_deficit_level  text;
  v_deficit_pct    numeric;
  v_calories_min   numeric;
  v_calories_max   numeric;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE calibration_history
     SET is_reverted = true
   WHERE id = p_calibration_id
     AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'calibration_not_found';
  END IF;

  SELECT calorie_goal, deficit_level
    INTO v_calorie_goal, v_deficit_level
    FROM profiles
   WHERE user_id = v_user_id;

  IF v_calorie_goal = 'Weight loss' THEN
    v_deficit_pct := CASE v_deficit_level
      WHEN '10-15%' THEN 0.125
      WHEN '20-25%' THEN 0.225
      ELSE 0.275
    END;
    v_calories_min := p_previous_tdee * (1 - v_deficit_pct - 0.025);
    v_calories_max := p_previous_tdee * (1 - v_deficit_pct + 0.025);
  ELSIF v_calorie_goal = 'Weight gain' THEN
    v_calories_min := p_previous_tdee * 1.1;
    v_calories_max := p_previous_tdee * 1.2;
  ELSE
    v_calories_min := p_previous_tdee * 0.97;
    v_calories_max := p_previous_tdee * 1.03;
  END IF;

  UPDATE profiles
     SET tdee         = p_previous_tdee,
         tdee_source  = 'metabolic_calibration_reverted',
         calories_min = v_calories_min,
         calories_max = v_calories_max
   WHERE user_id = v_user_id;
END;
$function$;
