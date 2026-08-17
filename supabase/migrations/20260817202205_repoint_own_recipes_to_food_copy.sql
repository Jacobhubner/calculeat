-- När en användare "redigerar" ett globalt livsmedel skapas en privat kopia
-- (copy-on-write). Men användarens EGNA recept fortsatte peka på det globala
-- originalet, så rättningen fick aldrig genomslag i receptet.
--
-- Ur användarens synvinkel: hon korrigerar ett kalorivärde, får bekräftat att
-- det sparats, och receptet använder ändå det gamla värdet. Ingen driftvarning
-- heller — det globala livsmedlet ändrades ju inte. Helt tyst.
--
-- Här är automatik otvetydigt rätt: användaren har uttryckt sin avsikt genom
-- att redigera. Det skiljer sig från drift orsakad av NÅGON ANNAN, där
-- omräkning ska vara ett medvetet beslut.
--
-- AVGRÄNSNING: bara anroparens egna recept. Delade listors recept och
-- officiella recept rörs aldrig — de tillhör inte användaren, och ett recept
-- ska aldrig ändras för andra på grund av någons privata rättning.
CREATE OR REPLACE FUNCTION public.repoint_recipes_to_food_copy(p_copy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_original uuid;
  v_copy     public.food_items%ROWTYPE;
  v_count    integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_copy FROM public.food_items
  WHERE id = p_copy_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'copy_not_found');
  END IF;

  v_original := v_copy.global_food_id;
  IF v_original IS NULL THEN
    -- Inte en kopia av ett globalt livsmedel — inget att peka om.
    RETURN jsonb_build_object('success', true, 'updated', 0);
  END IF;

  -- Peka om ingredienserna i användarens EGNA recept, och uppdatera samtidigt
  -- ögonblicksbilden till kopians värden så ingen falsk drift uppstår.
  UPDATE public.recipe_ingredients ri
  SET food_item_id       = p_copy_id,
      snapshot_calories  = v_copy.calories,
      snapshot_fat_g     = v_copy.fat_g,
      snapshot_carb_g    = v_copy.carb_g,
      snapshot_protein_g = v_copy.protein_g
  FROM public.recipes r
  WHERE r.id = ri.recipe_id
    AND ri.food_item_id = v_original
    AND r.user_id = v_user_id
    AND r.shared_list_id IS NULL
    AND r.visibility IS DISTINCT FROM 'official';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated', v_count);
END;
$$;

COMMENT ON FUNCTION public.repoint_recipes_to_food_copy IS
  'Låter användarens egna recept följa med till den privata kopian när ett '
  'globalt livsmedel redigeras. Rör aldrig andras, delade eller officiella recept.';

REVOKE ALL ON FUNCTION public.repoint_recipes_to_food_copy(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.repoint_recipes_to_food_copy(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.repoint_recipes_to_food_copy(uuid) TO authenticated;
