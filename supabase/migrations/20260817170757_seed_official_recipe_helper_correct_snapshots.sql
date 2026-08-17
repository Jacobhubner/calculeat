-- Permanent seed-hjälpfunktion för receptbanken, med RÄTT snapshot-semantik.
--
-- VARFÖR: seed-migrationerna batch1–5 definierade varsin pg_temp-funktion som
-- skrev TOTALVÄRDE i snapshot_*-kolumnerna i stället för livsmedlets värde per
-- 100 g. Felet kopierades vidare mellan batcherna eftersom varje ny batch
-- utgick från den föregående. Rättat i 20260817170646.
--
-- Batch 6 och framåt ska anropa DEN HÄR funktionen i stället för att
-- kopiera in en egen loop — då kan förväxlingen inte återuppstå.
--
-- REGEL: snapshot_* = livsmedlets värde PER 100 G (referensvärdet), aldrig
-- ingrediensens bidrag till receptets totalsumma. Kolumnerna används enbart
-- för att upptäcka att ett livsmedel ändrats sedan receptet sparades, genom
-- jämförelse mot food_items.calories — som är per 100 g.
CREATE OR REPLACE FUNCTION public.seed_official_recipe_ingredient(
  p_recipe_id  uuid,
  p_food_name  text,
  p_grams      numeric,
  p_order      integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fi record;
BEGIN
  SELECT id, calories, fat_g, carb_g, protein_g INTO v_fi
  FROM public.food_items
  WHERE user_id IS NULL AND source = 'livsmedelsverket' AND name = p_food_name
  ORDER BY created_at
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.recipe_ingredients (
    recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order,
    snapshot_calories, snapshot_fat_g, snapshot_carb_g, snapshot_protein_g
  ) VALUES (
    p_recipe_id, v_fi.id, p_grams, 'g', p_grams, p_order,
    -- PER 100 G — inte p_grams * värde / 100. Se kommentaren ovan.
    v_fi.calories, v_fi.fat_g, v_fi.carb_g, v_fi.protein_g
  );

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.seed_official_recipe_ingredient IS
  'Lägger till en ingrediens i ett officiellt recept med korrekta '
  'ögonblicksbilder (per 100 g). Använd denna vid seedning av nya batcher '
  'i stället för att kopiera loopen från en tidigare batch-migration.';

-- Endast service role / migrationer. Ingen klient ska anropa den.
REVOKE ALL ON FUNCTION public.seed_official_recipe_ingredient(uuid, text, numeric, integer) FROM public;
REVOKE ALL ON FUNCTION public.seed_official_recipe_ingredient(uuid, text, numeric, integer) FROM anon;
REVOKE ALL ON FUNCTION public.seed_official_recipe_ingredient(uuid, text, numeric, integer) FROM authenticated;
