-- =========================================================
-- MIGRATION: Notifiera vid admin-inbjudan (skickad/accepterad/avböjd)
-- Date: 2026-07-20
-- Problem: admin_invitations-flödet (add_admin / respond_admin_invitation)
--   byggdes fristående fran notifications-infrastrukturen som redan finns
--   for share_invitations och shared_list_invitations. Ingen post skapades
--   nagonsin i notifications, sa handelsen syntes aldrig i "Handelsehistorik"
--   i Aktivitet-fliken.
-- Fix:
--   1. Utoka notifications_type_check med tre nya typer.
--   2. add_admin skickar 'admin_invitation_received' till mottagaren.
--   3. respond_admin_invitation skickar 'admin_invitation_accepted'/'_rejected'
--      till avsandaren. Bada notisblocken ar best-effort (eget BEGIN/EXCEPTION)
--      sa att en notisbugg aldrig kan blockera sjalva inbjudnings-/svarsflodet
--      (samma monster som accept_shared_list_invitation, 20260717120000).
--
-- OBS: admin_invitations, admins, add_admin, remove_admin,
--   respond_admin_invitation och internal_create_notification existerar
--   sedan tidigare i produktions-DB men saknar CREATE TABLE/FUNCTION-migration
--   i repot (applicerade via MCP/dashboard). Denna migration ateranvander
--   deras nuvarande live-definition som bas for CREATE OR REPLACE.
-- =========================================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'friend_request_received',
    'friend_request_accepted',
    'shared_list_invitation_received',
    'shared_list_member_left',
    'shared_list_member_joined',
    'share_invitation_received',
    'share_invitation_accepted',
    'share_invitation_rejected',
    'new_message',
    'support_message_received',
    'admin_invitation_received',
    'admin_invitation_accepted',
    'admin_invitation_rejected'
  ));

CREATE OR REPLACE FUNCTION public.add_admin(p_identifier text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_target_user_id uuid;
  v_sender_name text;
  v_invitation_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = (SELECT auth.uid()) AND a.is_super_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Try email first, then username (case-insensitive)
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = lower(p_identifier);
  IF v_target_user_id IS NULL THEN
    SELECT id INTO v_target_user_id FROM user_profiles WHERE lower(username) = lower(p_identifier);
  END IF;

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM admins WHERE user_id = v_target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_admin');
  END IF;

  IF EXISTS (SELECT 1 FROM admin_invitations WHERE recipient_id = v_target_user_id AND status = 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_pending');
  END IF;

  SELECT COALESCE(username, email) INTO v_sender_name
  FROM user_profiles
  WHERE id = (SELECT auth.uid());

  IF v_sender_name IS NULL THEN
    SELECT email INTO v_sender_name FROM auth.users WHERE id = (SELECT auth.uid());
  END IF;

  INSERT INTO admin_invitations (sender_id, recipient_id, sender_name)
  VALUES ((SELECT auth.uid()), v_target_user_id, v_sender_name)
  RETURNING id INTO v_invitation_id;

  -- Notifiera mottagaren. Best-effort: far aldrig blockera sjalva inbjudan.
  BEGIN
    PERFORM public.internal_create_notification(
      p_user_id     => v_target_user_id,
      p_actor_id    => (SELECT auth.uid()),
      p_type        => 'admin_invitation_received',
      p_entity_type => 'admin_invitation',
      p_entity_id   => v_invitation_id,
      p_title       => COALESCE(v_sender_name, 'Nagon') || ' har bjudit in dig som admin'
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true);
END;
$function$;

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

  -- Notifiera avsandaren om svaret. Best-effort: far aldrig blockera svaret.
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

COMMENT ON FUNCTION public.add_admin IS
  'Skickar en admin-inbjudan till angiven anvandare (e-post eller anvandarnamn).
   Endast super-admins far anropa. Skickar en admin_invitation_received-notis
   till mottagaren (best-effort).';

COMMENT ON FUNCTION public.respond_admin_invitation IS
  'Accepterar eller avbojer en admin-inbjudan. Vid accept lags mottagaren till
   i admins-tabellen. Skickar admin_invitation_accepted/_rejected-notis till
   avsandaren (best-effort).';
