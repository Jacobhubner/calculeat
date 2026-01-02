-- Add fields for "Beräkna din aktivitetsnivå" PAL system
-- These fields support the detailed activity level calculation

-- Update both user_profiles and profiles tables

-- First update the pal_system CHECK constraint for user_profiles
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_pal_system_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_pal_system_check CHECK (pal_system IN (
  'FAO/WHO/UNU based PAL values',
  'DAMNRIPPED PAL values',
  'Pro Physique PAL values',
  'Fitness Stuff PAL values',
  'Basic internet PAL values',
  'Beräkna din aktivitetsnivå',
  'Custom PAL'
));

-- Update the pal_system CHECK constraint for profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_pal_system_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pal_system_check CHECK (pal_system IN (
  'FAO/WHO/UNU based PAL values',
  'DAMNRIPPED PAL values',
  'Pro Physique PAL values',
  'Fitness Stuff PAL values',
  'Basic internet PAL values',
  'Beräkna din aktivitetsnivå',
  'Custom PAL'
));

-- Add new columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS training_activity_id text,
ADD COLUMN IF NOT EXISTS training_days_per_week integer,
ADD COLUMN IF NOT EXISTS training_minutes_per_session integer,
ADD COLUMN IF NOT EXISTS walking_activity_id text,
ADD COLUMN IF NOT EXISTS steps_per_day integer,
ADD COLUMN IF NOT EXISTS hours_standing_per_day numeric(3, 1),
ADD COLUMN IF NOT EXISTS household_activity_id text,
ADD COLUMN IF NOT EXISTS household_hours_per_day numeric(3, 1),
ADD COLUMN IF NOT EXISTS spa_factor numeric(3, 2) CHECK (spa_factor IS NULL OR (spa_factor >= 1.05 AND spa_factor <= 1.20));

-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS training_activity_id text,
ADD COLUMN IF NOT EXISTS training_days_per_week integer,
ADD COLUMN IF NOT EXISTS training_minutes_per_session integer,
ADD COLUMN IF NOT EXISTS walking_activity_id text,
ADD COLUMN IF NOT EXISTS steps_per_day integer,
ADD COLUMN IF NOT EXISTS hours_standing_per_day numeric(3, 1),
ADD COLUMN IF NOT EXISTS household_activity_id text,
ADD COLUMN IF NOT EXISTS household_hours_per_day numeric(3, 1),
ADD COLUMN IF NOT EXISTS spa_factor numeric(3, 2) CHECK (spa_factor IS NULL OR (spa_factor >= 1.05 AND spa_factor <= 1.20));

-- Add comments for user_profiles
COMMENT ON COLUMN public.user_profiles.training_activity_id IS 'MET activity ID for training (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.training_days_per_week IS 'Number of training days per week (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.training_minutes_per_session IS 'Training session duration in minutes (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.walking_activity_id IS 'MET activity ID for walking tempo (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.steps_per_day IS 'Average daily step count (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.hours_standing_per_day IS 'Hours spent standing per day (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.household_activity_id IS 'MET activity ID for household activities (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.household_hours_per_day IS 'Hours spent on household activities per day (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.user_profiles.spa_factor IS 'Spontaneous Physical Activity factor, range 1.05-1.20 (Beräkna din aktivitetsnivå)';

-- Add comments for profiles
COMMENT ON COLUMN public.profiles.training_activity_id IS 'MET activity ID for training (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.training_days_per_week IS 'Number of training days per week (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.training_minutes_per_session IS 'Training session duration in minutes (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.walking_activity_id IS 'MET activity ID for walking tempo (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.steps_per_day IS 'Average daily step count (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.hours_standing_per_day IS 'Hours spent standing per day (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.household_activity_id IS 'MET activity ID for household activities (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.household_hours_per_day IS 'Hours spent on household activities per day (Beräkna din aktivitetsnivå)';
COMMENT ON COLUMN public.profiles.spa_factor IS 'Spontaneous Physical Activity factor, range 1.05-1.20 (Beräkna din aktivitetsnivå)';
