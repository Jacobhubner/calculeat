-- Driftdetektion för receptbanken.
--
-- PROBLEM: ett recepts näringsvärden räknas bara om när receptet sparas om.
-- Ändrar en admin ett globalt livsmedel som ingår i officiella recept står
-- de recepten kvar med gamla värden — utan att någon märker det.
--
-- Den här funktionen visar VILKA recept som berörs och hur mycket. Den
-- ÄNDRAR ingenting: omräkning ska vara ett medvetet, granskat beslut, inte
-- något som sker tyst i en trigger. Skälen:
--   1. Näringsberäkningen (recipeCalculator.ts) hanterar volymenheter,
--      styckvikter, per-portion-format och food_nutrients-summering. En
--      SQL-kopia skulle bli en andra sanning som driver ifrån TS-versionen.
--   2. Användarens loggade måltider är frysta och ska förbli det.
--
-- ENDAST officiella recept. Andra användares privata recept är inte adminens
-- sak att se, och ska aldrig ändras utan att ägaren bett om det.
CREATE OR REPLACE FUNCTION public.get_drifted_official_recipes()
RETURNS TABLE (
  recipe_id            uuid,
  recipe_name          text,
  drifted_ingredients  bigint,
  total_ingredients    bigint,
  /** Receptets lagrade kcal/100 g (det användaren ser) */
  stored_per_100g      numeric,
  /** Vad det skulle bli om receptet räknades om nu */
  recalculated_per_100g numeric,
  /** Skillnad i kcal/100 g — noll betyder att bara varningen är inaktuell */
  delta_per_100g       numeric,
  /** Ingredienser som ändrats, för att kunna visa vad som hänt */
  details              jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ing AS (
    SELECT
      r.id   AS rid,
      r.name AS rname,
      r.food_item_id,
      ri.weight_grams,
      f.name AS fname,
      f.calories,
      ri.snapshot_calories,
      (ri.snapshot_calories IS NOT NULL
       AND abs(f.calories - ri.snapshot_calories) > 0.5) AS drifted
    FROM public.recipes r
    JOIN public.recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN public.food_items f ON f.id = ri.food_item_id
    WHERE r.visibility = 'official'
  ),
  agg AS (
    SELECT
      rid, rname, food_item_id,
      count(*) FILTER (WHERE drifted) AS drifted_n,
      count(*)                        AS total_n,
      sum(calories * weight_grams / 100.0) AS sum_kcal,
      sum(weight_grams)                    AS sum_weight,
      jsonb_agg(
        jsonb_build_object(
          'ingredient', fname,
          'was', snapshot_calories,
          'now', calories
        ) ORDER BY abs(calories - snapshot_calories) DESC
      ) FILTER (WHERE drifted) AS details
    FROM ing
    GROUP BY rid, rname, food_item_id
  )
  SELECT
    a.rid,
    a.rname,
    a.drifted_n,
    a.total_n,
    round(cf.calories, 1),
    round(a.sum_kcal / NULLIF(a.sum_weight, 0) * 100, 1),
    round(a.sum_kcal / NULLIF(a.sum_weight, 0) * 100 - cf.calories, 1),
    a.details
  FROM agg a
  LEFT JOIN public.food_items cf ON cf.id = a.food_item_id
  WHERE a.drifted_n > 0
    AND public.is_admin()
  ORDER BY abs(a.sum_kcal / NULLIF(a.sum_weight, 0) * 100 - cf.calories) DESC NULLS LAST,
           a.drifted_n DESC;
$$;

COMMENT ON FUNCTION public.get_drifted_official_recipes IS
  'Officiella recept vars ingredienser ändrats sedan receptet sparades. '
  'Endast läsning — omräkning görs medvetet via receptredigeraren.';

GRANT EXECUTE ON FUNCTION public.get_drifted_official_recipes() TO public;
GRANT EXECUTE ON FUNCTION public.get_drifted_official_recipes() TO authenticated;
