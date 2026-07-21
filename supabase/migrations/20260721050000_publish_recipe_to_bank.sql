-- =========================================================
-- MIGRATION: Publicera/avpublicera recept till receptbanken från appen
-- Date: 2026-07-21
-- publish_recipe_to_bank: superadmin publicerar ett EGET privat recept.
--   Validerar att ALLA ingredienser refererar globala livsmedel
--   (user_id IS NULL) — annars fel med lista på lokala ingredienser.
--   Följeslagar-food_item byter ägare till NULL (globalt läsbar) så alla
--   användare kan se näringen; is_recipe=true håller den utanför
--   livsmedelsflikarna.
-- unpublish_recipe_from_bank: omvänt — visibility='private' och
--   följeslagaren tillbaka till adminens ägo.
-- Bilder: officiella bilder laddas upp till befintliga recipe-images-
--   bucketen (adminens mapp). Kopior ärver aldrig image_url (guardrail),
--   så ingen separat bucket behövs.
-- =========================================================

CREATE OR REPLACE FUNCTION public.publish_recipe_to_bank(
  p_recipe_id uuid,
  p_premium boolean DEFAULT false,
  p_tags text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_recipe public.recipes;
  v_bad text[];
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = v_uid AND a.is_super_admin = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO v_recipe FROM public.recipes
  WHERE id = p_recipe_id AND user_id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  IF v_recipe.visibility = 'official' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_official');
  END IF;
  IF v_recipe.shared_list_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'is_list_recipe');
  END IF;

  -- Alla ingredienser måste vara globala livsmedel (user_id IS NULL)
  SELECT array_agg(fi.name) INTO v_bad
  FROM public.recipe_ingredients ri
  JOIN public.food_items fi ON fi.id = ri.food_item_id
  WHERE ri.recipe_id = p_recipe_id AND fi.user_id IS NOT NULL;
  IF v_bad IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'non_global_ingredients',
      'ingredients', to_jsonb(v_bad)
    );
  END IF;

  -- Följeslagar-food_item → global (så alla kan läsa näringen)
  IF v_recipe.food_item_id IS NOT NULL THEN
    UPDATE public.food_items
    SET user_id = NULL, source = 'manual'
    WHERE id = v_recipe.food_item_id;
  END IF;

  UPDATE public.recipes
  SET visibility = 'official', premium_only = p_premium, tags = p_tags
  WHERE id = p_recipe_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

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
    SELECT 1 FROM public.admins a WHERE a.user_id = v_uid AND a.is_super_admin = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO v_recipe FROM public.recipes
  WHERE id = p_recipe_id AND user_id = v_uid AND visibility = 'official';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_recipe.food_item_id IS NOT NULL THEN
    UPDATE public.food_items SET user_id = v_uid
    WHERE id = v_recipe.food_item_id;
  END IF;

  UPDATE public.recipes SET visibility = 'private', premium_only = false
  WHERE id = p_recipe_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.publish_recipe_to_bank FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.publish_recipe_to_bank TO authenticated;
REVOKE EXECUTE ON FUNCTION public.unpublish_recipe_from_bank FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.unpublish_recipe_from_bank TO authenticated;
