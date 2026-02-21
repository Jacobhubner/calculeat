-- =========================================================
-- MIGRATION: Add Sharing Feature
-- Date: 2026-02-21
-- Description: Lägger till delning av livsmedel och recept
--   mellan användare via e-post. Inkluderar:
--   - food_source enum-utökning med 'shared'
--   - data_hash kolumn + trigger på food_items
--   - shared_by kolumn på food_items
--   - share_invitations tabell med RLS
--   - Alla RPC-funktioner för dela/acceptera/neka
--   - recipe_ingredients FK till ON DELETE SET NULL
--   - get_recipes_using_food_item RPC (dataintegritet)
-- =========================================================

-- =========================================================
-- STEG 1: Utöka food_source enum med 'shared'
-- =========================================================
ALTER TYPE food_source ADD VALUE IF NOT EXISTS 'shared';

-- =========================================================
-- STEG 2: Nya kolumner på food_items
-- =========================================================

-- Visningsnamn för avsändaren. Sätts enbart när source = 'shared'.
ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS shared_by text;

-- Deterministisk SHA-256 hash för nutritions-deduplicering.
-- Beräknas automatiskt av trigger på INSERT/UPDATE.
-- NOT NULL sätts EFTER retroaktiv beräkning nedan.
-- ARKITEKTURBESLUT (låst): name ingår INTE i hashen.
-- Syftet är nutritionsekvivalens, inte namnidentitet.
ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS data_hash text;

-- =========================================================
-- STEG 3: Trigger för automatisk data_hash-beräkning
-- =========================================================

CREATE OR REPLACE FUNCTION public.calculate_food_item_data_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Hash-fält: calories, fat_g, carb_g, protein_g,
  --   reference_unit, reference_amount, brand, barcode,
  --   density_g_per_ml, grams_per_piece, ml_per_gram
  -- name ingår INTE (se arkitekturbeslut i migrationsplan)
  NEW.data_hash := encode(
    sha256(
      concat_ws('|',
        ROUND(COALESCE(NEW.calories, 0)::numeric, 2)::text,
        ROUND(COALESCE(NEW.fat_g, 0)::numeric, 2)::text,
        ROUND(COALESCE(NEW.carb_g, 0)::numeric, 2)::text,
        ROUND(COALESCE(NEW.protein_g, 0)::numeric, 2)::text,
        lower(COALESCE(NEW.reference_unit, 'g')),
        ROUND(COALESCE(NEW.reference_amount, 100)::numeric, 2)::text,
        lower(COALESCE(NEW.brand, '')),
        COALESCE(NEW.barcode, ''),
        ROUND(COALESCE(NEW.density_g_per_ml, 0)::numeric, 4)::text,
        ROUND(COALESCE(NEW.grams_per_piece, 0)::numeric, 4)::text,
        ROUND(COALESCE(NEW.ml_per_gram, 0)::numeric, 4)::text
      )::bytea
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

-- Triggern körs vid INSERT och vid UPDATE av relevanta nutritionsfält
CREATE TRIGGER calculate_data_hash_trigger
  BEFORE INSERT OR UPDATE OF calories, fat_g, carb_g, protein_g,
                              reference_unit, reference_amount, brand, barcode,
                              density_g_per_ml, grams_per_piece, ml_per_gram
  ON public.food_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_food_item_data_hash();

-- Retroaktiv beräkning av data_hash för alla befintliga rader.
-- Triggar calculate_data_hash_trigger via UPDATE.
UPDATE public.food_items SET updated_at = COALESCE(updated_at, now());

-- Sätt NOT NULL EFTER retroaktiv beräkning.
-- Garanterar att deduplicering aldrig kan kringgås av NULL.
ALTER TABLE public.food_items
  ALTER COLUMN data_hash SET NOT NULL;

-- Unik constraint per användare baserat på näringsprofil (inte namn).
-- Används av _upsert_shared_food_item för race condition-säker deduplicering.
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_user_data_hash
  ON public.food_items(user_id, data_hash)
  WHERE user_id IS NOT NULL;

-- =========================================================
-- STEG 4: FK-uppdatering på recipe_ingredients
-- recipe_ingredients.food_item_id -> ON DELETE SET NULL
-- Säkerställer att recept överlever radering av ingredienser.
-- UI visar "[Borttaget livsmedel]" för NULL-rader.
-- =========================================================

-- Gör food_item_id nullable (krävs för ON DELETE SET NULL)
ALTER TABLE public.recipe_ingredients
  ALTER COLUMN food_item_id DROP NOT NULL;

-- Ersätt befintlig FK med ny som har ON DELETE SET NULL
ALTER TABLE public.recipe_ingredients
  DROP CONSTRAINT IF EXISTS recipe_ingredients_food_item_id_fkey;

ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_food_item_id_fkey
    FOREIGN KEY (food_item_id)
    REFERENCES public.food_items(id)
    ON DELETE SET NULL;

-- =========================================================
-- STEG 5: Ny tabell share_invitations
-- =========================================================

CREATE TABLE IF NOT EXISTS public.share_invitations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  sender_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  item_type        text NOT NULL CHECK (item_type IN ('food_item', 'recipe')),

  -- item_id är INTE FK: originalet kan raderas. Snapshot är auktoritativ.
  item_id          uuid NOT NULL,

  -- JSONB snapshot av det delade objektet vid send-tidpunkten.
  -- v1 food_item: {name, calories, fat_g, carb_g, protein_g, reference_unit,
  --   reference_amount, default_amount, default_unit, food_type, ml_per_gram,
  --   grams_per_piece, serving_unit, density_g_per_ml, notes, brand, barcode,
  --   is_global, original_food_item_id}
  -- v1 recipe: {name, servings, total_weight_grams, food_item_snapshot, ingredients[]}
  snapshot         jsonb NOT NULL,

  -- Versionering för framtida snapshot-schema-ändringar.
  -- v1 = nuvarande format. v2 kan inkludera mikronäringsvärden.
  snapshot_version smallint NOT NULL DEFAULT 1,

  -- Avsändarens visningsnamn vid send-tidpunkten (immutabelt).
  sender_name      text NOT NULL,

  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),

  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  responded_at     timestamptz,

  -- Förhindra self-share på databasnivå
  CONSTRAINT no_self_share CHECK (sender_id != recipient_id)
);

