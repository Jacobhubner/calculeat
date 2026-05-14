-- Städa bort grams_per_unit=1-reliktvärden på ALLA användares livsmedel.
--
-- grams_per_unit=1 är ett arv från ett äldre kodflöde. Det ska vara NULL när
-- grams_per_piece finns satt — triggern väljer annars grams_per_unit=1 och
-- beräknar kcal_per_unit = kcal_per_gram * 1 istället för rätt förpackningsvärde.
-- (Panpizza Vesuvio Garant visade 2 kcal/st istället för 369 kcal/st p.g.a. detta.)
--
-- Säkerhetsvillkor:
--   - grams_per_unit nära 1.0 (reliktvärde, inte en verklig portionsvikt)
--   - grams_per_piece > 5 (ett rimligt förpackningsvärde finns)
--   - kcal_per_unit stämmer redan med grams_per_piece-beräkningen (data är OK, bara relikt)
--   - default_unit != 'portion' (portionsrecept hanteras separat)
--
-- Triggern körs vid UPDATE och räknar om kcal_per_unit via grams_per_piece automatiskt.

UPDATE food_items
SET grams_per_unit = NULL
WHERE
  grams_per_unit IS NOT NULL
  AND ABS(grams_per_unit - 1.0) < 0.05
  AND grams_per_piece IS NOT NULL
  AND grams_per_piece > 5
  AND default_unit != 'portion'
  AND (
    kcal_per_unit IS NULL
    OR ABS(kcal_per_unit - (calories / NULLIF(default_amount, 0) * grams_per_piece)) < 1.0
  );
