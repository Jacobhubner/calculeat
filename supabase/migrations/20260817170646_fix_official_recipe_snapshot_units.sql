-- Rättar enhetsförväxling i receptbankens ingrediens-ögonblicksbilder.
--
-- BUGG: seed-migrationerna för receptbanken (20260721010000 batch1 m.fl.)
-- skrev TOTALA kalorier för ingrediensens mängd i snapshot_*-kolumnerna:
--
--   ROUND(v_w * COALESCE(v_fi.calories,0)/100, 1)   -- fel
--
-- Uttrycket är rätt för radens bidrag till receptets totalsumma — och används
-- korrekt några rader ovanför för just det — men klistrades även in i
-- snapshot-kolumnerna. Dessa ska hålla livsmedlets värde PER 100 G.
--
-- Att tolkningen är per 100 g är entydigt: den enda läsaren
-- (RecipeCalculatorModal, driftvarningen) jämför mot food_items.calories och
-- skriver ut "kcal/100g", och backfillen 20260326000001 satte = fi.calories.
--
-- FÖLJD: alla 50 officiella recept visade en falsk varning om att
-- ingredienserna ändrats — t.ex. "Rapsolja: från 88 till 884 kcal/100g",
-- vilket aldrig inträffat. Bruset dolde verklig drift den dag den uppstår.
--
-- INTE PÅVERKAT: receptens faktiska näringsvärden. Snapshot-kolumnerna läses
-- aldrig i någon beräkning. Verifierat att samtliga 50 recepts lagrade
-- näring stämmer mot en omräkning från ingredienserna (max diff 0,05 kcal).
--
-- Rättningen sätter värdet från food_items i stället för att dividera bort
-- vikten: seedningen avrundade till en decimal, så division återskapar inte
-- källvärdet exakt.
--
-- Privata recept rörs inte — deras 144 rader är redan korrekta (appens egen
-- skrivväg är rätt). Ingen användare har ännu kopierat ett bankrecept, så
-- inga användarkopior behöver städas.
UPDATE public.recipe_ingredients ri
SET snapshot_calories  = f.calories,
    snapshot_fat_g     = f.fat_g,
    snapshot_carb_g    = f.carb_g,
    snapshot_protein_g = f.protein_g
FROM public.recipes r, public.food_items f
WHERE r.id = ri.recipe_id
  AND f.id = ri.food_item_id
  AND r.visibility = 'official';
