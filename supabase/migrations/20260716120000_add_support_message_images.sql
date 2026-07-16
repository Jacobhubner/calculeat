-- Bildbilagor i supportchatten
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ny kolumn support_messages.image_path (path i privat bucket, ej URL)
-- 2. Content-constraint uppmjukad: tom text tillåts om bild finns
-- 3. Privat bucket 'support-attachments' + storage-RLS
--    Pathkonvention: {uploader_user_id}/{uuid}.webp — uppladdning sker INNAN
--    meddelandet (och ev. tråden) finns, därför user-mapp och inte trådmapp.
--    Trådägaren får läsrätt till adminens bilder via image_path-referensen
--    i ett icke-raderat meddelande i egen tråd.
-- 4. RPC:er utökade: send_support_message / reply_support_message tar
--    p_image_path, get_support_messages returnerar image_path (NULL vid
--    soft-delete, så bilagan döljs/blir osignerbar för motparten).

-- ── 1. Kolumn ────────────────────────────────────────────────────────────────
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS image_path text;

-- ── 2. Constraint: text 0–2000, men minst text ELLER bild ───────────────────
ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS chk_support_message_content_length;
ALTER TABLE public.support_messages
  ADD CONSTRAINT chk_support_message_content_length
  CHECK (
    char_length(content) <= 2000
    AND (char_length(content) >= 1 OR image_path IS NOT NULL)
  );

-- ── 3. Privat bucket + storage-RLS ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  5242880, -- 5 MB (klienten komprimerar till WebP ≤3 MB innan upload)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "support_attachments_insert" ON storage.objects;
CREATE POLICY "support_attachments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "support_attachments_select" ON storage.objects;
CREATE POLICY "support_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR public.is_support_admin()
      OR EXISTS (
        SELECT 1
        FROM public.support_messages sm
        JOIN public.support_threads st ON st.id = sm.support_thread_id
        WHERE sm.image_path = storage.objects.name
          AND sm.deleted_at IS NULL
          AND st.user_id = (SELECT auth.uid())
      )
    )
  );

-- Egen städning: användaren får ta bort filer i sin egen mapp
-- (t.ex. ångrad bilaga innan meddelandet skickats).
DROP POLICY IF EXISTS "support_attachments_delete" ON storage.objects;
CREATE POLICY "support_attachments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ── 4a. send_support_message: + p_image_path ────────────────────────────────
-- DROP krävs: ny parameter med default skulle annars skapa en överlagring
-- som gör PostgREST-anropet tvetydigt.
DROP FUNCTION IF EXISTS public.send_support_message(text, uuid);

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
  v_admin     RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Tomt meddelande tillåts endast om en bild bifogas
  IF v_trimmed = '' AND p_image_path IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  -- Bilagan måste ligga i avsändarens egen mapp och faktiskt finnas i bucketen
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

  -- No thread, or resolved/target thread is closed → transparently start a
  -- fresh thread and send the message there.
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

  SELECT COALESCE(username, email, 'Användare') INTO v_sender_name
  FROM public.user_profiles WHERE id = v_user_id;

  FOR v_admin IN SELECT user_id FROM public.admins LOOP
    IF v_admin.user_id != v_user_id THEN
      PERFORM internal_create_notification(
        v_admin.user_id, v_user_id, 'support_message_received',
        'support_thread', v_thread_id,
        v_sender_name || ' skickade ett supportmeddelande'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id, 'thread_id', v_thread_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.send_support_message(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_support_message(text, uuid, text) TO authenticated;

-- ── 4b. reply_support_message: + p_image_path ────────────────────────────────
DROP FUNCTION IF EXISTS public.reply_support_message(uuid, text);

CREATE OR REPLACE FUNCTION public.reply_support_message(
  p_thread_id uuid,
  p_content text,
  p_image_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id    uuid := (SELECT auth.uid());
  v_thread_owner uuid;
  v_sender_name  text;
  v_trimmed      text := coalesce(trim(p_content), '');
  v_msg_id       uuid;
BEGIN
  -- Admin-check
  IF NOT is_support_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF v_trimmed = '' AND p_image_path IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  IF p_image_path IS NOT NULL THEN
    IF p_image_path NOT LIKE v_caller_id::text || '/%' THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_image');
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE bucket_id = 'support-attachments' AND name = p_image_path
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_image');
    END IF;
  END IF;

  -- Hämta trådens ägare och kontrollera status
  SELECT user_id INTO v_thread_owner
  FROM public.support_threads
  WHERE id = p_thread_id AND status = 'open';

  IF v_thread_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_closed');
  END IF;

  -- Infoga meddelande
  INSERT INTO public.support_messages (support_thread_id, sender_id, content, image_path)
  VALUES (p_thread_id, v_caller_id, v_trimmed, p_image_path)
  RETURNING id INTO v_msg_id;

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

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.reply_support_message(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reply_support_message(uuid, text, text) TO authenticated;

-- ── 4c. get_support_messages: returnera image_path ──────────────────────────
-- DROP krävs: RETURNS TABLE-ändring går inte via CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.get_support_messages(uuid, integer, timestamptz);

CREATE OR REPLACE FUNCTION public.get_support_messages(
  p_thread_id uuid,
  p_limit integer DEFAULT 50,
  p_before timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  sender_id uuid,
  sender_username text,
  content text,
  original_content text,
  image_path text,
  created_at timestamp with time zone,
  read_at timestamp with time zone,
  deleted_at timestamp with time zone,
  edited_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    sm.id,
    sm.sender_id,
    up.username                                                                AS sender_username,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.content END          AS content,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.original_content END AS original_content,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.image_path END       AS image_path,
    sm.created_at,
    sm.read_at,
    sm.deleted_at,
    sm.edited_at
  FROM public.support_messages sm
  JOIN public.user_profiles up ON up.id = sm.sender_id
  WHERE sm.support_thread_id = p_thread_id
    AND EXISTS (
      SELECT 1 FROM public.support_threads st
      WHERE st.id = p_thread_id
        AND (
          st.user_id = auth.uid()
          OR public.is_support_admin()
        )
    )
    AND (p_before IS NULL OR sm.created_at < p_before)
  ORDER BY sm.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$function$;

REVOKE ALL ON FUNCTION public.get_support_messages(uuid, integer, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_support_messages(uuid, integer, timestamptz) TO authenticated;
