-- Fas 3 Steg D: retire the profile_id-based revert_calibration now that the
-- frontend (useCalibrationHistory.ts) calls revert_calibration_v2 exclusively.
-- Reconstructed from the live database (function no longer exists) — backfilled
-- into the repo so migration history matches production.

DROP FUNCTION IF EXISTS public.revert_calibration(uuid, uuid, numeric, numeric, numeric);
