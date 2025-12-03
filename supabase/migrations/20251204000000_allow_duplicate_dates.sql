-- Tillåt flera mätset per datum per användare
-- Migration skapad: 2025-12-04
-- Syfte: Möjliggör att användare kan skapa flera mätset på samma datum

-- Steg 1: Ta bort unique constraint
ALTER TABLE public.measurement_sets
  DROP CONSTRAINT IF EXISTS unique_set_date_per_user;

-- Steg 2: Lägg till composite index för effektiva queries (ersätter unique constraint)
CREATE INDEX IF NOT EXISTS idx_measurement_sets_user_date_created
  ON public.measurement_sets(user_id, set_date DESC, created_at DESC);

-- Steg 3: Uppdatera tabellkommentar
COMMENT ON TABLE public.measurement_sets IS
  'Sparade mätset med datumbaserad namngivning. Flera set per datum tillåtna. Sorteras efter created_at för samma datum.';
