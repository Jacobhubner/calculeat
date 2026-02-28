-- =========================================================
-- MIGRATION: Add Shared Lists Feature — Steg 2/5
-- Date: 2026-03-01
-- Description: Lägger till shared_list_id på food_items.
--   - Ny kolumn shared_list_id (FK → shared_lists, ON DELETE CASCADE)
--   - Kritisk fix: Ersätter befintlig UNIQUE NULLS NOT DISTINCT (user_id, name)
--     med tre partiella index — annars krockar globala items (user_id IS NULL)
--     med listors items (också user_id IS NULL)
--   - Ny data_hash partial index för listors items
--   - Uppdaterade RLS-policies som inkluderar lista-membership-check
-- =========================================================

-- =========================================================
-- STEG 1: Lägg till shared_list_id-kolumn
-- =========================================================

ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS shared_list_id uuid
    REFERENCES public.shared_lists(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.food_items.shared_list_id IS
  'Om satt: detta livsmedel ägs av den gemensamma listan, inte av en enskild användare.
   Tre giltiga states (user_id, shared_list_id):
     (NOT NULL, NULL) = Personligt item
     (NULL, NULL)     = Globalt SLV/USDA-item
     (NULL, NOT NULL) = Listägt item';

CREATE INDEX IF NOT EXISTS idx_food_items_shared_list_id
  ON public.food_items(shared_list_id)
  WHERE shared_list_id IS NOT NULL;

-- =========================================================
-- STEG 2: Ersätt gammal UNIQUE-constraint med tre partiella index
--
-- PROBLEM: Den befintliga UNIQUE NULLS NOT DISTINCT (user_id, name)
-- betraktar alla rader med user_id IS NULL som "samma user" —
-- vilket innebär att globala SLV/USDA-items och listors items
-- (båda med user_id IS NULL) konkurrerar om namnutrymmet.
-- Två listor kan inte ha ett livsmedel med samma namn. ❌
--
-- LÖSNING: Tre separata partiella index täcker de tre giltiga states.
-- Varje partial index gäller enbart sin state — ingen överlappning.
-- =========================================================

-- Droppa befintlig UNIQUE-constraint
ALTER TABLE public.food_items
  DROP CONSTRAINT IF EXISTS food_items_user_id_name_key;

-- Index 1: Personliga items (user_id IS NOT NULL)
-- Bibehåller exakt samma beteende som den gamla constrainten för user-ägda items.
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_user_name
  ON public.food_items(user_id, name)
  WHERE user_id IS NOT NULL;

-- Index 2: Globala items (SLV/USDA — båda kolumnerna NULL)
-- Unika namn bland globala items.
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_global_name
  ON public.food_items(name)
  WHERE user_id IS NULL AND shared_list_id IS NULL;

-- Index 3: Listors items (shared_list_id IS NOT NULL, user_id IS NULL)
-- Unika namn per lista — två olika listor kan ha ett item med samma namn.
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_shared_list_name
  ON public.food_items(shared_list_id, name)
  WHERE shared_list_id IS NOT NULL;

-- =========================================================
-- STEG 3: Ny data_hash partial index för listors items
--
-- Befintlig: idx_food_items_user_data_hash (user_id, data_hash) WHERE user_id IS NOT NULL
-- Ny: (shared_list_id, data_hash) WHERE shared_list_id IS NOT NULL
--
-- Möjliggör framtida deduplicering vid copy_food_item_to_shared_list.
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_shared_list_data_hash
  ON public.food_items(shared_list_id, data_hash)
  WHERE shared_list_id IS NOT NULL;

-- =========================================================
-- STEG 4: Uppdatera RLS-policies på food_items
--
-- Befintlig SELECT-policy täcker: user_id IS NULL OR auth.uid() = user_id
-- Ny policy lägger till en OR-gren för listmedlemmar.
-- INSERT/UPDATE/DELETE-policies utökas analogt.
--
-- PERFORMANCE: (SELECT auth.uid()) utvärderas en gång per statement, inte per rad.
-- Index idx_shared_list_members_user_list optimerar EXISTS-subqueryn.
-- =========================================================

-- SELECT
DROP POLICY IF EXISTS "Users can view global and own food items" ON public.food_items;

CREATE POLICY "Users can view accessible food items"
  ON public.food_items FOR SELECT
  USING (
    -- Globalt SLV/USDA-item
    (user_id IS NULL AND shared_list_id IS NULL)
    OR
    -- Eget personligt item
    user_id = (SELECT auth.uid())
    OR
    -- Listägt item: verifiera att auth.uid() är med i listan
    (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = food_items.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- INSERT
DROP POLICY IF EXISTS "Users can insert own food items" ON public.food_items;

CREATE POLICY "Users can insert own or list food items"
  ON public.food_items FOR INSERT
  WITH CHECK (
    -- Personligt item
    user_id = (SELECT auth.uid())
    OR
    -- Listägt item: user_id måste vara NULL, auth.uid() måste vara listmedlem
    (
      user_id IS NULL
      AND shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = food_items.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "Users can update own food items" ON public.food_items;

CREATE POLICY "Users can update own or list food items"
  ON public.food_items FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
    OR
    (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = food_items.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );

-- DELETE
DROP POLICY IF EXISTS "Users can delete own food items" ON public.food_items;

CREATE POLICY "Users can delete own or list food items"
  ON public.food_items FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR
    (
      shared_list_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shared_list_members slm
        WHERE slm.shared_list_id = food_items.shared_list_id
          AND slm.user_id = (SELECT auth.uid())
      )
    )
  );
