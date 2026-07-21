-- =========================================================
-- MIGRATION: Admin-direktmeddelande till en enskild användare
-- Date: 2026-07-21
-- Syfte: en admin kan nå EN specifik användare (ej massutskick, ej
-- supportchatt). Envägs — landar som notis i mottagarens Aktivitet-flik
-- (Händelsehistorik). Alla admins får skicka. Rate limit 20/dygn/admin.
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
    'admin_invitation_rejected',
    'admin_message'
  ));

-- RPC: skicka ett direktmeddelande till en användare (namn eller e-post).
-- Endast admins. Skapar en admin_message-notis hos mottagaren.
CREATE OR REPLACE FUNCTION public.send_admin_message(
  p_identifier text,
  p_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_target uuid;
  v_text text := trim(p_text);
BEGIN
  IF v_admin IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = v_admin
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF char_length(v_text) < 1 OR char_length(v_text) > 1000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_text');
  END IF;

  -- Rate limit: max 20 admin-meddelanden per dygn per admin
  IF (
    SELECT count(*) FROM public.notifications
    WHERE actor_id = v_admin AND type = 'admin_message'
      AND created_at > now() - interval '24 hours'
  ) >= 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limit');
  END IF;

  -- Hitta mottagaren: e-post först, sedan användarnamn (som add_admin)
  SELECT id INTO v_target FROM auth.users WHERE email = lower(trim(p_identifier));
  IF v_target IS NULL THEN
    SELECT id INTO v_target FROM public.user_profiles
    WHERE lower(username) = lower(trim(p_identifier));
  END IF;

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  PERFORM public.internal_create_notification(
    p_user_id     => v_target,
    p_actor_id    => v_admin,
    p_type        => 'admin_message',
    p_entity_type => 'admin_message',
    p_entity_id   => NULL,
    p_title       => v_text
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION public.send_admin_message IS
  'Skickar ett envägs admin-direktmeddelande till en användare (namn eller
   e-post) som en admin_message-notis i mottagarens Aktivitet-flik.
   Endast admins; rate limit 20/dygn/admin.';

REVOKE EXECUTE ON FUNCTION public.send_admin_message FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.send_admin_message TO authenticated;
