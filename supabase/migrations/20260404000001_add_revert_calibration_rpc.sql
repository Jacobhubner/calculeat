-- Atomic revert: marks calibration_history entry as reverted AND restores
-- previous TDEE on the profile in a single transaction.
-- Replaces the two-step client-side approach that could leave the DB in an
-- inconsistent state if the connection dropped between the two updates.

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

  -- Restore previous TDEE (and optionally calorie range) on the profile
  UPDATE profiles
     SET tdee        = p_previous_tdee,
         tdee_source = 'metabolic_calibration_reverted',
         calories_min = COALESCE(p_previous_calories_min, calories_min),
         calories_max = COALESCE(p_previous_calories_max, calories_max)
   WHERE id = p_profile_id;
END;
$$;
