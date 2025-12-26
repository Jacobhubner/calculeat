-- Add Adaptive Thermogenesis (AT) fields to profiles table
-- Specification: ADAPTIVE_THERMOGENESIS_SPEC.md

-- Add AT columns to profiles
ALTER TABLE profiles
ADD COLUMN baseline_bmr DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN accumulated_at DECIMAL(10,2) DEFAULT 0,
ADD COLUMN last_at_calculation_date DATE DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.baseline_bmr IS 'Fast referenspunkt för AT-beräkning. Sätts vid första profilen baserat på Mifflin-St Jeor (om manuell TDEE) eller vald BMR-metod (om beräknad). Ändras INTE automatiskt.';
COMMENT ON COLUMN profiles.accumulated_at IS 'Ackumulerad metabolisk anpassning i kcal/dag. Range: -12% till +6% av baseline_bmr';
COMMENT ON COLUMN profiles.last_at_calculation_date IS 'Senaste AT-beräkning (för cron job)';

-- Create AT History Table for tracking metabolic adaptation over time
CREATE TABLE IF NOT EXISTS adaptive_thermogenesis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  calculation_date DATE NOT NULL,
  baseline_bmr DECIMAL(10,2) NOT NULL,
  bmr_expected DECIMAL(10,2) NOT NULL,
  calorie_balance_7d DECIMAL(10,2) NOT NULL,
  at_weekly DECIMAL(10,2) NOT NULL,
  accumulated_at DECIMAL(10,2) NOT NULL,
  bmr_effective DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, calculation_date)
);

-- Create index for efficient querying of AT history
CREATE INDEX idx_at_history_profile ON adaptive_thermogenesis_history(profile_id, calculation_date DESC);

-- Enable RLS on AT history table
ALTER TABLE adaptive_thermogenesis_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own AT history
CREATE POLICY "Users can view their own AT history"
  ON adaptive_thermogenesis_history
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Policy: AT history is inserted by system/cron only (no user inserts)
-- This will be handled by server-side functions
CREATE POLICY "System can insert AT history"
  ON adaptive_thermogenesis_history
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));
