-- =========================================================
-- MIGRATION: Admins får redigera officiella recept globalt
-- Date: 2026-07-22
-- Officiella recept ägs av superadmin-kontot, men ALLA admins ska kunna
-- redigera dem globalt (spegling av food_items-policyn som redan låter
-- alla admins ändra globala manuella livsmedel via is_admin()).
-- Utökar recipes + recipe_ingredients UPDATE/INSERT/DELETE-policies för
-- visibility='official'-rader till alla admins.
-- =========================================================

-- ── recipes: alla admins får uppdatera officiella recept ───────────────
DROP POLICY IF EXISTS "Users can update own or list recipes" ON public.recipes;
CREATE POLICY "Users can update own, list or official recipes"
  ON public.recipes FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
    OR (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.shared_list_members slm
        WHERE slm.shared_list_id = recipes.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
    OR (visibility = 'official' AND public.is_admin())
  );

-- ── recipe_ingredients: alla admins får ändra ingredienser i officiella
-- Utöka SELECT-policyn påverkas ej (officiella syns redan). Lägg till
-- INSERT/UPDATE/DELETE för admins på ingredienser vars recept är officiellt.
DROP POLICY IF EXISTS "Users can insert own or list recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users can insert own, list or official recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (r.shared_list_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.shared_list_members slm
            WHERE slm.shared_list_id = r.shared_list_id AND slm.user_id = (SELECT auth.uid())
          ))
          OR (r.visibility = 'official' AND public.is_admin())
        )
    )
  );

DROP POLICY IF EXISTS "Users can update own or list recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users can update own, list or official recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (r.shared_list_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.shared_list_members slm
            WHERE slm.shared_list_id = r.shared_list_id AND slm.user_id = (SELECT auth.uid())
          ))
          OR (r.visibility = 'official' AND public.is_admin())
        )
    )
  );

DROP POLICY IF EXISTS "Users can delete own or list recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users can delete own, list or official recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (r.shared_list_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.shared_list_members slm
            WHERE slm.shared_list_id = r.shared_list_id AND slm.user_id = (SELECT auth.uid())
          ))
          OR (r.visibility = 'official' AND public.is_admin())
        )
    )
  );
