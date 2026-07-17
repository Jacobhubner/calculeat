-- Gäståtkomst till supportchatten (Supabase anonymous sign-ins)
-- ─────────────────────────────────────────────────────────────────────────────
-- Besökare utan konto anger namn + e-post → signInAnonymously({data}) →
-- riktig auth-session med is_anonymous=true. Befintlig chattstack (RPC:er,
-- RLS, realtime, bilagor) återanvänds oförändrad. Denna migration:
--
-- 1. handle_new_user hoppar över anonyma användare — gäster får INGEN
--    user_profiles/profiles-rad (email är NOT NULL och gäster saknar e-post;
--    utan guarden kraschar signInAnonymously helt).
-- 2. support_threads får guest_name/guest_email — gästens ifyllda uppgifter,
--    kopieras från raw_user_meta_data av create_support_thread.
-- 3. get_support_messages / get_support_thread_inbox: INNER JOIN mot
--    user_profiles → LEFT JOIN + COALESCE med gästuppgifter (annars försvinner
--    gästens meddelanden ur chatten och gästärenden ur admininkorgen).
-- 4. Restriktiva RLS-policies (is_anonymous-spärr) på ALLA användardatatabeller
--    utom supporttabellerna — en anonym session har rollen 'authenticated' och
--    skulle annars kunna använda hela appen som ett fullvärdigt konto.
--    OBS: nya tabeller framöver behöver samma spärr (policyn 'block_anonymous_users').

-- ── 1. Trigger-guard ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile_id    uuid;
  v_profile_name  text;
  v_username_base text;
  v_username      text;
BEGIN
  -- Anonyma gästsessioner (supportchatt) får ingen app-profil.
  -- Deras identitet (namn/e-post) lagras på support_threads istället.
  IF NEW.is_anonymous THEN
    RETURN NEW;
  END IF;

  v_profile_name  := COALESCE(NEW.raw_user_meta_data->>'profile_name', 'Användare');
  v_username_base := public.normalize_username(v_profile_name);

  IF length(v_username_base) < 2 THEN
    v_username_base := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  IF v_username_base = ANY(ARRAY['admin','support','calculeat','help','api',
                                  'system','null','undefined','root','mod','moderator']) THEN
    v_username_base := v_username_base || '_user';
  END IF;

  v_username := public.find_available_username(v_username_base);

  INSERT INTO public.user_profiles (id, email, profile_name, username)
  VALUES (NEW.id, NEW.email, v_profile_name, v_username);

  INSERT INTO public.profiles (user_id, profile_name, is_active)
  VALUES (NEW.id, v_profile_name, true)
  RETURNING id INTO v_profile_id;

  UPDATE public.user_profiles
  SET active_profile_id = v_profile_id
  WHERE id = NEW.id;

  -- Sätt display_name i auth metadata så adminpanelen visar username
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('display_name', v_username)
  WHERE id = NEW.id;

  RETURN NEW;

EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RAISE;
END;
$$;

-- ── 2. Gästuppgifter på tråden ───────────────────────────────────────────────
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS guest_email text;

-- create_support_thread: kopiera gästens namn/e-post från auth-metadata
-- (satt av klienten vid signInAnonymously). Anropas både direkt och
-- transparent inifrån send_support_message — båda vägarna täcks här.
CREATE OR REPLACE FUNCTION public.create_support_thread()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := auth.uid();
  v_thread_id uuid;
  v_is_anon   boolean;
  v_meta      jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT id INTO v_thread_id
  FROM public.support_threads
  WHERE user_id = v_user_id AND status = 'open';

  IF v_thread_id IS NULL THEN
    BEGIN
      INSERT INTO public.support_threads (user_id)
      VALUES (v_user_id)
      RETURNING id INTO v_thread_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_thread_id
      FROM public.support_threads
      WHERE user_id = v_user_id AND status = 'open';
    END;
  END IF;

  SELECT is_anonymous, raw_user_meta_data INTO v_is_anon, v_meta
  FROM auth.users WHERE id = v_user_id;

  IF COALESCE(v_is_anon, false) THEN
    UPDATE public.support_threads
    SET guest_name  = COALESCE(guest_name,  nullif(trim(v_meta->>'guest_name'), '')),
        guest_email = COALESCE(guest_email, nullif(trim(v_meta->>'guest_email'), ''))
    WHERE id = v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$function$;

