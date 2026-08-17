-- Följdfel efter att publicering öppnades för alla admins (20260817161817):
-- unpublish_recipe_from_bank kräver `user_id = auth.uid()`, och samtliga 50
-- befintliga bankrecept ägs av superadmin-kontot. En annan admin kunde alltså
-- publicera sina egna recept men inte avpublicera något av bankens.
--
-- Receptbanken är en gemensam redaktionell yta, inte privat egendom: den som
-- får publicera dit ska också kunna ta bort därifrån.
--
-- Följeslagar-livsmedlet återgår till receptets ÄGARE (v_recipe.user_id),
-- inte till den som avpublicerar — annars skulle admin B ta över admin A:s
-- livsmedel och receptet bli trasigt för A.
CREATE OR REPLACE FUNCTION public.unpublish_recipe_from_bank(p_recipe_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_recipe public.recipes;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Vilken admin som helst får avpublicera, oavsett vem som publicerade.
  SELECT * INTO v_recipe FROM public.recipes
  WHERE id = p_recipe_id AND visibility = 'official';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- Tillbaka till receptets ägare, inte till den som avpublicerar.
  IF v_recipe.food_item_id IS NOT NULL THEN
    UPDATE public.food_items SET user_id = v_recipe.user_id
    WHERE id = v_recipe.food_item_id;
  END IF;

  UPDATE public.recipes SET visibility = 'private', premium_only = false
  WHERE id = p_recipe_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.unpublish_recipe_from_bank FROM anon;
GRANT  EXECUTE ON FUNCTION public.unpublish_recipe_from_bank TO authenticated;
