-- Extend tdee_source CHECK constraint to include metabolic calibration values.
-- The original constraint (20251217000000) only included manual/tdee_calculator_tool/profile_form/legacy.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_tdee_source_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tdee_source_check CHECK (
    tdee_source IN (
      'manual',
      'tdee_calculator_tool',
      'profile_form',
      'legacy',
      'metabolic_calibration',
      'metabolic_calibration_reverted'
    )
  );