-- ── 3a. get_support_messages: LEFT JOIN + gästnamn ──────────────────────────
-- Samma returtyp som tidigare → CREATE OR REPLACE räcker (grants bevaras).
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
    -- Gäster saknar user_profiles-rad: fall tillbaka på trådens gästnamn
    COALESCE(up.username, CASE WHEN st.user_id = sm.sender_id THEN st.guest_name END, 'Gäst')
                                                                               AS sender_username,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.content END          AS content,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.original_content END AS original_content,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.image_path END       AS image_path,
    sm.created_at,
    sm.read_at,
    sm.deleted_at,
    sm.edited_at
  FROM public.support_messages sm
  JOIN public.support_threads st ON st.id = sm.support_thread_id
  LEFT JOIN public.user_profiles up ON up.id = sm.sender_id
  WHERE sm.support_thread_id = p_thread_id
    AND (
      st.user_id = auth.uid()
      OR public.is_support_admin()
    )
    AND (p_before IS NULL OR sm.created_at < p_before)
  ORDER BY sm.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$function$;

-- ── 3b. get_support_thread_inbox: LEFT JOIN + is_guest ──────────────────────
-- Ny kolumn i returtypen → DROP + CREATE + re-GRANT krävs.
DROP FUNCTION IF EXISTS public.get_support_thread_inbox();

CREATE OR REPLACE FUNCTION public.get_support_thread_inbox()
RETURNS TABLE(
  thread_id uuid,
  user_id uuid,
  username text,
  email text,
  is_guest boolean,
  assigned_admin_id uuid,
  assigned_admin_username text,
  status text,
  last_message text,
  last_message_at timestamp with time zone,
  unread_count bigint,
  updated_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH latest_messages AS (
    SELECT DISTINCT ON (support_thread_id)
      support_thread_id,
      CASE WHEN deleted_at IS NOT NULL THEN NULL ELSE content END AS content,
      created_at
    FROM public.support_messages
    ORDER BY support_thread_id, created_at DESC
  ),
  unread_counts AS (
    SELECT
      sm.support_thread_id,
      COUNT(*) AS cnt
    FROM public.support_messages sm
    WHERE sm.sender_id != auth.uid()
      AND sm.read_at IS NULL
      AND sm.deleted_at IS NULL
    GROUP BY sm.support_thread_id
  )
  SELECT
    st.id                                 AS thread_id,
    st.user_id,
    COALESCE(up.username, st.guest_name)  AS username,
    COALESCE(up.email, st.guest_email)    AS email,
    (up.id IS NULL)                       AS is_guest,
    st.assigned_admin_id,
    aup.username                          AS assigned_admin_username,
    st.status,
    lm.content                            AS last_message,
    lm.created_at                         AS last_message_at,
    COALESCE(uc.cnt, 0)                   AS unread_count,
    st.updated_at,
    st.created_at
  FROM public.support_threads st
  LEFT JOIN public.user_profiles up ON up.id = st.user_id
  JOIN latest_messages lm ON lm.support_thread_id = st.id
  LEFT JOIN unread_counts uc ON uc.support_thread_id = st.id
  LEFT JOIN public.user_profiles aup ON aup.id = st.assigned_admin_id
  WHERE public.is_support_admin()
  ORDER BY st.updated_at DESC;
$function$;

REVOKE ALL ON FUNCTION public.get_support_thread_inbox() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_support_thread_inbox() TO authenticated;

-- ── 3c. send_support_message: gästnamn i admin-notisen ───────────────────────
-- Endast v_sender_name-uppslaget ändras (COALESCE med trådens gästnamn).
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

  SELECT COALESCE(username, email) INTO v_sender_name
  FROM public.user_profiles WHERE id = v_user_id;

  -- Gäster saknar user_profiles-rad — använd trådens gästnamn
  IF v_sender_name IS NULL THEN
    SELECT COALESCE(guest_name, 'Gäst') INTO v_sender_name
    FROM public.support_threads WHERE id = v_thread_id;
  END IF;

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

-- ── 4. Spärra anonyma från allt utom supportchatten ─────────────────────────
-- Anonyma sessioner har rollen 'authenticated'; utan detta släpper alla
-- befintliga auth.uid()-policies in dem som fullvärdiga konton.
-- Restriktiva policies AND:as med befintliga permissiva — inga omskrivningar.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND c.relname NOT IN ('support_threads', 'support_messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS block_anonymous_users ON public.%I', r.relname);
    EXECUTE format(
      'CREATE POLICY block_anonymous_users ON public.%I AS RESTRICTIVE TO authenticated
       USING ((SELECT COALESCE((auth.jwt()->>''is_anonymous'')::boolean, false)) IS FALSE)',
      r.relname
    );
  END LOOP;
END $$;