COMMENT ON TABLE public.share_invitations IS
  'Delningsinbjudningar för livsmedel och recept. Använder JSONB-snapshots
   för dataintegritet även om originalet raderas. Snapshot är auktoritativ.';

COMMENT ON COLUMN public.share_invitations.snapshot IS
  'Full datasnapshot vid send-tidpunkten (v1). is_global=true i ingrediens-snapshot
   indikerar globalt SLV/USDA-objekt som ska länkas, inte kopieras.';

COMMENT ON COLUMN public.share_invitations.item_id IS
  'Original UUID för referens. INTE FK — originalet kan raderas.
   Snapshot-kolumnen är auktoritativ för import.';

-- Index för primärt åtkomstmönster: mottagen inkorg
CREATE INDEX IF NOT EXISTS idx_share_invitations_recipient_pending
  ON public.share_invitations(recipient_id)
  WHERE status = 'pending';

-- Index för sekundärt mönster: skickade inbjudningar
CREATE INDEX IF NOT EXISTS idx_share_invitations_sender_id
  ON public.share_invitations(sender_id);

-- Index för framtida cron-jobb (expirering)
CREATE INDEX IF NOT EXISTS idx_share_invitations_expires_at
  ON public.share_invitations(expires_at)
  WHERE status = 'pending';

-- Partial unique index: förhindrar dubbletter av pending-inbjudningar.
-- item_type inkluderas för korrekthet (food_item och recipe kan dela UUID).
-- Enklare och snabbare än EXCLUDE USING btree för detta ändamål.
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_invitations_unique_pending
  ON public.share_invitations(sender_id, recipient_id, item_type, item_id)
  WHERE status = 'pending';

-- =========================================================
-- STEG 6: RLS för share_invitations
-- =========================================================

ALTER TABLE public.share_invitations ENABLE ROW LEVEL SECURITY;

-- Avsändare ser sina egna skickade inbjudningar
CREATE POLICY "Senders see own sent invitations"
  ON public.share_invitations FOR SELECT
  USING (sender_id = auth.uid());

-- Mottagare ser sina egna mottagna inbjudningar
CREATE POLICY "Recipients see own received invitations"
  ON public.share_invitations FOR SELECT
  USING (recipient_id = auth.uid());

-- Inga direkta INSERT/UPDATE/DELETE — allt hanteras via SECURITY DEFINER RPC.
-- Dubbelt säkerhetsskikt: RLS + ägarskapsvalidering i RPC.
CREATE POLICY "No direct insert on share_invitations"
  ON public.share_invitations FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct update on share_invitations"
  ON public.share_invitations FOR UPDATE USING (false);

