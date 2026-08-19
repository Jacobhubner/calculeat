-- Märk när underskottsdjupet ändrades mitt i en period.
--
-- VARFÖR: phaseTracking jämför uppmätt viktnedgång mot förväntad takt, och
-- den förväntade takten räknas ur periodens NUVARANDE kalorimål gånger HELA
-- den gångna tiden. Byter man nivå vecka 8 skrivs alltså om vad användaren
-- "borde" ha tappat sedan dag ett.
--
-- MÄTT KONSEKVENS (TDEE 2800, någon som följt normal-nivån exakt):
--   byte till aggressive -> kvot 0,82  (ryms i ±40 %-toleransen)
--   byte till cautious   -> kvot 1,80  (SPRÄNGER toleransen, status blir
--                                       "ligger före" utan att beteendet ändrats)
-- Till jämförelse flyttar en omkalibrering av TDEE på ±150 kcal kvoten till
-- 1,31/0,81 — den ryms. Nivåbytet är alltså ungefär 2,5 gånger större och är
-- den enda av störningarna som faktiskt ändrar beskedet användaren får.
--
-- LÖSNING: datumet läses av phaseTracking, som håller status i 'too_early' i
-- tio dagar efter bytet. Exakt samma regel och motivering som redan gäller
-- efter periodstart (vätske- och glykogensvängningar dominerar kortsiktigt),
-- bara med ett andra referensdatum.

ALTER TABLE public.diet_phases
  ADD COLUMN IF NOT EXISTS deficit_level_changed_at date;

COMMENT ON COLUMN public.diet_phases.deficit_level_changed_at IS
  'Datum då deficit_level senast ändrades under pågående period. NULL = orörd sedan start. Läses av phaseTracking för att hålla uppföljningen i too_early i tio dagar efter bytet.';
