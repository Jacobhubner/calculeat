-- Add TDEE metadata fields to profiles table
-- This migration adds tracking for when and how TDEE was calculated

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tdee_calculated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tdee_source TEXT CHECK (
  tdee_source IN ('manual', 'tdee_calculator_tool', 'profile_form', 'legacy')
),
ADD COLUMN IF NOT EXISTS tdee_calculation_snapshot JSONB;

-- Add comments for documentation
COMMENT ON COLUMN profiles.tdee_calculated_at IS 'Timestamp when TDEE was last calculated or manually entered';
COMMENT ON COLUMN profiles.tdee_source IS 'Source of TDEE: manual (user entered), tdee_calculator_tool, profile_form, or legacy (migrated)';
COMMENT ON COLUMN profiles.tdee_calculation_snapshot IS 'Snapshot of parameters used for TDEE calculation (weight, height, age, BMR formula, PAL system, etc.)';

-- Backfill existing profiles with legacy source
-- Note: Using NULL for tdee_calculated_at since we don't know when TDEE was actually calculated
-- updated_at reflects last profile change, not TDEE calculation timestamp
UPDATE profiles
SET
  tdee_source = 'legacy',
  tdee_calculated_at = NULL,
  tdee_calculation_snapshot = jsonb_build_object(
    'weight_kg', weight_kg,
    'height_cm', height_cm,
    'age', EXTRACT(YEAR FROM AGE(birth_date)),
    'gender', gender,
    'bmr_formula', bmr_formula,
    'pal_system', pal_system,
    'activity_level', activity_level,
    'calculated_bmr', bmr,
    'calculated_tdee', tdee,
    'note', 'Migrated from legacy system'
  )
WHERE tdee IS NOT NULL
  AND (tdee_source IS NULL OR tdee_source = 'legacy');
