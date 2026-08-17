-- Driftkontrollen gav tyst NULL i delta-kolumnen för recept utan
-- weight_grams — och UI:t hoppas över raden när värdet är NULL, så receptet
-- såg åtgärdat ut trots att inget räknats om.
--
-- weight_grams har aldrig skrivits från receptredigeraren (rättat i samma
-- ändring), så samtliga 145 privata ingrediensrader saknade den. Bara
-- seed-datan hade den satt. Att följa panelens egen uppmaning — "öppna och
-- spara om" — nollade alltså kolumnen och slog sönder mätningen.
--
-- Nu redovisas det öppet i stället: `weights_missing` säger att omräkningen
-- inte gick att göra, så gränssnittet kan skilja "ingen avvikelse" från
-- "gick inte att beräkna". Detektionen av drift bygger på snapshots och
-- påverkas inte — den har fungerat hela tiden.
--
-- DROP krävs eftersom returtypen får en kolumn till. DROP tar bort GRANTs,
-- så de sätts om nedan.
DROP FUNCTION IF EXISTS public.get_drifted_official_recipes();

CREATE FUNCTION public.get_drifted_official_recipes()
RETURNS TABLE (
  recipe_id            uuid,
  recipe_name          text,
  drifted_ingredients  bigint,
  total_ingredients    bigint,
  stored_per_100g      numeric,
  recalculated_per_100g numeric,
  delta_per_100g       numeric,
  /** true = någon ingrediens saknar vikt, så omräkningen kunde inte göras */
  weights_missing      boolean,
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
      count(*) FILTER (WHERE drifted)              AS drifted_n,
      count(*)                                     AS total_n,
      count(*) FILTER (WHERE weight_grams IS NULL) AS missing_w,
      sum(calories * weight_grams / 100.0)         AS sum_kcal,
      sum(weight_grams)                            AS sum_weight,
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
    CASE WHEN a.missing_w = 0
         THEN round(a.sum_kcal / NULLIF(a.sum_weight, 0) * 100, 1) END,
    CASE WHEN a.missing_w = 0
         THEN round(a.sum_kcal / NULLIF(a.sum_weight, 0) * 100 - cf.calories, 1) END,
    (a.missing_w > 0),
    a.details
  FROM agg a
  LEFT JOIN public.food_items cf ON cf.id = a.food_item_id
  WHERE a.drifted_n > 0
    AND public.is_admin()
  ORDER BY
    abs(COALESCE(a.sum_kcal / NULLIF(a.sum_weight, 0) * 100 - cf.calories, 0)) DESC,
    a.drifted_n DESC;
$$;

COMMENT ON FUNCTION public.get_drifted_official_recipes IS
  'Officiella recept vars ingredienser ändrats sedan receptet sparades. '
  'Endast läsning. weights_missing=true betyder att omräkningen inte kunde '
  'göras för att en ingrediens saknar vikt — driften är ändå verklig.';

GRANT EXECUTE ON FUNCTION public.get_drifted_official_recipes() TO public;
GRANT EXECUTE ON FUNCTION public.get_drifted_official_recipes() TO authenticated;
