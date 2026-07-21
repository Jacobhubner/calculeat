-- =========================================================
-- MIGRATION: Officiell receptbank ("Upptack recept") — Fas 1A backend
-- Date: 2026-07-21
--
-- CalculEat publicerar kuraterade recept som alla anvandare kan blada
-- bland och kopiera till sina egna recept. Premium-modell (blur-monstret
-- fran kostlagena): varje officiellt recept har premium_only-flagga.
-- Gratisanvandare ser gratisrecepten fullt ut och premiumrecepten som
-- lasta kort; kopiering av premiumrecept kraver premium. Kopiering av
-- ALLA recept raknas dessutom mot den befintliga receptkvoten (3 gratis).
--
-- Designbeslut:
-- - Officiella recept ags av en superadmin (recipes.user_id ar NOT NULL)
--   men markeras visibility='official'. Bara superadmins kan publicera.
-- - Foljeslagar-food_item for officiella recept ska ha user_id=NULL
--   (globalt synlig via befintlig policy) + is_recipe=true (filtreras
--   ur livsmedelslistans flikar). Ingredienser MASTE referera globala
--   livsmedel (user_id IS NULL) — enforce:as av seed-pipelinen.
-- - Kopior foljer bild-guardrailen: image_url kopieras ALDRIG
--   (en storage-fil <-> en receptrad). Bankens bild visas i banken.
-- =========================================================

-- ── 1. Nya kolumner ────────────────────────────────────────────────────
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'official')),
  ADD COLUMN IF NOT EXISTS premium_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_recipes_official
  ON public.recipes (visibility) WHERE visibility = 'official';

-- ── 2. RLS: alla inloggade (ej anonyma) far SE officiella recept ───────
-- Ersatter befintliga SELECT-policies med utokade varianter (en enda
-- permissive policy per tabell — undviker multiple_permissive_policies).

DROP POLICY IF EXISTS "Users can view own or list recipes" ON public.recipes;
CREATE POLICY "Users can view own, list or official recipes"
  ON public.recipes FOR SELECT
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
    OR (
      visibility = 'official'
      AND (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)) IS FALSE
    )
  );

DROP POLICY IF EXISTS "Users can view own or list recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Users can view own, list or official recipe ingredients"
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
          OR (
            r.visibility = 'official'
            AND (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)) IS FALSE
          )
        )
    )
  );

-- ── 3. Skydd: bara superadmins far publicera officiella recept ─────────
-- Vanliga anvandare har UPDATE-ratt pa egna recept och skulle annars
-- kunna satta visibility='official' sjalva. auth.uid() IS NULL slapps
-- igenom (migrations/service role — anvands av seed-pipelinen).
CREATE OR REPLACE FUNCTION public.enforce_official_recipe_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility = 'official'
     AND (TG_OP = 'INSERT' OR OLD.visibility IS DISTINCT FROM 'official') THEN
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid() AND a.is_super_admin = true
    ) THEN
      RAISE EXCEPTION 'Unauthorized: only super admins can publish official recipes';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_official_recipe_admin ON public.recipes;
CREATE TRIGGER trg_enforce_official_recipe_admin
  BEFORE INSERT OR UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_official_recipe_admin();

-- ── 4. Kvot-trigger: officiella recept raknas inte mot receptkvoten ────
-- (Superadmin ska kunna publicera obegransat oavsett egen plan, och
--  officiella rader ska inte ata upp adminens personliga kvot.)
CREATE OR REPLACE FUNCTION public.enforce_recipes_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
BEGIN
  IF NEW.shared_list_id IS NOT NULL OR NEW.visibility = 'official' THEN
    RETURN NEW;
  END IF;
  v_limit := (public.get_plan_limits(public.get_user_plan(NEW.user_id)) ->> 'recipes')::int;
  IF v_limit >= 0 AND (
    SELECT count(*) FROM public.recipes
    WHERE user_id = NEW.user_id
      AND shared_list_id IS NULL
      AND visibility <> 'official'
  ) >= v_limit THEN
    RAISE EXCEPTION 'PREMIUM_LIMIT_REACHED:recipes' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 5. Entitlements: ny nyckel recipe_bank_full ────────────────────────
