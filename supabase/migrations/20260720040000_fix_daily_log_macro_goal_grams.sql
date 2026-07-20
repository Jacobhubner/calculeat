-- =========================================================
-- MIGRATION: Retroaktiv korrigering av makro-grammål i daily_logs
-- Date: 2026-07-20
-- Problem: goal_fat_min_g/goal_fat_max_g m.fl. skrevs historiskt med
--   avgCalories = (goal_calories_min + goal_calories_max) / 2 för BÅDA
--   gränserna, i stället för nedre gräns mot goal_calories_min och övre
--   mot goal_calories_max. Det gav förskjutna, för smala gram-spann som
--   inte matchade profilsidans makrofördelning (MacroDistributionCard).
--   Frontend-koden är nu fixad (macroGramsFromPercent som enda källa till
--   sanning); denna migration rättar redan sparade snapshots så historik
--   och nya dagar räknas på samma sätt.
--
-- Metod: De ursprungliga procenten finns inte lagrade, men de kan elimineras
--   algebraiskt. Gammalt värde: old_min = avg * pct_min / k. Önskat värde:
--   new_min = cmin * pct_min / k. Alltså new_min = old_min * (cmin / avg),
--   och new_max = old_max * (cmax / avg). Skalfaktorn är oberoende av pct och
--   av k (fett=9, kolhydrat/protein=4), så samma faktor gäller alla tre makron.
--   Detta bevarar exakt den makrofördelning användaren faktiskt hade den dagen
--   (inga NNR-defaults tvingas på historiska rader) och korrigerar enbart
--   avgCalories→cmin/cmax-felet.
--
-- Avrundning: gramkolumnerna är redan heltalsavrundade, så skalningen kan ge
--   ±1 g mot en beräkning från ursprungsprocenten. Försumbart och oundvikligt
--   utan lagrad procent.
--
-- Rader utan kalorimål, utan grammål, eller där min = max (skalfaktor = 1)
--   lämnas orörda av WHERE-villkoret.
-- =========================================================

UPDATE public.daily_logs
SET
  goal_fat_min_g     = ROUND(goal_fat_min_g     * (goal_calories_min / ((goal_calories_min + goal_calories_max) / 2.0))),
  goal_fat_max_g     = ROUND(goal_fat_max_g     * (goal_calories_max / ((goal_calories_min + goal_calories_max) / 2.0))),
  goal_carb_min_g    = ROUND(goal_carb_min_g    * (goal_calories_min / ((goal_calories_min + goal_calories_max) / 2.0))),
  goal_carb_max_g    = ROUND(goal_carb_max_g    * (goal_calories_max / ((goal_calories_min + goal_calories_max) / 2.0))),
  goal_protein_min_g = ROUND(goal_protein_min_g * (goal_calories_min / ((goal_calories_min + goal_calories_max) / 2.0))),
  goal_protein_max_g = ROUND(goal_protein_max_g * (goal_calories_max / ((goal_calories_min + goal_calories_max) / 2.0)))
WHERE goal_calories_min IS NOT NULL
  AND goal_calories_max IS NOT NULL
  AND goal_calories_min <> goal_calories_max
  AND (goal_calories_min + goal_calories_max) > 0;
