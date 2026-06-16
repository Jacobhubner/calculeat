-- Lägg till support_message_received som giltig notification-typ
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
    'support_message_received'
  ));

-- Uppdatera send_support_message: skicka notis till alla admins när användare skriver
CREATE OR REPLACE FUNCTION public.send_support_message(
  p_content    text,
  p_thread_id  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := (SELECT auth.uid());
  v_thread_id  uuid;
  v_sender_name text;
  v_admin      RECORD;
BEGIN
  -- Hämta tråd
  IF p_thread_id IS NOT NULL THEN
    SELECT id INTO v_thread_id
    FROM public.support_threads
    WHERE id = p_thread_id AND user_id = v_user_id;
  ELSE
    SELECT id INTO v_thread_id
    FROM public.support_threads
    WHERE user_id = v_user_id;
  END IF;

  IF v_thread_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_not_found');
  END IF;

  -- Kontrollera att tråden är öppen
  IF EXISTS (
    SELECT 1 FROM public.support_threads
    WHERE id = v_thread_id AND status = 'closed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_closed');
  END IF;

  -- Rate limit: max 10 meddelanden per timme
  IF (
    SELECT COUNT(*) FROM public.support_messages
    WHERE sender_id = v_user_id
      AND created_at > now() - interval '1 hour'
      AND deleted_at IS NULL
  ) >= 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
  END IF;

  -- Infoga meddelande
  INSERT INTO public.support_messages (support_thread_id, sender_id, content)
  VALUES (v_thread_id, v_user_id, p_content);

  -- Uppdatera trådens updated_at
  UPDATE public.support_threads SET updated_at = now() WHERE id = v_thread_id;

  -- Hämta avsändarens namn
  SELECT COALESCE(username, email, 'Användare') INTO v_sender_name
  FROM public.user_profiles
  WHERE id = v_user_id;

  -- Skicka notis till alla admins
  FOR v_admin IN SELECT user_id FROM public.admins LOOP
    IF v_admin.user_id != v_user_id THEN
      PERFORM internal_create_notification(
        v_admin.user_id,
        v_user_id,
        'support_message_received',
        'support_thread',
        v_thread_id,
        v_sender_name || ' skickade ett supportmeddelande'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message_id', gen_random_uuid());
END;
$$;

-- Uppdatera reply_support_message: skicka notis till trådens ägare när admin svarar
CREATE OR REPLACE FUNCTION public.reply_support_message(
  p_thread_id  uuid,
  p_content    text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   uuid := (SELECT auth.uid());
  v_thread_owner uuid;
  v_sender_name  text;
BEGIN
  -- Admin-check
  IF NOT is_support_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- Hämta trådens ägare och kontrollera status
  SELECT user_id INTO v_thread_owner
  FROM public.support_threads
  WHERE id = p_thread_id AND status = 'open';

  IF v_thread_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_closed');
  END IF;

  -- Infoga meddelande
  INSERT INTO public.support_messages (support_thread_id, sender_id, content)
  VALUES (p_thread_id, v_caller_id, p_content);

  -- Uppdatera trådens updated_at
  UPDATE public.support_threads SET updated_at = now() WHERE id = p_thread_id;

  -- Hämta adminens namn
  SELECT COALESCE(username, email, 'Support') INTO v_sender_name
  FROM public.user_profiles
  WHERE id = v_caller_id;

  -- Skicka notis till trådens ägare
  PERFORM internal_create_notification(
    v_thread_owner,
    v_caller_id,
    'support_message_received',
    'support_thread',
    p_thread_id,
    'Du har fått ett svar från supporten'
  );

  RETURN jsonb_build_object('success', true, 'message_id', gen_random_uuid());
END;
$$;
