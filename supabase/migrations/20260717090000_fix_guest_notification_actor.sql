-- Gäster (anonyma) saknar user_profiles-rad → notifications.actor_id-FK:n
-- kraschade send_support_message med 409. Skicka NULL som actor för gäster.
CREATE OR REPLACE FUNCTION public.send_support_message(
  p_content text,
  p_thread_id uuid DEFAULT NULL,
  p_image_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := auth.uid();
  v_thread_id uuid;
  v_trimmed   text := coalesce(trim(p_content), '');
  v_status    text;
  v_count     int;
  v_msg_id    uuid;
  v_sender_name text;
  v_actor_id  uuid;
  v_admin     RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_trimmed = '' AND p_image_path IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  IF p_image_path IS NOT NULL THEN
    IF p_image_path NOT LIKE v_user_id::text || '/%' THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_image');
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE bucket_id = 'support-attachments' AND name = p_image_path
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_image');
    END IF;
  END IF;

  IF p_thread_id IS NOT NULL THEN
    SELECT id, status INTO v_thread_id, v_status
    FROM public.support_threads
    WHERE id = p_thread_id AND user_id = v_user_id;

    IF v_thread_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'thread_not_found');
    END IF;
  ELSE
    SELECT id, status INTO v_thread_id, v_status
    FROM public.support_threads
    WHERE user_id = v_user_id AND status = 'open';
  END IF;

  IF v_thread_id IS NULL OR v_status = 'closed' THEN
    v_thread_id := public.create_support_thread();
  END IF;

  IF NOT public.is_support_admin() THEN
    SELECT COUNT(*) INTO v_count
    FROM public.support_messages
    WHERE sender_id = v_user_id
      AND created_at > now() - interval '1 hour'
      AND deleted_at IS NULL;

    IF v_count >= 10 THEN
      RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
    END IF;
  END IF;

  INSERT INTO public.support_messages (support_thread_id, sender_id, content, image_path)
  VALUES (v_thread_id, v_user_id, v_trimmed, p_image_path)
  RETURNING id INTO v_msg_id;

  UPDATE public.support_threads SET updated_at = now() WHERE id = v_thread_id;

  SELECT COALESCE(username, email) INTO v_sender_name
  FROM public.user_profiles WHERE id = v_user_id;

  -- Gäster saknar user_profiles-rad — använd trådens gästnamn och NULL-actor
  -- (notifications.actor_id har FK mot user_profiles och skulle annars krascha)
  IF v_sender_name IS NULL THEN
    v_actor_id := NULL;
    SELECT COALESCE(guest_name, 'Gäst') INTO v_sender_name
    FROM public.support_threads WHERE id = v_thread_id;
  ELSE
    v_actor_id := v_user_id;
  END IF;

  FOR v_admin IN SELECT user_id FROM public.admins LOOP
    IF v_admin.user_id != v_user_id THEN
      PERFORM internal_create_notification(
        v_admin.user_id, v_actor_id, 'support_message_received',
        'support_thread', v_thread_id,
        v_sender_name || ' skickade ett supportmeddelande'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id, 'thread_id', v_thread_id);
END;
$function$;
