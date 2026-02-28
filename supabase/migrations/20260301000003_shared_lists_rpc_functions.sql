-- =========================================================
-- MIGRATION: Add Shared Lists Feature — Steg 4/5
-- Date: 2026-03-01
-- Description: SECURITY DEFINER RPC-funktioner för gemensamma listor.
--   Alla direkta INSERT/UPDATE/DELETE på shared_lists, shared_list_members
--   och shared_list_invitations är blockerade via RLS (WITH CHECK false).
--   Dessa RPC-funktioner är de enda vägar till skrivoperationer.
--
-- Funktioner:
--   create_shared_list          — Skapa lista + lägg in skaparen som medlem
--   invite_to_shared_list       — Bjud in en vän till en lista
--   accept_shared_list_invitation — Acceptera inbjudan → bli medlem
--   reject_shared_list_invitation — Avvisa inbjudan
--   leave_shared_list           — Lämna lista (radera lista om sista)
--   copy_food_item_to_shared_list — Kopiera personligt item till lista
--   rename_shared_list          — Byt namn på lista
--   get_my_shared_lists         — Hämta listor med metadata
--   get_pending_shared_list_invitations       — Inkorgen
--   get_pending_shared_list_invitations_count — Badge-räknare
-- =========================================================

-- =========================================================
-- 1. create_shared_list
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_shared_list(
  p_name            text,
  p_friend_user_id  uuid DEFAULT NULL  -- valfri: lägg till en vän direkt
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id      uuid := auth.uid();
  v_creator_name    text;
  v_list_id         uuid;
  v_is_friend       boolean := false;
BEGIN
  -- Hämta skaparens visningsnamn
  SELECT COALESCE(username, profile_name, email)
  INTO v_creator_name
  FROM public.user_profiles
  WHERE id = v_creator_id;

  IF v_creator_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'creator_not_found');
  END IF;

  -- Validera listnamnet
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'name_required');
  END IF;

  -- Om en vän anges: verifiera vänskapet innan listan skapas
  IF p_friend_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
        AND (
          (requester_id = v_creator_id AND addressee_id = p_friend_user_id)
          OR (requester_id = p_friend_user_id AND addressee_id = v_creator_id)
        )
    ) INTO v_is_friend;

    IF NOT v_is_friend THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_friends');
    END IF;
  END IF;

  -- Skapa listan
  INSERT INTO public.shared_lists (name, created_by)
  VALUES (trim(p_name), v_creator_id)
  RETURNING id INTO v_list_id;

  -- Lägg in skaparen som första medlem
  INSERT INTO public.shared_list_members (shared_list_id, user_id)
  VALUES (v_list_id, v_creator_id);

  -- Om en vän angavs: lägg in dem direkt (utan inbjudan)
  IF p_friend_user_id IS NOT NULL THEN
    INSERT INTO public.shared_list_members (shared_list_id, user_id)
    VALUES (v_list_id, p_friend_user_id)
    ON CONFLICT (shared_list_id, user_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'shared_list_id', v_list_id,
    'name', trim(p_name)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.create_shared_list IS
  'Skapar en gemensam lista och lägger in skaparen som första medlem.
   Om p_friend_user_id anges: vänskapet verifieras och vännen läggs in direkt.
   SECURITY DEFINER för att kunna skriva till shared_lists och shared_list_members.';

-- =========================================================
-- 2. invite_to_shared_list
-- =========================================================

CREATE OR REPLACE FUNCTION public.invite_to_shared_list(
  p_shared_list_id  uuid,
  p_friend_user_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id       uuid := auth.uid();
  v_sender_name     text;
  v_list_name       text;
  v_is_member       boolean;
  v_is_friend       boolean;
  v_already_member  boolean;
  v_invitation_id   uuid;
BEGIN
  -- Hämta sändarens visningsnamn
  SELECT COALESCE(username, profile_name, email)
  INTO v_sender_name
  FROM public.user_profiles
  WHERE id = v_sender_id;

  IF v_sender_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'sender_not_found');
  END IF;

  -- Förhindra self-invite
  IF p_friend_user_id = v_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_invite_yourself');
  END IF;

  -- Verifiera att sändaren är med i listan
  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_sender_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  -- Hämta listnamnet (snapshot)
  SELECT name INTO v_list_name
  FROM public.shared_lists
  WHERE id = p_shared_list_id;

  IF v_list_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'list_not_found');
  END IF;

  -- Verifiera vänskapet
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND (
        (requester_id = v_sender_id AND addressee_id = p_friend_user_id)
        OR (requester_id = p_friend_user_id AND addressee_id = v_sender_id)
      )
  ) INTO v_is_friend;

  IF NOT v_is_friend THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_friends');
  END IF;

  -- Kontrollera om mottagaren redan är med i listan
  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = p_friend_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_a_member');
  END IF;

  -- Skapa inbjudan (partial unique index förhindrar dubbletter)
  INSERT INTO public.shared_list_invitations (
    shared_list_id, sender_id, recipient_id, sender_name, list_name
  )
  VALUES (
    p_shared_list_id, v_sender_id, p_friend_user_id, v_sender_name, v_list_name
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_invitation_id;

  -- Om konflikt: hämta befintlig pending-inbjudan
  IF v_invitation_id IS NULL THEN
    SELECT id INTO v_invitation_id
    FROM public.shared_list_invitations
    WHERE shared_list_id = p_shared_list_id
      AND recipient_id   = p_friend_user_id
      AND status         = 'pending'
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.invite_to_shared_list IS
  'Bjuder in en vän till en gemensam lista. Verifierar:
   1. Sändaren är med i listan
   2. Mottagaren och sändaren är vänner
   3. Mottagaren är inte redan med
   Partial unique index förhindrar dubbletter.';

-- =========================================================
-- 3. accept_shared_list_invitation
-- =========================================================

CREATE OR REPLACE FUNCTION public.accept_shared_list_invitation(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id  uuid := auth.uid();
  v_invitation    record;
BEGIN
  -- Hämta inbjudan med rad-lås (förhindrar race conditions)
  -- FOR UPDATE NOWAIT: misslyckas omedelbart om raden är låst
  SELECT * INTO v_invitation
  FROM public.shared_list_invitations
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

  -- Verifiera att listan fortfarande finns
  IF NOT EXISTS (
    SELECT 1 FROM public.shared_lists WHERE id = v_invitation.shared_list_id
  ) THEN
    -- Listan har raderats (sista medlemmen lämnade medan inbjudan var pending)
    UPDATE public.shared_list_invitations
    SET status = 'rejected', responded_at = now()
    WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'list_no_longer_exists');
  END IF;

  -- Lägg in mottagaren som listmedlem
  INSERT INTO public.shared_list_members (shared_list_id, user_id)
  VALUES (v_invitation.shared_list_id, v_recipient_id)
  ON CONFLICT (shared_list_id, user_id) DO NOTHING;

  -- Uppdatera inbjudansstatus
  UPDATE public.shared_list_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = p_invitation_id;

  RETURN jsonb_build_object(
    'success', true,
    'shared_list_id', v_invitation.shared_list_id,
    'list_name', v_invitation.list_name
  );

EXCEPTION
  WHEN lock_not_available THEN
    -- Två flikar accepterade simultant — den andra misslyckas tyst
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_accept_detected');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.accept_shared_list_invitation IS
  'Accepterar en listinbjudan och lägger in mottagaren som listmedlem.
   FOR UPDATE NOWAIT förhindrar race conditions (två flikar accepterar simultant).
   Hela funktionen körs atomärt.';

-- =========================================================
-- 4. reject_shared_list_invitation
-- =========================================================

CREATE OR REPLACE FUNCTION public.reject_shared_list_invitation(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id  uuid := auth.uid();
  v_invitation    record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.shared_list_invitations
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

  UPDATE public.shared_list_invitations
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
-- 5. leave_shared_list
-- =========================================================

CREATE OR REPLACE FUNCTION public.leave_shared_list(
  p_shared_list_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         uuid := auth.uid();
  v_is_member       boolean;
  v_member_count    bigint;
  v_food_item_count bigint;
  v_recipe_count    bigint;
BEGIN
  -- Verifiera att användaren är med i listan
  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  -- Kolla hur många medlemmar som finns
  SELECT COUNT(*) INTO v_member_count
  FROM public.shared_list_members
  WHERE shared_list_id = p_shared_list_id;

  -- Om sista medlemmen: returnera varning istället för att agera
  -- UI måste visa destructive confirm med itemräkning och anropa igen med p_confirm = true
  IF v_member_count = 1 THEN
    -- Räkna items för att visa i bekräftelse-dialogen
    SELECT COUNT(*) INTO v_food_item_count
    FROM public.food_items
    WHERE shared_list_id = p_shared_list_id;

    SELECT COUNT(*) INTO v_recipe_count
    FROM public.recipes
    WHERE shared_list_id = p_shared_list_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'last_member',
      'food_item_count', v_food_item_count,
      'recipe_count', v_recipe_count
    );
  END IF;

  -- Ta bort användaren ur listan
  DELETE FROM public.shared_list_members
  WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'shared_list_id', p_shared_list_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.leave_shared_list IS
  'Tar bort en användare ur en gemensam lista.
   Om användaren är den SISTA medlemmen: returnerar error=last_member med itemräkning.
   UI måste visa destructive confirm och anropa leave_shared_list_confirmed separat.
   Listan raderas inte här — det hanteras av leave_shared_list_confirmed.';

-- =========================================================
-- 6. leave_shared_list_confirmed
--    Anropas EFTER att UI:t visat destructive confirm för sista membern.
-- =========================================================

CREATE OR REPLACE FUNCTION public.leave_shared_list_confirmed(
  p_shared_list_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_is_member    boolean;
  v_member_count bigint;
BEGIN
  -- Verifiera att användaren fortfarande är med
  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  -- Kolla att de verkligen är sista (race condition-skydd)
  SELECT COUNT(*) INTO v_member_count
  FROM public.shared_list_members
  WHERE shared_list_id = p_shared_list_id;

  IF v_member_count > 1 THEN
    -- Någon annan har gått med sedan UI:t visade varningen
    -- Lämna utan att radera (felback till vanlig leave)
    DELETE FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'shared_list_id', p_shared_list_id,
      'list_deleted', false
    );
  END IF;

  -- Ta bort membership
  DELETE FROM public.shared_list_members
  WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id;

  -- Radera listan — CASCADE raderar food_items och recipes
  DELETE FROM public.shared_lists
  WHERE id = p_shared_list_id;

  RETURN jsonb_build_object(
    'success', true,
    'shared_list_id', p_shared_list_id,
    'list_deleted', true
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.leave_shared_list_confirmed IS
  'Anropas efter att UI:t visat och användaren bekräftat destructive confirm.
   Raderar sista membership + listan. CASCADE på shared_lists raderar alla
   tillhörande food_items och recipes automatiskt.
   Race condition-skydd: om en ny användare gick med under bekräftelsen,
   lämnar användaren utan att radera listan.';

-- =========================================================
-- 7. copy_food_item_to_shared_list
-- =========================================================

CREATE OR REPLACE FUNCTION public.copy_food_item_to_shared_list(
  p_food_item_id    uuid,
  p_shared_list_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         uuid := auth.uid();
  v_source_item     record;
  v_is_member       boolean;
  v_new_id          uuid;
  v_target_name     text;
  v_suffix_name     text;
  v_attempt         int;
BEGIN
  -- Hämta källobjektet (måste tillhöra auth.uid())
  SELECT * INTO v_source_item
  FROM public.food_items
  WHERE id = p_food_item_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_not_found_or_not_owner');
  END IF;

  -- Verifiera listmedlemskap
  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_list_member');
  END IF;

  -- Försök INSERT med namnkollisionsstrategi (retry-loop)
  -- Samma mönster som _upsert_shared_food_item i den befintliga delningsfunktionen.
  -- Befintliga rader skrivs ALDRIG över.
  v_target_name := v_source_item.name;

  FOR v_attempt IN 0..11 LOOP
    IF v_attempt = 0 THEN
      v_suffix_name := v_target_name;
    ELSIF v_attempt = 1 THEN
      -- Hämta skaparens namn för suffix
      DECLARE
        v_creator_name text;
      BEGIN
        SELECT COALESCE(username, profile_name, email)
        INTO v_creator_name
        FROM public.user_profiles
        WHERE id = v_user_id;
        v_suffix_name := v_target_name || ' – ' || COALESCE(v_creator_name, 'Okänd');
      END;
    ELSE
      DECLARE
        v_creator_name2 text;
      BEGIN
        SELECT COALESCE(username, profile_name, email)
        INTO v_creator_name2
        FROM public.user_profiles
        WHERE id = v_user_id;
        v_suffix_name := v_target_name || ' – ' || COALESCE(v_creator_name2, 'Okänd') || ' (' || (v_attempt)::text || ')';
      END;
    END IF;

    BEGIN
      -- user_id = NULL: listägt item
      -- shared_list_id = p_shared_list_id: tillhör listan
      INSERT INTO public.food_items (
        user_id,
        shared_list_id,
        is_recipe,
        name,
        default_amount,
        default_unit,
        calories,
        fat_g,
        carb_g,
        protein_g,
        food_type,
        grams_per_unit,
        ml_per_gram,
        grams_per_piece,
        reference_unit,
        reference_amount,
        brand,
        barcode,
        density_g_per_ml,
        serving_unit,
        weight_grams,
        source,
        is_hidden
      )
      VALUES (
        NULL,                            -- listägt (inte user-ägt)
        p_shared_list_id,
        v_source_item.is_recipe,
        v_suffix_name,
        v_source_item.default_amount,
        v_source_item.default_unit,
        v_source_item.calories,
        v_source_item.fat_g,
        v_source_item.carb_g,
        v_source_item.protein_g,
        v_source_item.food_type,
        v_source_item.grams_per_unit,
        v_source_item.ml_per_gram,
        v_source_item.grams_per_piece,
        v_source_item.reference_unit,
        v_source_item.reference_amount,
        v_source_item.brand,
        v_source_item.barcode,
        v_source_item.density_g_per_ml,
        v_source_item.serving_unit,
        v_source_item.weight_grams,
        'manual',                        -- nyskapat i listan = manual
        false
      )
      RETURNING id INTO v_new_id;

      -- INSERT lyckades
      RETURN jsonb_build_object(
        'success', true,
        'new_food_item_id', v_new_id
      );

    EXCEPTION WHEN unique_violation THEN
      -- Namnkollision: försök nästa suffix
      CONTINUE;
    END;
  END LOOP;

  RAISE EXCEPTION 'name_conflict_unresolvable: Kunde inte skapa unikt namn för "%"', v_target_name;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.copy_food_item_to_shared_list IS
  'Kopierar ett personligt livsmedel till en gemensam lista (icke-destruktivt).
   Originalet kvarstår i ägarens personliga lista.
   Ny rad i listan: user_id=NULL, shared_list_id=p_shared_list_id.
   Namnkollisionsstrategi: retry-loop med suffix, max 12 försök.';

-- =========================================================
-- 8. rename_shared_list
-- =========================================================

CREATE OR REPLACE FUNCTION public.rename_shared_list(
  p_shared_list_id  uuid,
  p_new_name        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_is_member boolean;
BEGIN
  IF p_new_name IS NULL OR trim(p_new_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'name_required');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.shared_list_members
    WHERE shared_list_id = p_shared_list_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  UPDATE public.shared_lists
  SET name = trim(p_new_name)
  WHERE id = p_shared_list_id;

  RETURN jsonb_build_object('success', true, 'name', trim(p_new_name));

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =========================================================
-- 9. get_my_shared_lists
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_my_shared_lists()
RETURNS TABLE (
  id               uuid,
  name             text,
  created_at       timestamptz,
  member_count     bigint,
  member_names     text[],
  food_item_count  bigint,
  recipe_count     bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sl.id,
    sl.name,
    sl.created_at,
    COUNT(DISTINCT slm.user_id)                         AS member_count,
    ARRAY_AGG(
      DISTINCT COALESCE(up.username, up.profile_name, up.email)
      ORDER BY COALESCE(up.username, up.profile_name, up.email)
    )                                                   AS member_names,
    COUNT(DISTINCT fi.id)                               AS food_item_count,
    COUNT(DISTINCT r.id)                                AS recipe_count
  FROM public.shared_lists sl
  JOIN public.shared_list_members slm ON slm.shared_list_id = sl.id
  LEFT JOIN public.user_profiles up ON up.id = slm.user_id
  LEFT JOIN public.food_items fi
    ON fi.shared_list_id = sl.id AND fi.is_hidden IS NOT TRUE
  LEFT JOIN public.recipes r ON r.shared_list_id = sl.id
  WHERE EXISTS (
    SELECT 1 FROM public.shared_list_members my_slm
    WHERE my_slm.shared_list_id = sl.id
      AND my_slm.user_id = auth.uid()
  )
  GROUP BY sl.id, sl.name, sl.created_at
  ORDER BY sl.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_my_shared_lists IS
  'Returnerar alla gemensamma listor som auth.uid() är med i,
   med antal medlemmar, deras namn, antal livsmedel och recept.
   Används av useSharedLists hook för tabb-generering i FoodItemsPage och RecipesPage.
   STABLE = inga sidoeffekter, säker att anropa frekvent.';

-- =========================================================
-- 10. get_pending_shared_list_invitations
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_pending_shared_list_invitations()
RETURNS TABLE (
  id               uuid,
  shared_list_id   uuid,
  list_name        text,
  sender_name      text,
  created_at       timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sli.id,
    sli.shared_list_id,
    sli.list_name,
    sli.sender_name,
    sli.created_at
  FROM public.shared_list_invitations sli
  WHERE sli.recipient_id = auth.uid()
    AND sli.status       = 'pending'
  ORDER BY sli.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_pending_shared_list_invitations IS
  'Returnerar pending listinbjudningar för auth.uid().
   Används i SocialHub för att visa inkorgen.
   STABLE: inga sidoeffekter.';

-- =========================================================
-- 11. get_pending_shared_list_invitations_count
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_pending_shared_list_invitations_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.shared_list_invitations
  WHERE recipient_id = auth.uid()
    AND status       = 'pending';
$$;

COMMENT ON FUNCTION public.get_pending_shared_list_invitations_count IS
  'Returnerar antal pending listinbjudningar för auth.uid().
   Används av badge-räknaren (usePendingSharedListInvitationsCount).
   STABLE = säker att anropa frekvent.';

-- =========================================================
-- REVOKE/GRANT — Säkerhetsperimeter
-- Alla mutation-funktioner: REVOKE från PUBLIC, GRANT till authenticated.
-- Query-funktioner (STABLE): implicit åtkomst för authenticated via RLS.
-- =========================================================

-- Mutation-funktioner: explicit åtkomstkontroll
REVOKE EXECUTE ON FUNCTION public.create_shared_list FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_shared_list TO authenticated;

REVOKE EXECUTE ON FUNCTION public.invite_to_shared_list FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.invite_to_shared_list TO authenticated;

REVOKE EXECUTE ON FUNCTION public.accept_shared_list_invitation FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.accept_shared_list_invitation TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_shared_list_invitation FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reject_shared_list_invitation TO authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_shared_list FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leave_shared_list TO authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_shared_list_confirmed FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leave_shared_list_confirmed TO authenticated;

REVOKE EXECUTE ON FUNCTION public.copy_food_item_to_shared_list FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.copy_food_item_to_shared_list TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rename_shared_list FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rename_shared_list TO authenticated;

-- Query-funktioner: REVOKE anon, behåll authenticated
REVOKE EXECUTE ON FUNCTION public.get_my_shared_lists FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_shared_lists TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_pending_shared_list_invitations FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_pending_shared_list_invitations TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_pending_shared_list_invitations_count FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_pending_shared_list_invitations_count TO authenticated;
