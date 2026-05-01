-- Recept-food_items som backfylldes med grams_per_piece/serving_unit hade
-- fortfarande default_unit='g'. RecipeCalculatorModal läser default_unit
-- för att bestämma saveAs ('g' → '100g', annars → 'portion') — om användaren
-- öppnade och sparade om receptet hade portion-datan skrivits över.
-- Sätt default_unit='portion' och default_amount=1 så att alla fält stämmer.

UPDATE food_items fi
SET
  default_unit   = 'portion',
  default_amount = 1
FROM recipes r
WHERE
  fi.id = r.food_item_id
  AND fi.is_recipe = true
  AND fi.serving_unit = 'portion'
  AND fi.grams_per_piece IS NOT NULL
  AND fi.default_unit = 'g';
