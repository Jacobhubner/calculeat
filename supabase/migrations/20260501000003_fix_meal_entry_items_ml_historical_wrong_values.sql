-- Rättar historiska meal_entry_items där ml-livsmedel loggades med fel multiplier
-- (amount/default_amount istället för weight_grams/food.weight_grams).
-- Påverkade poster identifieras genom att logged_calories matchar fel-formeln inom 1% tolerans.

UPDATE meal_entry_items mei
SET
  calories  = ROUND((fi.calories  * mei.weight_grams / fi.weight_grams)::numeric, 2),
  fat_g     = ROUND((fi.fat_g     * mei.weight_grams / fi.weight_grams)::numeric, 2),
  carb_g    = ROUND((fi.carb_g    * mei.weight_grams / fi.weight_grams)::numeric, 2),
  protein_g = ROUND((fi.protein_g * mei.weight_grams / fi.weight_grams)::numeric, 2)
FROM food_items fi
WHERE mei.food_item_id = fi.id
  AND fi.default_unit = 'ml'
  AND fi.weight_grams > 0
  AND mei.weight_grams > 0
  AND mei.unit IN ('dl', 'ml', 'msk', 'tsk')
  AND ABS(mei.calories - (fi.calories * mei.amount / fi.default_amount)) < 0.01 * GREATEST(mei.calories, 0.01);
