-- ============================================================
-- Recipe Nutrition Health Check
-- Kör när som helst för att verifiera nutrition-invarianter.
-- Noll rader i varje sektion = systemet är friskt.
-- ============================================================


-- 1. GRAM-DRIFT: kcal_per_gram != calories/100 (tolerans 0.05)
--    Bryter mot: chk_recipe_kcal_per_gram_consistent
SELECT
  'gram_drift' AS check_name,
  r.name       AS recipe_name,
  up.email,
  fi.calories  AS cal_per_100g,
  fi.kcal_per_gram,
  ROUND(fi.calories / 100.0, 6) AS expected_kcal_per_gram,
  ABS(fi.kcal_per_gram - fi.calories / 100.0) AS drift
FROM recipes r
JOIN food_items fi ON fi.id = r.food_item_id
JOIN user_profiles up ON up.id = r.user_id
WHERE fi.is_recipe = true
  AND fi.default_unit = 'portion'
  AND fi.kcal_per_gram IS NOT NULL
  AND fi.calories IS NOT NULL
  AND ABS(fi.kcal_per_gram - fi.calories / 100.0) > 0.05;


-- 2. UNIT-DRIFT: kcal_per_unit != calories/100 * grams_per_piece (tolerans 2 kcal)
--    Bryter mot: chk_recipe_kcal_per_unit_consistent
SELECT
  'unit_drift'    AS check_name,
  r.name          AS recipe_name,
  up.email,
  fi.calories     AS cal_per_100g,
  fi.kcal_per_unit,
  fi.grams_per_piece,
  ROUND(fi.calories / 100.0 * fi.grams_per_piece, 2) AS expected_kcal_per_unit,
  ABS(fi.kcal_per_unit - (fi.calories / 100.0 * fi.grams_per_piece)) AS drift
FROM recipes r
JOIN food_items fi ON fi.id = r.food_item_id
JOIN user_profiles up ON up.id = r.user_id
WHERE fi.is_recipe = true
  AND fi.default_unit = 'portion'
  AND fi.kcal_per_unit IS NOT NULL
  AND fi.calories IS NOT NULL
  AND fi.grams_per_piece IS NOT NULL
  AND fi.grams_per_piece > 0
  AND ABS(fi.kcal_per_unit - (fi.calories / 100.0 * fi.grams_per_piece)) > 2.0;


-- 3. CALORIES SUSPICIOUSLY HIGH: calories > 900 per 100g för recept
--    Indikerar att per-portion skrevs till calories-kolumnen (klassisk bug).
SELECT
  'calories_too_high_for_100g' AS check_name,
  r.name                       AS recipe_name,
  up.email,
  fi.calories                  AS cal_per_100g,
  fi.kcal_per_unit,
  fi.grams_per_piece
FROM recipes r
JOIN food_items fi ON fi.id = r.food_item_id
JOIN user_profiles up ON up.id = r.user_id
WHERE fi.is_recipe = true
  AND fi.default_unit = 'portion'
  AND fi.calories > 900;


-- 4. PORTION-RECEPT SAKNAR PORTION-FÄLT
SELECT
  'missing_portion_fields' AS check_name,
  r.name                   AS recipe_name,
  up.email,
  fi.default_unit,
  fi.kcal_per_unit,
  fi.grams_per_piece,
  fi.serving_unit
FROM recipes r
JOIN food_items fi ON fi.id = r.food_item_id
JOIN user_profiles up ON up.id = r.user_id
WHERE fi.is_recipe = true
  AND fi.default_unit = 'portion'
  AND (fi.kcal_per_unit IS NULL OR fi.grams_per_piece IS NULL OR fi.serving_unit IS NULL);


-- 5. RECEPT UTAN KOPPLAT FOOD_ITEM
SELECT
  'recipe_missing_food_item' AS check_name,
  r.id                       AS recipe_id,
  r.name                     AS recipe_name,
  up.email
FROM recipes r
JOIN user_profiles up ON up.id = r.user_id
WHERE r.food_item_id IS NULL
  AND r.shared_list_id IS NULL;


-- 6. SNAPSHOT-INTEGRITET: recipe_ingredients utan snapshot_calories
--    (snapshot_calories = NULL kan ge fel vid delning om food_item förändras)
SELECT
  'ingredient_missing_snapshot' AS check_name,
  r.name                        AS recipe_name,
  up.email,
  fi.name                       AS ingredient_name,
  ri.snapshot_calories
FROM recipe_ingredients ri
JOIN recipes r ON r.id = ri.recipe_id
JOIN food_items fi ON fi.id = ri.food_item_id
LEFT JOIN user_profiles up ON up.id = r.user_id
WHERE ri.snapshot_calories IS NULL
  AND r.shared_list_id IS NULL
ORDER BY r.name;


-- 7. STALE SHARED RECIPES: mottagna recept vars nutrition avviker >5% från sändarens nuvarande
--    (indikerar att sändaren uppdaterat receptet efter delning)
SELECT
  'stale_shared_recipe'    AS check_name,
  r_recv.name              AS received_recipe,
  up_recv.email            AS recipient,
  fi_recv.kcal_per_unit    AS recipient_kcal_per_unit,
  r_orig.name              AS original_recipe,
  up_orig.email            AS sender,
  fi_orig.kcal_per_unit    AS sender_kcal_per_unit,
  ABS(fi_recv.kcal_per_unit - fi_orig.kcal_per_unit) AS drift
FROM share_invitations si
JOIN recipes r_orig ON r_orig.id = si.item_id AND si.item_type = 'recipe'
JOIN food_items fi_orig ON fi_orig.id = r_orig.food_item_id
JOIN user_profiles up_orig ON up_orig.id = si.sender_id
JOIN recipes r_recv ON r_recv.user_id = si.recipient_id AND r_recv.name IN (r_orig.name, r_orig.name || ' – ' || si.sender_name)
JOIN food_items fi_recv ON fi_recv.id = r_recv.food_item_id
JOIN user_profiles up_recv ON up_recv.id = si.recipient_id
WHERE si.status = 'accepted'
  AND fi_orig.kcal_per_unit IS NOT NULL
  AND fi_recv.kcal_per_unit IS NOT NULL
  AND ABS(fi_recv.kcal_per_unit - fi_orig.kcal_per_unit) / NULLIF(fi_orig.kcal_per_unit, 0) > 0.05;


-- 8. SAMMANFATTNING
SELECT
  'summary'                                                              AS check_name,
  COUNT(*) FILTER (WHERE fi.is_recipe AND fi.default_unit = 'portion')  AS total_portion_recipes,
  COUNT(*) FILTER (WHERE fi.is_recipe AND fi.default_unit = 'g')        AS total_100g_recipes,
  COUNT(*) FILTER (
    WHERE fi.is_recipe AND fi.default_unit = 'portion'
    AND fi.kcal_per_gram IS NOT NULL
    AND ABS(fi.kcal_per_gram - fi.calories / 100.0) <= 0.05
  )                                                                      AS gram_ok,
  COUNT(*) FILTER (
    WHERE fi.is_recipe AND fi.default_unit = 'portion'
    AND fi.kcal_per_unit IS NOT NULL AND fi.grams_per_piece IS NOT NULL
    AND ABS(fi.kcal_per_unit - (fi.calories / 100.0 * fi.grams_per_piece)) <= 2.0
  )                                                                      AS unit_ok
FROM recipes r
JOIN food_items fi ON fi.id = r.food_item_id;