CREATE POLICY "No direct delete on share_invitations"
  ON public.share_invitations FOR DELETE USING (false);

-- =========================================================
-- STEG 7: Realtime-publikation
-- Krävs för Supabase Realtime postgres_changes.
-- Mottagaren prenumererar på INSERT/UPDATE via recipient_id-filter.
-- =========================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.share_invitations;

-- =========================================================
-- STEG 8: Privat hjälpfunktion _upsert_shared_food_item
-- =========================================================

CREATE OR REPLACE FUNCTION public._upsert_shared_food_item(
  p_snapshot    jsonb,
  p_user_id     uuid,
  p_sender_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_global            boolean := COALESCE((p_snapshot->>'is_global')::boolean, false);
  v_original_id          uuid    := (p_snapshot->>'original_food_item_id')::uuid;
  v_existing_id          uuid;
  v_new_id               uuid;
  v_target_name          text;
  v_suffix_name          text;
  v_attempt              int;

  -- Nutritionsvärden från snapshot
  v_calories     numeric := COALESCE((p_snapshot->>'calories')::numeric, 0);
  v_fat_g        numeric := COALESCE((p_snapshot->>'fat_g')::numeric, 0);
  v_carb_g       numeric := COALESCE((p_snapshot->>'carb_g')::numeric, 0);
  v_protein_g    numeric := COALESCE((p_snapshot->>'protein_g')::numeric, 0);
  v_ref_unit     text    := COALESCE(p_snapshot->>'reference_unit', 'g');
  v_ref_amount   numeric := COALESCE((p_snapshot->>'reference_amount')::numeric, 100);
  v_brand        text    := COALESCE(p_snapshot->>'brand', '');
  v_barcode      text    := COALESCE(p_snapshot->>'barcode', '');
  v_density      numeric := COALESCE((p_snapshot->>'density_g_per_ml')::numeric, 0);
  v_grams_piece  numeric := COALESCE((p_snapshot->>'grams_per_piece')::numeric, 0);
  v_ml_per_gram  numeric := COALESCE((p_snapshot->>'ml_per_gram')::numeric, 0);

  -- Beräkna samma hash som triggern (utan name)
  v_computed_hash text;
BEGIN
  -- -------------------------------------------------------
  -- GLOBALT OBJEKT: Länka till original, kopiera INTE
  -- ARKITEKTURBESLUT (låst):
  --   IF is_global = true AND original_food_item_id finns i DB:
  --     → Returnera original_food_item_id direkt
  --     → Ingen kopia, ingen source='shared'-rad
  --   Om globalt objekt saknas (exceptionellt):
  --     → Fallback: skapa user-kopia från snapshot
  -- -------------------------------------------------------
  IF v_is_global AND v_original_id IS NOT NULL THEN
    -- Verifiera att det globala objektet fortfarande finns
    SELECT id INTO v_existing_id
    FROM public.food_items
    WHERE id = v_original_id
      AND user_id IS NULL  -- globalt = user_id IS NULL
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      -- Globalt objekt finns: returnera direkt utan kopia
      RETURN v_existing_id;
    END IF;
    -- Annars: fall igenom till snapshot-import (fallback)
  END IF;

  -- -------------------------------------------------------
  -- USER-ÄGET OBJEKT: Deduplicering via data_hash
  -- Beräkna hash med samma algoritm som triggern
  -- -------------------------------------------------------
  v_computed_hash := encode(
    sha256(
      concat_ws('|',
        ROUND(v_calories, 2)::text,
        ROUND(v_fat_g, 2)::text,
        ROUND(v_carb_g, 2)::text,
        ROUND(v_protein_g, 2)::text,
        lower(v_ref_unit),
        ROUND(v_ref_amount, 2)::text,
        lower(v_brand),
        v_barcode,
        ROUND(v_density, 4)::text,
        ROUND(v_grams_piece, 4)::text,
        ROUND(v_ml_per_gram, 4)::text
      )::bytea
    ),
    'hex'
  );

  -- Sök efter identisk nutritionsprofil hos mottagaren
  SELECT id INTO v_existing_id
  FROM public.food_items
  WHERE user_id   = p_user_id
    AND data_hash = v_computed_hash
    AND is_hidden = false
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Exakt nutritionsmatch: returnera befintligt ID (ingen kopia)
    RETURN v_existing_id;
  END IF;

  -- -------------------------------------------------------
  -- Ingen match: Skapa ny user-kopia med source='shared'
  -- Namnkollisionsstrategi (retry-loop, aldrig DO UPDATE):
  --   1. Försök originalnamnet
  --   2. "{namn} – {sender_name}"
  --   3. "{namn} – {sender_name} (2)", (3), ... upp till (10)
  -- Befintliga rader skrivs ALDRIG över.
  -- -------------------------------------------------------
  v_target_name := p_snapshot->>'name';

  FOR v_attempt IN 0..11 LOOP
    IF v_attempt = 0 THEN
      v_suffix_name := v_target_name;
    ELSIF v_attempt = 1 THEN
      v_suffix_name := v_target_name || ' – ' || p_sender_name;
    ELSE
      v_suffix_name := v_target_name || ' – ' || p_sender_name || ' (' || (v_attempt)::text || ')';
    END IF;

    BEGIN
      INSERT INTO public.food_items (
        user_id,
        name,
        source,
        shared_by,
        calories,
        fat_g,
        carb_g,
        protein_g,
        reference_unit,
        reference_amount,
        default_amount,
        default_unit,
        food_type,
        ml_per_gram,
        grams_per_piece,
        serving_unit,
        density_g_per_ml,
        notes,
        brand,
        barcode,
        is_recipe,
        is_hidden,
        weight_grams
      )
      VALUES (
        p_user_id,
        v_suffix_name,
        'shared',
        p_sender_name,
        v_calories,
        v_fat_g,
        v_carb_g,
        v_protein_g,
        v_ref_unit,
        v_ref_amount,
        COALESCE((p_snapshot->>'default_amount')::numeric, 100),
        COALESCE(p_snapshot->>'default_unit', 'g'),
        COALESCE(p_snapshot->>'food_type', 'Solid'),
        NULLIF(v_ml_per_gram, 0),
        NULLIF(v_grams_piece, 0),
        p_snapshot->>'serving_unit',
        NULLIF(v_density, 0),
        p_snapshot->>'notes',
        NULLIF(p_snapshot->>'brand', ''),
        NULLIF(p_snapshot->>'barcode', ''),
        false,
        false,
        (p_snapshot->>'weight_grams')::numeric
      )
      RETURNING id INTO v_new_id;

      -- INSERT lyckades
      RETURN v_new_id;

    EXCEPTION WHEN unique_violation THEN
      -- Namnkollision: försök nästa suffix
      CONTINUE;
    END;
  END LOOP;

  -- Alla 12 försök misslyckades (extremt osannolikt)
  RAISE EXCEPTION 'name_conflict_unresolvable: Kunde inte skapa unikt namn för livsmedel "%"', v_target_name;
END;
$$;

COMMENT ON FUNCTION public._upsert_shared_food_item IS
  'Intern dedupliceringsmotor för delningsimport. Ej anropbar direkt av klienter.
   Globala objekt (is_global=true): länkas till original, kopieras ej.
   User-ägda objekt: deduplicering via data_hash, retry-loop för namnkollisioner.';

-- Revokera åtkomst: enbart accept_share_invitation kan anropa denna internt
REVOKE EXECUTE ON FUNCTION public._upsert_shared_food_item FROM PUBLIC, anon, authenticated;

-- =========================================================
-- STEG 9: send_share_invitation
-- =========================================================

CREATE OR REPLACE FUNCTION public.send_share_invitation(
  p_item_id           uuid,
  p_item_type         text,
  p_recipient_email   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id       uuid := auth.uid();
  v_sender_name     text;
  v_recipient_id    uuid;
  v_item_snapshot   jsonb;
  v_invitation_id   uuid;
  v_food_item       record;
  v_recipe          record;
  v_ingredient      record;
  v_ingredients_arr jsonb := '[]'::jsonb;
  v_ing_snap        jsonb;
  v_fi_snap         jsonb;
BEGIN
  -- Validera item_type
  IF p_item_type NOT IN ('food_item', 'recipe') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_item_type');
  END IF;

  -- Hämta avsändarens visningsnamn
  SELECT COALESCE(profile_name, email)
  INTO v_sender_name
  FROM public.user_profiles
  WHERE id = v_sender_id;

  IF v_sender_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'sender_not_found');
  END IF;

  -- -------------------------------------------------------
  -- Ägarskaps- och delbarhetsvalidering
  -- REGEL (låst): Enbart source='manual' + user_id=auth.uid() kan delas.
  -- Globala, delade och importerade objekt kan ALDRIG delas.
  -- -------------------------------------------------------
  IF p_item_type = 'food_item' THEN
    SELECT * INTO v_food_item
    FROM public.food_items
    WHERE id = p_item_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;

    IF v_food_item.user_id IS NULL OR v_food_item.user_id != v_sender_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_owner');
    END IF;

    IF v_food_item.source != 'manual' THEN
      RETURN jsonb_build_object('success', false, 'error', 'cannot_share_non_manual_item');
    END IF;

    -- Bygg food_item-snapshot
    v_item_snapshot := jsonb_build_object(
      'name',               v_food_item.name,
      'calories',           v_food_item.calories,
      'fat_g',              v_food_item.fat_g,
      'carb_g',             v_food_item.carb_g,
      'protein_g',          v_food_item.protein_g,
      'reference_unit',     v_food_item.reference_unit,
      'reference_amount',   v_food_item.reference_amount,
      'default_amount',     v_food_item.default_amount,
      'default_unit',       v_food_item.default_unit,
      'food_type',          v_food_item.food_type,
      'ml_per_gram',        v_food_item.ml_per_gram,
      'grams_per_piece',    v_food_item.grams_per_piece,
      'serving_unit',       v_food_item.serving_unit,
      'density_g_per_ml',   v_food_item.density_g_per_ml,
      'notes',              v_food_item.notes,
      'brand',              v_food_item.brand,
      'barcode',            v_food_item.barcode,
      'weight_grams',       v_food_item.weight_grams,
      'is_global',          false,
      'original_food_item_id', NULL
    );

  ELSIF p_item_type = 'recipe' THEN
    SELECT * INTO v_recipe
    FROM public.recipes
    WHERE id = p_item_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;

    IF v_recipe.user_id != v_sender_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_owner');
    END IF;

    -- Bygg ingredient-snapshots
    FOR v_ingredient IN
      SELECT
        ri.amount, ri.unit, ri.weight_grams, ri.ingredient_order,
        fi.id AS fi_id, fi.name, fi.calories, fi.fat_g, fi.carb_g,
        fi.protein_g, fi.reference_unit, fi.reference_amount,
        fi.default_amount, fi.default_unit, fi.food_type,
        fi.ml_per_gram, fi.grams_per_piece, fi.serving_unit,
        fi.density_g_per_ml, fi.notes, fi.brand, fi.barcode,
        fi.weight_grams AS fi_weight_grams, fi.user_id AS fi_user_id
      FROM public.recipe_ingredients ri
      JOIN public.food_items fi ON fi.id = ri.food_item_id
      WHERE ri.recipe_id = p_item_id
      ORDER BY ri.ingredient_order
    LOOP
      -- Globalt objekt (SLV/USDA): is_global=true med original_food_item_id
      -- User-ägt objekt: is_global=false
      v_fi_snap := jsonb_build_object(
        'name',               v_ingredient.name,
        'calories',           v_ingredient.calories,
        'fat_g',              v_ingredient.fat_g,
        'carb_g',             v_ingredient.carb_g,
        'protein_g',          v_ingredient.protein_g,
        'reference_unit',     v_ingredient.reference_unit,
        'reference_amount',   v_ingredient.reference_amount,
        'default_amount',     v_ingredient.default_amount,
        'default_unit',       v_ingredient.default_unit,
        'food_type',          v_ingredient.food_type,
        'ml_per_gram',        v_ingredient.ml_per_gram,
        'grams_per_piece',    v_ingredient.grams_per_piece,
        'serving_unit',       v_ingredient.serving_unit,
        'density_g_per_ml',   v_ingredient.density_g_per_ml,
        'notes',              v_ingredient.notes,
        'brand',              v_ingredient.brand,
        'barcode',            v_ingredient.barcode,
        'weight_grams',       v_ingredient.fi_weight_grams,
        'is_global',          (v_ingredient.fi_user_id IS NULL),
        'original_food_item_id', CASE
          WHEN v_ingredient.fi_user_id IS NULL THEN v_ingredient.fi_id
          ELSE NULL
        END
      );

      v_ing_snap := jsonb_build_object(
        'amount',           v_ingredient.amount,
        'unit',             v_ingredient.unit,
        'weight_grams',     v_ingredient.weight_grams,
        'ingredient_order', v_ingredient.ingredient_order,
        'food_item_snapshot', v_fi_snap
      );
      v_ingredients_arr := v_ingredients_arr || jsonb_build_array(v_ing_snap);
    END LOOP;

    -- Bygg recipe food_item snapshot (om det finns)
    v_fi_snap := NULL;
    IF v_recipe.food_item_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'name',             fi.name,
        'calories',         fi.calories,
        'fat_g',            fi.fat_g,
        'carb_g',           fi.carb_g,
        'protein_g',        fi.protein_g,
        'reference_unit',   fi.reference_unit,
        'reference_amount', fi.reference_amount,
        'default_amount',   fi.default_amount,
        'default_unit',     fi.default_unit,
        'food_type',        fi.food_type,
        'ml_per_gram',      fi.ml_per_gram,
        'grams_per_piece',  fi.grams_per_piece,
        'serving_unit',     fi.serving_unit,
        'density_g_per_ml', fi.density_g_per_ml,
        'notes',            fi.notes,
        'brand',            fi.brand,
        'barcode',          fi.barcode,
        'weight_grams',     fi.weight_grams,
        'is_global',        (fi.user_id IS NULL),
        'original_food_item_id', CASE WHEN fi.user_id IS NULL THEN fi.id ELSE NULL END
      )
      INTO v_fi_snap
      FROM public.food_items fi
      WHERE fi.id = v_recipe.food_item_id;
    END IF;

    -- Bygg recipe-snapshot
    v_item_snapshot := jsonb_build_object(
      'name',               v_recipe.name,
      'servings',           v_recipe.servings,
      'total_weight_grams', v_recipe.total_weight_grams,
      'food_item_snapshot', v_fi_snap,
      'ingredients',        v_ingredients_arr
    );
  END IF;

  -- -------------------------------------------------------
  -- E-post-enumeration prevention:
  -- Slå upp mottagare tyst. Returnera success oavsett om
  -- e-posten finns — aldrig avslöja om en adress finns.
  -- -------------------------------------------------------
  SELECT id INTO v_recipient_id
  FROM public.user_profiles
  WHERE lower(email) = lower(trim(p_recipient_email));

  -- Om mottagaren inte finns: returnera success tyst (ingen inbjudan skapas)
  IF v_recipient_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'invitation_id', NULL);
  END IF;

  -- Förhindra self-share
  IF v_recipient_id = v_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_share_with_yourself');
  END IF;

  -- -------------------------------------------------------
  -- Skapa inbjudan (partial unique index skyddar mot duplicat)
  -- -------------------------------------------------------
  INSERT INTO public.share_invitations (
    sender_id, recipient_id, item_type, item_id,
    snapshot, sender_name
  )
  VALUES (
    v_sender_id, v_recipient_id, p_item_type, p_item_id,
    v_item_snapshot, v_sender_name
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_invitation_id;

  -- Om konflikt (befintlig pending): hämta befintlig ID
  IF v_invitation_id IS NULL THEN
    SELECT id INTO v_invitation_id
    FROM public.share_invitations
    WHERE sender_id    = v_sender_id
      AND recipient_id = v_recipient_id
      AND item_type    = p_item_type
      AND item_id      = p_item_id
      AND status       = 'pending'
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object('success', true, 'invitation_id', v_invitation_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.send_share_invitation IS
  'Skapar delningsinbjudan. Validerar ägarskap (enbart source=manual tillåts).
   Returnerar alltid success oavsett om mottagarens e-post finns (privacy).
   SECURITY DEFINER: kör med förhöjda rättigheter för cross-user-uppslag.';

-- =========================================================
-- STEG 10: accept_share_invitation
-- =========================================================

CREATE OR REPLACE FUNCTION public.accept_share_invitation(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id     uuid := auth.uid();
  v_invitation       record;
  v_snap             jsonb;
  v_fi_snap          jsonb;
  v_food_item_id     uuid;
  v_recipe_id        uuid;
  v_new_recipe_fi_id uuid;
  v_ingredient       jsonb;
  v_ingredient_fi_id uuid;
  v_recipe_name      text;
  v_attempt          int;
  v_suffix_name      text;
BEGIN
  -- Hämta inbjudan med rad-lås för att förhindra race conditions.
  -- FOR UPDATE NOWAIT: misslyckas omedelbart om raden är låst
  -- (t.ex. två flikar accepterar simultant).
  SELECT * INTO v_invitation
  FROM public.share_invitations
  WHERE id          = p_invitation_id
    AND recipient_id = v_recipient_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invitation_already_processed',
      'status', v_invitation.status
    );
  END IF;

  IF v_invitation.expires_at < now() THEN
    UPDATE public.share_invitations
    SET status = 'expired', responded_at = now()
    WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'invitation_expired');
  END IF;

  v_snap := v_invitation.snapshot;

  -- -------------------------------------------------------
  -- FOOD_ITEM: Importera via dedupliceringsmotor
  -- -------------------------------------------------------
  IF v_invitation.item_type = 'food_item' THEN
    v_food_item_id := public._upsert_shared_food_item(
      v_snap,
      v_recipient_id,
      v_invitation.sender_name
    );

    UPDATE public.share_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = p_invitation_id;

    RETURN jsonb_build_object(
      'success',      true,
      'food_item_id', v_food_item_id,
      'item_type',    'food_item'
    );

  -- -------------------------------------------------------
  -- RECIPE: Importera ingredienser + recept
  -- -------------------------------------------------------
  ELSIF v_invitation.item_type = 'recipe' THEN

    -- Steg 1: Importera receptets food_item (om snapshot finns)
    v_new_recipe_fi_id := NULL;
    v_fi_snap := v_snap->'food_item_snapshot';
    IF v_fi_snap IS NOT NULL AND v_fi_snap::text != 'null' THEN
      v_new_recipe_fi_id := public._upsert_shared_food_item(
        v_fi_snap,
        v_recipient_id,
        v_invitation.sender_name
      );
    END IF;

    -- Steg 2: Skapa recept med namnkollisionsstrategi (retry-loop, aldrig DO UPDATE)
    v_recipe_name := v_snap->>'name';

    FOR v_attempt IN 0..11 LOOP
      IF v_attempt = 0 THEN
        v_suffix_name := v_recipe_name;
      ELSIF v_attempt = 1 THEN
        v_suffix_name := v_recipe_name || ' – ' || v_invitation.sender_name;
      ELSE
        v_suffix_name := v_recipe_name || ' – ' || v_invitation.sender_name || ' (' || (v_attempt)::text || ')';
      END IF;

      BEGIN
        INSERT INTO public.recipes (
          user_id,
          food_item_id,
          name,
          total_weight_grams,
          servings
        )
        VALUES (
          v_recipient_id,
          v_new_recipe_fi_id,
          v_suffix_name,
          (v_snap->>'total_weight_grams')::numeric,
          COALESCE((v_snap->>'servings')::integer, 1)
        )
        RETURNING id INTO v_recipe_id;

        -- INSERT lyckades — avbryt loop
        EXIT;

      EXCEPTION WHEN unique_violation THEN
        -- Namnkollision: försök nästa suffix
        CONTINUE;
      END;
    END LOOP;

    IF v_recipe_id IS NULL THEN
      RAISE EXCEPTION 'name_conflict_unresolvable: Kunde inte skapa unikt receptnamn för "%"', v_recipe_name;
    END IF;

    -- Steg 3: Importera varje ingrediens och länka till receptet
    FOR v_ingredient IN
      SELECT * FROM jsonb_array_elements(v_snap->'ingredients')
    LOOP
      -- ARKITEKTURBESLUT (låst):
      --   is_global=true + original finns → länka till globalt original (ingen kopia)
      --   is_global=true + original saknas → fallback: user-kopia
      --   is_global=false → data_hash-deduplicering
      v_ingredient_fi_id := public._upsert_shared_food_item(
        v_ingredient->'food_item_snapshot',
        v_recipient_id,
        v_invitation.sender_name
      );

      INSERT INTO public.recipe_ingredients (
        recipe_id,
        food_item_id,
        amount,
        unit,
        weight_grams,
        ingredient_order
      )
      VALUES (
        v_recipe_id,
        v_ingredient_fi_id,
        (v_ingredient->>'amount')::numeric,
        v_ingredient->>'unit',
        (v_ingredient->>'weight_grams')::numeric,
        (v_ingredient->>'ingredient_order')::integer
      );
    END LOOP;

    UPDATE public.share_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = p_invitation_id;

    RETURN jsonb_build_object(
      'success',      true,
      'recipe_id',    v_recipe_id,
      'food_item_id', v_new_recipe_fi_id,
      'item_type',    'recipe'
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'unknown_item_type');

EXCEPTION
  WHEN lock_not_available THEN
    -- Två flikar accepterade simultant — den andra misslyckas tyst
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_accept_detected');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.accept_share_invitation IS
  'Accepterar en delningsinbjudan. FOR UPDATE NOWAIT förhindrar race conditions.
   Globala ingredienser länkas, kopieras ej. Retry-loop för namnkollisioner.
   Hela funktionen körs i en implicit transaktion (rollback vid fel).';

-- =========================================================
-- STEG 11: reject_share_invitation
-- =========================================================

CREATE OR REPLACE FUNCTION public.reject_share_invitation(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id uuid := auth.uid();
  v_invitation   record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.share_invitations
  WHERE id          = p_invitation_id
    AND recipient_id = v_recipient_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invitation_already_processed',
      'status', v_invitation.status
    );
  END IF;

  UPDATE public.share_invitations
  SET status = 'rejected', responded_at = now()
  WHERE id = p_invitation_id;

  RETURN jsonb_build_object('success', true);

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_operation_detected');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =========================================================
-- STEG 12: get_pending_invitations_count
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_pending_invitations_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.share_invitations
  WHERE recipient_id = auth.uid()
    AND status       = 'pending'
    AND expires_at   > now();
$$;

COMMENT ON FUNCTION public.get_pending_invitations_count IS
  'Returnerar antal ej-expirerade pending-inbjudningar för inloggad användare.
   Används som initial laddning och fallback vid Realtime-avbrott. STABLE = säker att anropa frekvent.';

-- =========================================================
-- STEG 13: get_pending_invitations
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
  id           uuid,
  item_type    text,
  sender_name  text,
  created_at   timestamptz,
  expires_at   timestamptz,
  item_name    text,
  item_preview jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    si.id,
    si.item_type,
    si.sender_name,
    si.created_at,
    si.expires_at,
    si.snapshot->>'name' AS item_name,
    CASE si.item_type
      WHEN 'food_item' THEN jsonb_build_object(
        'calories',   si.snapshot->>'calories',
        'fat_g',      si.snapshot->>'fat_g',
        'carb_g',     si.snapshot->>'carb_g',
        'protein_g',  si.snapshot->>'protein_g',
        'brand',      si.snapshot->>'brand'
      )
      WHEN 'recipe' THEN jsonb_build_object(
        'servings',         si.snapshot->>'servings',
        'ingredient_count', jsonb_array_length(COALESCE(si.snapshot->'ingredients', '[]'::jsonb)),
        'calories',         si.snapshot->'food_item_snapshot'->>'calories',
        'protein_g',        si.snapshot->'food_item_snapshot'->>'protein_g'
      )
    END AS item_preview
  FROM public.share_invitations si
  WHERE si.recipient_id = auth.uid()
    AND si.status        = 'pending'
    AND si.expires_at    > now()
  ORDER BY si.created_at DESC;
$$;

-- =========================================================
-- STEG 14: expire_old_invitations (framtida cron-jobb)
-- =========================================================

CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.share_invitations
  SET status = 'expired', responded_at = now()
  WHERE status    = 'pending'
    AND expires_at < now();
$$;

COMMENT ON FUNCTION public.expire_old_invitations IS
  'Sätter status=expired för utgångna pending-inbjudningar.
   Anropas av pg_cron eller Supabase Scheduled Functions.';

-- =========================================================
-- STEG 15: get_recipes_using_food_item (dataintegritet)
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_recipes_using_food_item(
  p_food_item_id uuid
)
RETURNS TABLE (
  recipe_id        uuid,
  recipe_name      text,
  servings         integer,
  ingredient_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id              AS recipe_id,
    r.name            AS recipe_name,
    r.servings,
    COUNT(ri.id)      AS ingredient_count
  FROM public.recipes r
  JOIN public.recipe_ingredients ri ON ri.recipe_id = r.id
  WHERE r.user_id        = auth.uid()
    AND ri.food_item_id  = p_food_item_id
  GROUP BY r.id, r.name, r.servings
  ORDER BY r.name;
$$;

COMMENT ON FUNCTION public.get_recipes_using_food_item IS
  'Returnerar alla recept ägda av inloggad användare som innehåller food_item_id.
   Används för att varna användaren vid radering/ändring av livsmedel.
   STABLE: inga sidoeffekter, säker att anropa frekvent.';
