-- get_recipes_using_food_item filtrerade enbart på auth.uid(), så en admin
-- som redigerade ett globalt livsmedel fick beskedet "0 recept påverkas"
-- även när livsmedlet ingick i samtliga officiella recept.
--
-- Varningen var alltså aktivt vilseledande i det läge där den behövs mest:
-- alla admins kan nu redigera globala livsmedel OCH publicera till
-- receptbanken, så en ändring kan slå mot 50 kuraterade recept.
--
-- Nu: alla ser sina egna recept som förut; admins ser dessutom officiella
-- recept, oavsett vem som äger dem. Andra användares PRIVATA recept
-- exponeras aldrig — de är inte adminens sak att se.
--
-- DROP krävs eftersom returtypen får en kolumn till. DROP tar bort GRANTs,
-- så de sätts om nedan — PostgREST ansluter som 'authenticator' och behöver
-- PUBLIC-granten, inte bara authenticated.
DROP FUNCTION IF EXISTS public.get_recipes_using_food_item(uuid);

CREATE FUNCTION public.get_recipes_using_food_item(p_food_item_id uuid)
RETURNS TABLE (
  recipe_id        uuid,
  recipe_name      text,
  servings         integer,
  ingredient_count bigint,
  /** true = officiellt bankrecept (syns bara för admins) */
  is_official      boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id                            AS recipe_id,
    r.name                          AS recipe_name,
    r.servings,
    COUNT(ri.id)                    AS ingredient_count,
    (r.visibility = 'official')     AS is_official
  FROM public.recipes r
  JOIN public.recipe_ingredients ri ON ri.recipe_id = r.id
  WHERE ri.food_item_id = p_food_item_id
    AND (
      r.user_id = (SELECT auth.uid())
      OR (r.visibility = 'official' AND public.is_admin())
    )
  GROUP BY r.id, r.name, r.servings, r.visibility
  ORDER BY (r.visibility = 'official') DESC, r.name;
$$;

COMMENT ON FUNCTION public.get_recipes_using_food_item IS
  'Recept som använder ett livsmedel. Egna recept för alla; officiella '
  'bankrecept dessutom för admins. Andra användares privata recept visas aldrig.';

GRANT EXECUTE ON FUNCTION public.get_recipes_using_food_item(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.get_recipes_using_food_item(uuid) TO authenticated;
