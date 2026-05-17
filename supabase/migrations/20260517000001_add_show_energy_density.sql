ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS show_energy_density BOOLEAN NOT NULL DEFAULT false;

-- Backfill: befintliga användare behåller funktionen aktiv — inget försvinner efter deploy
-- Nya användare får false (DB-default) = opt-in
UPDATE user_profiles
SET show_energy_density = true;
