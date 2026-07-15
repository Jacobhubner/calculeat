-- Support chat: fix two bugs.
-- 1. user_reopen_support_thread let a user reopen ANY closed thread they
--    own, including ones closed by an admin. Now requires closed_by = auth.uid().
-- 2. Users could never start a new thread once their one-and-only thread was
--    closed (support_threads_user_id_unique forced exactly one row ever per
--    user). Replaced with a partial unique index enforcing "at most one OPEN
--    thread per user", and send_support_message now transparently creates a
--    fresh thread when the resolved/target thread is closed.

-- STEG 1: track who closed the thread
ALTER TABLE public.support_threads
  ADD COLUMN closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.support_threads.closed_by IS
  'auth.uid() of whoever closed the thread. NULL when open or never closed. user_reopen_support_thread only allows reopening when closed_by = the requesting user.';

-- STEG 2: replace UNIQUE(user_id) with partial unique index (one OPEN thread per user)
ALTER TABLE public.support_threads
  DROP CONSTRAINT support_threads_user_id_unique;

CREATE UNIQUE INDEX support_threads_one_open_per_user
  ON public.support_threads (user_id)
  WHERE status = 'open';

-- STEG 3: get_support_thread_id — only ever resolve an OPEN thread, so a
-- user whose only history is closed sees a fresh/empty panel rather than
-- the old thread's history.
CREATE OR REPLACE FUNCTION public.get_support_thread_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.support_threads
  WHERE user_id = auth.uid()
    AND status = 'open'
  LIMIT 1;
$$;

-- STEG 4: create_support_thread — no more ON CONFLICT (constraint gone).
-- Idempotent against an existing open thread; falls back on a unique_violation
-- race (two concurrent calls both seeing "no open thread").
CREATE OR REPLACE FUNCTION public.create_support_thread()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_thread_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT id INTO v_thread_id
  FROM public.support_threads
  WHERE user_id = v_user_id AND status = 'open';

  IF v_thread_id IS NOT NULL THEN
    RETURN v_thread_id;
  END IF;

  BEGIN
    INSERT INTO public.support_threads (user_id)
    VALUES (v_user_id)
    RETURNING id INTO v_thread_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_thread_id
    FROM public.support_threads
    WHERE user_id = v_user_id AND status = 'open';
  END;

  RETURN v_thread_id;
END;
$$;

-- STEG 5: send_support_message — transparently start a new thread when the
-- resolved/target thread is closed (both the NULL/auto-resolve path and an
-- explicit-but-closed p_thread_id), instead of returning thread_closed.
-- Returns the (possibly new) thread_id so the client can follow it.
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
  v_user_id   uuid := auth.uid();
  v_thread_id uuid;
  v_trimmed   text := trim(p_content);
  v_status    text;
  v_count     int;
  v_msg_id    uuid;
  v_sender_name text;
  v_admin     RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_trimmed IS NULL OR v_trimmed = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
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

  INSERT INTO public.support_messages (support_thread_id, sender_id, content)
  VALUES (v_thread_id, v_user_id, v_trimmed)
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
$$;

-- STEG 6: close_support_thread — track who closed it
CREATE OR REPLACE FUNCTION public.close_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.support_threads
  SET status     = 'closed',
      closed_by  = auth.uid(),
      updated_at = now()
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found';
  END IF;
END;
$$;

-- STEG 7: reopen_support_thread (admin) — clear closed_by
CREATE OR REPLACE FUNCTION public.reopen_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.support_threads
  SET status     = 'open',
      closed_by  = NULL,
      updated_at = now()
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found';
  END IF;
END;
$$;

-- STEG 8: user_reopen_support_thread — the actual bug fix. Only succeeds
-- when the thread was closed by the user themselves. Since only admins
-- close threads today (no user-close path exists), closed_by is always an
-- admin's id for closed threads, so this now always raises for
-- admin-closed threads — the desired behavior.
CREATE OR REPLACE FUNCTION public.user_reopen_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_threads
  SET status     = 'open',
      closed_by  = NULL,
      updated_at = now()
  WHERE id = p_thread_id
    AND user_id = auth.uid()
    AND closed_by = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found_or_forbidden';
  END IF;
END;
$$;