-- Hall i synk med docs/PREMIUM_SPEC.md och src/lib/constants/entitlements.ts
CREATE OR REPLACE FUNCTION public.get_plan_limits(p_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_plan IN ('premium', 'founder') THEN jsonb_build_object(
      'saved_meals', -1,
      'recipes', -1,
      'recipe_images', true,
      'history_days', -1,
      'csv_export', true,
      'advanced_trends', true,
      'period_stats', true,
      'all_tdee_formulas', true,
      'calibrations_per_quarter', -1,
      'advanced_body_comp', true,
      'genetic_potential', true,
      'owned_shared_lists', -1,
      'label_scans_per_month', -1,
      'food_suggestions', true,
      'all_diet_modes', true,
      'recipe_bank_full', true
    )
    ELSE jsonb_build_object(
      'saved_meals', 10,
      'recipes', 3,
      'recipe_images', false,
      'history_days', 30,
      'csv_export', false,
      'advanced_trends', false,
      'period_stats', false,
      'all_tdee_formulas', false,
      'calibrations_per_quarter', 1,
      'advanced_body_comp', false,
      'genetic_potential', false,
      'owned_shared_lists', 1,
      'label_scans_per_month', 5,
      'food_suggestions', false,
      'all_diet_modes', false,
      'recipe_bank_full', false
    )
  END;
$$;

-- ── 6. RPC: kopiera officiellt recept till egna recept ─────────────────
-- Premium-koll for premium_only-recept (server-side, klienten kan inte
-- kringga). Receptkvoten enforce:as automatiskt av INSERT-triggern.
-- Fel i formatet PREMIUM_LIMIT_REACHED:<key> propageras till klienten
-- dar parsePremiumLimitError oppnar UpgradeModal.
CREATE OR REPLACE FUNCTION public.copy_official_recipe_to_personal(p_recipe_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_recipe public.recipes;
  v_enforcement text;
  v_name text;
  v_suffix int := 1;
  v_new_food_id uuid;
  v_new_recipe_id uuid := gen_random_uuid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'anonymous_not_allowed');
  END IF;

  SELECT * INTO v_recipe
  FROM public.recipes
  WHERE id = p_recipe_id AND visibility = 'official';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- Premium-gate for premiumrecept (respekterar enforcement-flaggan)
  IF v_recipe.premium_only THEN
    v_enforcement := COALESCE(
      (SELECT value FROM public.app_config WHERE key = 'premium_enforcement'), 'off');
    IF v_enforcement = 'on' AND NOT COALESCE(
      (public.get_plan_limits(public.get_user_plan(v_uid)) ->> 'recipe_bank_full')::boolean,
      false
    ) THEN
      RAISE EXCEPTION 'PREMIUM_LIMIT_REACHED:recipe_bank_full' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Namnkrock: recipes har UNIQUE(user_id, name)
  v_name := v_recipe.name;
  WHILE EXISTS (SELECT 1 FROM public.recipes WHERE user_id = v_uid AND name = v_name) LOOP
    v_suffix := v_suffix + 1;
    v_name := v_recipe.name || ' (' || v_suffix || ')';
  END LOOP;

  -- Kopiera foljeslagar-food_item (alla naringsfalt foljer med; source-
  -- och is_recipe-falt bevaras). Nytt agarskap = kopierande anvandaren.
  IF v_recipe.food_item_id IS NOT NULL THEN
    v_new_food_id := gen_random_uuid();
    INSERT INTO public.food_items
    SELECT (jsonb_populate_record(
      NULL::public.food_items,
      to_jsonb(f) || jsonb_build_object(
        'id', v_new_food_id,
        'user_id', v_uid,
        'name', v_name,
        'created_at', now(),
        'updated_at', now()
      )
    )).*
    FROM public.food_items f
    WHERE f.id = v_recipe.food_item_id;
  END IF;

  -- Kopiera receptraden. image_url satts medvetet till NULL (guardrail:
  -- en storage-fil <-> en receptrad). Kopian ar privat och gratis.
  -- INSERT-triggern enforce_recipes_quota kastar PREMIUM_LIMIT_REACHED:recipes
  -- om gratisanvandarens kvot (3) ar full — propageras till klienten.
  INSERT INTO public.recipes
  SELECT (jsonb_populate_record(
    NULL::public.recipes,
    to_jsonb(r) || jsonb_build_object(
      'id', v_new_recipe_id,
      'user_id', v_uid,
      'food_item_id', v_new_food_id,
      'name', v_name,
      'visibility', 'private',
      'premium_only', false,
      'shared_list_id', NULL,
      'created_by', v_uid,
      'image_url', NULL,
      'created_at', now(),
      'updated_at', now()
    )
  )).*
  FROM public.recipes r
  WHERE r.id = p_recipe_id;

  -- Kopiera ingredienserna (refererar samma globala livsmedel)
  INSERT INTO public.recipe_ingredients
  SELECT (jsonb_populate_record(
    NULL::public.recipe_ingredients,
    to_jsonb(ri) || jsonb_build_object(
      'id', gen_random_uuid(),
      'recipe_id', v_new_recipe_id,
      'created_at', now()
    )
  )).*
  FROM public.recipe_ingredients ri
  WHERE ri.recipe_id = p_recipe_id;

  RETURN jsonb_build_object('success', true, 'recipe_id', v_new_recipe_id, 'name', v_name);
END;
$$;

COMMENT ON FUNCTION public.copy_official_recipe_to_personal IS
  'Kopierar ett officiellt recept (receptbanken) till anropande anvandares
   egna recept: foljeslagar-food_item + receptrad + ingredienser.
   Premium-gate for premium_only-recept; receptkvoten enforce:as av
   INSERT-triggern. image_url kopieras aldrig (bild-guardrail).';

REVOKE EXECUTE ON FUNCTION public.copy_official_recipe_to_personal FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.copy_official_recipe_to_personal TO authenticated;
