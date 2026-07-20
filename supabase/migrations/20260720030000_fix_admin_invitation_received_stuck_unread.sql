-- =========================================================
-- MIGRATION: Fixa "spok-siffra" pa Social-fliken fran admin_invitation_received
-- Date: 2026-07-20
-- Problem: admin_invitation_received filtreras bort ur historyNotifications
--   i SocialHub.tsx (den visas redan som eget atgardskort medan pending).
--   Men nar mottagaren accepterar/avbojer forsvinner atgardskortet, och
--   notisraden i notifications forblir read_at=NULL for evigt - den kan
--   aldrig markeras last eftersom den aldrig renderas nagonstans. Resultat:
--   unreadHistoryCount (och darmed activityCount-badgen pa Social-ikonen)
--   visar en permanent "1" trots att inget syns i UI:t.
-- Fix:
--   1. respond_admin_invitation markerar nu mottagarens egen
--      admin_invitation_received-notis (samma entity_id) som last narhen
--      svarar, sa den slutar rakas i unreadHistoryCount. Best-effort,
--      blockerar aldrig sjalva svaret.
--   2. Engangsstadning: markera befintliga admin_invitation_received-
--      notiser som last dar tillhorande inbjudan redan ar besvarad
--      (status != 'pending').
-- =========================================================

CREATE OR REPLACE FUNCTION public.respond_admin_invitation(p_invitation_id uuid, p_accept boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inv admin_invitations;
  v_responder_name text;
BEGIN
  SELECT * INTO v_inv FROM admin_invitations
  WHERE id = p_invitation_id AND recipient_id = (SELECT auth.uid()) AND status = 'pending';

  IF v_inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  SELECT COALESCE(username, email) INTO v_responder_name
  FROM user_profiles
  WHERE id = (SELECT auth.uid());

  IF p_accept THEN
    UPDATE admin_invitations SET status = 'accepted', responded_at = now() WHERE id = p_invitation_id;
    INSERT INTO admins (user_id, is_super_admin) VALUES (v_inv.recipient_id, false)
      ON CONFLICT (user_id) DO NOTHING;
  ELSE
    UPDATE admin_invitations SET status = 'rejected', responded_at = now() WHERE id = p_invitation_id;
  END IF;

  -- Markera mottagarens egen "mottagen inbjudan"-notis som last, annars
  -- forblir den for evigt oläst (den renderas aldrig i UI efter svar).
  BEGIN
    UPDATE public.notifications
    SET read_at = now()
    WHERE user_id = v_inv.recipient_id
      AND type = 'admin_invitation_received'
      AND entity_id = p_invitation_id
      AND read_at IS NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    PERFORM public.internal_create_notification(
      p_user_id     => v_inv.sender_id,
      p_actor_id    => (SELECT auth.uid()),
      p_type        => CASE WHEN p_accept THEN 'admin_invitation_accepted' ELSE 'admin_invitation_rejected' END,
      p_entity_type => 'admin_invitation',
      p_entity_id   => p_invitation_id,
      p_title       => COALESCE(v_responder_name, 'Nagon')
        || CASE WHEN p_accept THEN ' accepterade admin-inbjudan' ELSE ' avbojde admin-inbjudan' END
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_admin_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation admin_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invitation
  FROM admin_invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_invitation.sender_id <> (SELECT auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_pending', 'status', v_invitation.status);
  END IF;

  UPDATE admin_invitations
  SET status = 'rejected', responded_at = now()
  WHERE id = p_invitation_id;

  -- Samma stadning som respond_admin_invitation: mottagarens
  -- admin_invitation_received-notis far annars aldrig markeras last.
  BEGIN
    UPDATE public.notifications
    SET read_at = now()
    WHERE user_id = v_invitation.recipient_id
      AND type = 'admin_invitation_received'
      AND entity_id = p_invitation_id
      AND read_at IS NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Engangsstadning: fixa redan besvarade/avbrutna inbjudningar vars
-- admin_invitation_received-notis fastnat som oläst.
UPDATE public.notifications n
SET read_at = now()
FROM public.admin_invitations ai
WHERE n.type = 'admin_invitation_received'
  AND n.entity_id = ai.id
  AND ai.status <> 'pending'
  AND n.read_at IS NULL;
