-- =========================================================
-- Städning: ta bort den gamla 7-parametersvarianten av start_diet_phase
-- Date: 2026-08-15
--
-- 20260815000000 lade till p_focus. CREATE OR REPLACE matchar på SIGNATUR,
-- och en tillagd parameter ger en ny signatur — resultatet blev alltså två
-- överlagringar sida vid sida i stället för en ersatt funktion.
--
-- Varför det är ett skarpt fel och inte bara skräp: samtliga parametrar har
-- defaultvärden. Ett anrop med färre argument än åtta matchar därför BÅDA
-- överlagringarna, och Postgres kastar "function start_diet_phase is not
-- unique" i stället för att välja en. Klienten anropar med sju argument när
-- fokus utelämnas, så felet hade träffat produktionsflödet direkt.
--
-- Verifierat efter körning: exakt en överlagring kvar (8 parametrar).
-- =========================================================

DROP FUNCTION IF EXISTS public.start_diet_phase(
  text, integer, integer, numeric, integer, text, boolean
);
