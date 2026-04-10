-- Store previous calorie range on calibration_history so it can be restored on revert.
-- Existing rows get NULL (no history available) — handled gracefully by COALESCE in RPC.

ALTER TABLE public.calibration_history
  ADD COLUMN IF NOT EXISTS previous_calories_min numeric,
  ADD COLUMN IF NOT EXISTS previous_calories_max numeric;
