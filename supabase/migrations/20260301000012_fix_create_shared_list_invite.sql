-- =========================================================
-- MIGRATION: Fixa create_shared_list — skicka inbjudan istället för direkt-add
-- Date: 2026-03-01
-- Anledning: create_shared_list lade till vän direkt som medlem utan inbjudan.
--   Vännen måste nu bekräfta via shared_list_invitations (samma flöde som
--   invite_to_shared_list + accept_shared_list_invitation).
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_shared_list(
  p_name            text,
  p_friend_user_id  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id    uuid := auth.uid();
  v_creator_name  text;
  v_list_id       uuid;
  v_is_friend     boolean := false;
  v_invitation_id uuid;
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

  -- Om en vän anges: verifiera
  IF p_friend_user_id IS NOT NULL THEN
    IF p_friend_user_id = v_creator_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'cannot_invite_yourself');
    END IF;

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

  -- Lägg in skaparen som första och enda direktmedlem
  INSERT INTO public.shared_list_members (shared_list_id, user_id)
  VALUES (v_list_id, v_creator_id);

  -- Om en vän angavs: skicka inbjudan (vännen accepterar via accept_shared_list_invitation)
  IF p_friend_user_id IS NOT NULL THEN
    INSERT INTO public.shared_list_invitations (
      shared_list_id, sender_id, recipient_id, sender_name, list_name
    )
    VALUES (
      v_list_id, v_creator_id, p_friend_user_id, v_creator_name, trim(p_name)
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_invitation_id;
  END IF;

  RETURN jsonb_build_object(
    'success',          true,
    'shared_list_id',   v_list_id,
    'name',             trim(p_name),
    'invitation_sent',  p_friend_user_id IS NOT NULL
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.create_shared_list IS
  'Skapar en gemensam lista och lägger in skaparen som första och enda direktmedlem.
   Om p_friend_user_id anges: vänskapet verifieras och en inbjudan skickas till vännen.
   Vännen måste acceptera via accept_shared_list_invitation för att bli med.
   SECURITY DEFINER för att kunna skriva till shared_lists, shared_list_members och
   shared_list_invitations.';
