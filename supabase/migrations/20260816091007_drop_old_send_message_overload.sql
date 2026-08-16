-- CREATE OR REPLACE med en ny defaultad parameter skapar en NY funktion,
-- den ersätter inte den gamla. Med båda kvar blir send_message(uuid, text)
-- tvetydigt och anropet failar med 42725. Samma fälla som
-- 20260815000001_drop_old_start_diet_phase_overload.
DROP FUNCTION IF EXISTS public.send_message(uuid, text);
