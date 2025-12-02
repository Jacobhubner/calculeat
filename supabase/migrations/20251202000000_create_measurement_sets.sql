-- Add measurement_sets table for storing body composition measurements
-- Migration created: 2025-12-02
-- Purpose: Allow users to save and manage multiple sets of body measurements with date-based naming

-- Step 1: Create measurement_sets table
CREATE TABLE IF NOT EXISTS public.measurement_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  set_date DATE NOT NULL, -- YYYY-MM-DD format
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Caliper measurements (mm)
  chest NUMERIC CHECK (chest >= 0 AND chest <= 100),
  abdominal NUMERIC CHECK (abdominal >= 0 AND abdominal <= 100),
  thigh NUMERIC CHECK (thigh >= 0 AND thigh <= 100),
  tricep NUMERIC CHECK (tricep >= 0 AND tricep <= 100),
  subscapular NUMERIC CHECK (subscapular >= 0 AND subscapular <= 100),
  suprailiac NUMERIC CHECK (suprailiac >= 0 AND suprailiac <= 100),
  midaxillary NUMERIC CHECK (midaxillary >= 0 AND midaxillary <= 100),
  bicep NUMERIC CHECK (bicep >= 0 AND bicep <= 100),
  lower_back NUMERIC CHECK (lower_back >= 0 AND lower_back <= 100),
  calf NUMERIC CHECK (calf >= 0 AND calf <= 100),

  -- Tape measurements (cm)
  neck NUMERIC CHECK (neck >= 20 AND neck <= 60),
  waist NUMERIC CHECK (waist >= 40 AND waist <= 200),
  hip NUMERIC CHECK (hip >= 50 AND hip <= 200),
  wrist NUMERIC CHECK (wrist >= 10 AND wrist <= 30),
  forearm NUMERIC CHECK (forearm >= 15 AND forearm <= 50),
  thigh_circ NUMERIC CHECK (thigh_circ >= 30 AND thigh_circ <= 100),
  calf_circ NUMERIC CHECK (calf_circ >= 20 AND calf_circ <= 70),

  -- Constraints
  CONSTRAINT unique_set_date_per_user UNIQUE(user_id, set_date)
);

-- Step 2: Enable RLS
ALTER TABLE public.measurement_sets ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY "Users can view own measurement sets"
  ON public.measurement_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own measurement sets"
  ON public.measurement_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurement sets"
  ON public.measurement_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Note: No UPDATE policy - measurement sets are read-only after creation

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_measurement_sets_user_date
  ON public.measurement_sets(user_id, set_date DESC);

-- Step 5: Add comments for documentation
COMMENT ON TABLE public.measurement_sets IS 'Saved measurement sets with date-based naming. Read-only after creation.';
COMMENT ON COLUMN public.measurement_sets.user_id IS 'Reference to auth.users - owner of this measurement set';
COMMENT ON COLUMN public.measurement_sets.set_date IS 'Date of measurement in YYYY-MM-DD format. Unique per user.';
COMMENT ON COLUMN public.measurement_sets.chest IS 'Chest skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.abdominal IS 'Abdominal skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.thigh IS 'Thigh skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.tricep IS 'Tricep skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.subscapular IS 'Subscapular skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.suprailiac IS 'Suprailiac skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.midaxillary IS 'Midaxillary skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.bicep IS 'Bicep skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.lower_back IS 'Lower back skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.calf IS 'Calf skinfold measurement in millimeters';
COMMENT ON COLUMN public.measurement_sets.neck IS 'Neck circumference in centimeters';
COMMENT ON COLUMN public.measurement_sets.waist IS 'Waist circumference in centimeters';
COMMENT ON COLUMN public.measurement_sets.hip IS 'Hip circumference in centimeters';
COMMENT ON COLUMN public.measurement_sets.wrist IS 'Wrist circumference in centimeters';
COMMENT ON COLUMN public.measurement_sets.forearm IS 'Forearm circumference in centimeters';
COMMENT ON COLUMN public.measurement_sets.thigh_circ IS 'Thigh circumference in centimeters';
COMMENT ON COLUMN public.measurement_sets.calf_circ IS 'Calf circumference in centimeters';
