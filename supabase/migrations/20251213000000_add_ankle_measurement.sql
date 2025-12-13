-- Add ankle measurement field to measurement_sets table
-- This is needed for Casey Butt's genetic potential formula

ALTER TABLE measurement_sets
ADD COLUMN IF NOT EXISTS ankle NUMERIC;

COMMENT ON COLUMN measurement_sets.ankle IS 'Ankle circumference measurement in cm (for genetic potential calculations)';
