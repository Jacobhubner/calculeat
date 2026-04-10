-- Rewrite revert_calibration to compute the calorie range from the profile's
-- calorie_goal + deficit_level instead of accepting it as a parameter.
-- This ensures the interval is always consistent with the current goal setting,
-- both on revert and in any future scenario where TDEE is restored.

CREATE OR REPLACE FUNCTION public.revert_calibration(
  p_calibration_id uuid,
  p_profile_id     uuid,
  p_previous_tdee  numeric,
  p_previous_calories_min numeric DEFAULT NULL,
  p_previous_calories_max numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calorie_goal   text;
  v_deficit_level  text;
  v_deficit_pct    numeric;
  v_calories_min   numeric;
  v_calories_max   numeric;
BEGIN
  -- Verify caller owns the profile
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profile_id
      AND user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  -- Mark calibration as reverted
  UPDATE calibration_history
     SET is_reverted = true
   WHERE id = p_calibration_id
     AND profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'calibration_not_found';
  END IF;

  -- Read goal settings from the profile
  SELECT calorie_goal, deficit_level
    INTO v_calorie_goal, v_deficit_level
    FROM profiles
   WHERE id = p_profile_id;

  -- Mirror the same logic as the client-side apply calculation
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
    -- Maintenance (or any other goal)
    v_calories_min := p_previous_tdee * 0.97;
    v_calories_max := p_previous_tdee * 1.03;
  END IF;

  -- Restore previous TDEE and computed calorie range
  UPDATE profiles
     SET tdee         = p_previous_tdee,
         tdee_source  = 'metabolic_calibration_reverted',
         calories_min = v_calories_min,
         calories_max = v_calories_max
   WHERE id = p_profile_id;
END;
$$;
