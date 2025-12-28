-- Remove Adaptive Thermogenesis (AT) functionality
-- This migration removes all AT-related fields and tables

-- Remove AT fields from profiles table
ALTER TABLE profiles
  DROP COLUMN IF EXISTS baseline_bmr,
  DROP COLUMN IF EXISTS accumulated_at,
  DROP COLUMN IF EXISTS last_at_calculation_date;

-- Drop AT history table
DROP TABLE IF EXISTS adaptive_thermogenesis_history;
