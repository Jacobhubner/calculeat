-- =========================================================
-- MIGRATION: Add Shared Lists Feature — Steg 3/5
-- Date: 2026-03-01
-- Description: Uppdaterar recipes-tabellen för listägande.
--   - Ny kolumn created_by (oföränderlig skaparhistorik)
--   - Backfill created_by från befintlig user_id
--   - Gör user_id nullable (NULL = listan äger receptet)
--   - Ny kolumn shared_list_id (FK → shared_lists, ON DELETE CASCADE)
--   - Ny partial unique index för listrecept
--   - Uppdaterade RLS-policies för recipes och recipe_ingredients
--
-- ARKITEKTURBESLUT:
--   user_id = NULL + shared_list_id IS NOT NULL → listägt recept
--   user_id NOT NULL + shared_list_id IS NULL   → personligt recept
--   created_by är alltid satt (aldrig NULL för nya recept) och ändras aldrig.
-- =========================================================

-- =========================================================
-- STEG 1: Lägg till created_by för skaparhistorik
--
-- Bevarar information om vem som skapade receptet
-- även efter att user_id sätts till NULL för listrecept.
-- SET NULL om skaparen raderar sitt konto.
-- =========================================================

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS created_by uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.recipes.created_by IS
  'Ursprunglig skapare av receptet — oföränderlig audit-historik.
   Sätts vid INSERT och ändras aldrig.
   NULL om skaparen har raderat sitt konto.
   Skiljer sig från user_id (som styr RLS-åtkomst och sätts NULL för listrecept).';

-- =========================================================
-- STEG 2: Backfill created_by från befintlig user_id
--
-- Alla befintliga recept ägs av en användare → created_by = user_id.
-- Måste göras INNAN user_id görs nullable.
-- =========================================================

UPDATE public.recipes
SET created_by = user_id
WHERE user_id IS NOT NULL
  AND created_by IS NULL;

-- =========================================================
-- STEG 3: Gör user_id nullable
--
-- user_id IS NULL + shared_list_id IS NOT NULL = listägt recept.
-- Befintliga recept påverkas inte (de har user_id IS NOT NULL).
-- =========================================================

ALTER TABLE public.recipes
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.recipes.user_id IS
  'RLS-ägarskap: NOT NULL = personligt recept, NULL = listägt recept.
   Vid listrecept: shared_list_id anger vilken lista som äger receptet.
   Se created_by för ursprunglig skaparhistorik.';

-- =========================================================
-- STEG 4: Lägg till shared_list_id-kolumn
-- =========================================================

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS shared_list_id uuid
    REFERENCES public.shared_lists(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.recipes.shared_list_id IS
  'Om satt: detta recept ägs av den gemensamma listan.
   Två giltiga states (user_id, shared_list_id):
     (NOT NULL, NULL) = Personligt recept
     (NULL, NOT NULL) = Listägt recept';

CREATE INDEX IF NOT EXISTS idx_recipes_shared_list_id
  ON public.recipes(shared_list_id)
  WHERE shared_list_id IS NOT NULL;

-- =========================================================
-- STEG 5: Partial unique index för listrecept
--
-- Befintlig UNIQUE(user_id, name) täcker personliga recept korrekt
-- (user_id IS NOT NULL → fungerar som förväntat).
-- Ny partial index täcker listrecept separat.
-- Två olika listor kan ha recept med samma namn.
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_shared_list_name
  ON public.recipes(shared_list_id, name)
  WHERE shared_list_id IS NOT NULL;

-- =========================================================
-- STEG 6: Uppdatera RLS-policies för recipes
--
-- Befintliga policies täcker: auth.uid() = user_id
-- Ny policy lägger till OR-gren för listmedlemmar.
-- =========================================================

-- SELECT
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;

CREATE POLICY "Users can view own or list recipes"
  ON public.recipes FOR SELECT
  USING (
    -- Personligt recept
    user_id = (SELECT auth.uid())
    OR
    -- Listägt recept: verifiera membership
    (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = recipes.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- INSERT
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;

CREATE POLICY "Users can insert own or list recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (
    -- Personligt recept
    user_id = (SELECT auth.uid())
    OR
    -- Listägt recept: user_id måste vara NULL, auth.uid() måste vara listmedlem
    (
      user_id IS NULL
      AND shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = recipes.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;

CREATE POLICY "Users can update own or list recipes"
  ON public.recipes FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
    OR
    (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = recipes.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- DELETE
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;

CREATE POLICY "Users can delete own or list recipes"
  ON public.recipes FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR
    (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = recipes.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- =========================================================
-- STEG 7: Uppdatera RLS-policies för recipe_ingredients
--
-- Befintliga policies kollar: recipes.user_id = auth.uid()
-- Ny policy lägger till OR-gren för listrecept.
-- =========================================================

DROP POLICY IF EXISTS "Users can view own recipe ingredients" ON public.recipe_ingredients;

CREATE POLICY "Users can view own or list recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (
            r.shared_list_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.shared_list_members slm
              WHERE slm.shared_list_id = r.shared_list_id
                AND slm.user_id = (SELECT auth.uid())
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can insert own recipe ingredients" ON public.recipe_ingredients;

CREATE POLICY "Users can insert own or list recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (
            r.shared_list_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.shared_list_members slm
              WHERE slm.shared_list_id = r.shared_list_id
                AND slm.user_id = (SELECT auth.uid())
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can update own recipe ingredients" ON public.recipe_ingredients;

CREATE POLICY "Users can update own or list recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (
            r.shared_list_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.shared_list_members slm
              WHERE slm.shared_list_id = r.shared_list_id
                AND slm.user_id = (SELECT auth.uid())
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can delete own recipe ingredients" ON public.recipe_ingredients;

CREATE POLICY "Users can delete own or list recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.user_id = (SELECT auth.uid())
          OR (
            r.shared_list_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.shared_list_members slm
              WHERE slm.shared_list_id = r.shared_list_id
                AND slm.user_id = (SELECT auth.uid())
            )
          )
        )
    )
  );
